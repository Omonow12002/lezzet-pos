-- ============================================
-- LEZZET-I ALA POS - V6 ARCHITECTURE MIGRATION
-- Idempotent. Run AFTER migration_complete_fix.sql
-- ============================================

-- 1. payments.type: distinguish prepayment vs final payment
ALTER TABLE payments ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'payment';
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_type_check
  CHECK (type IN ('payment', 'prepayment'));

-- Backfill: convert orders.prepayment into payment rows
INSERT INTO payments (id, order_id, amount, method, type, restaurant_id, created_at)
SELECT gen_random_uuid(), o.id, o.prepayment, 'nakit', 'prepayment', o.restaurant_id, o.created_at
FROM orders o
WHERE o.prepayment > 0
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.type = 'prepayment');

-- 2. order_items.payment_status: item-level payment tracking
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_payment_status_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_payment_status_check
  CHECK (payment_status IN ('unpaid', 'paid'));

-- 3. Atomic RPC: create_order_with_items
DROP FUNCTION IF EXISTS create_order_with_items(uuid, uuid, text, uuid, text, jsonb);
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_restaurant_id uuid, p_table_id uuid, p_table_name text,
  p_staff_id uuid, p_status text, p_items jsonb
) RETURNS uuid AS $fn$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_total numeric := 0;
  v_item jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total := v_total + (v_item->>'price')::numeric * (v_item->>'quantity')::int;
  END LOOP;

  INSERT INTO orders (id, table_id, table_name, status, total, restaurant_id, staff_id, prepayment)
  VALUES (v_order_id, p_table_id, p_table_name, p_status, v_total, p_restaurant_id, p_staff_id, 0);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, menu_item_price,
      quantity, modifiers, note, sent_to_kitchen, status, restaurant_id, payment_status)
    VALUES (
      gen_random_uuid(), v_order_id,
      NULLIF(v_item->>'menu_item_id', '')::uuid,
      v_item->>'name', (v_item->>'price')::numeric,
      (v_item->>'quantity')::int,
      COALESCE(v_item->'modifiers', '[]'::jsonb),
      NULLIF(v_item->>'note', ''),
      true, 'sent', p_restaurant_id, 'unpaid'
    );
  END LOOP;

  UPDATE tables SET status = 'occupied', opened_at = COALESCE(opened_at, now())
  WHERE id = p_table_id AND status = 'available';

  RETURN v_order_id;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atomic RPC: record_prepayment
DROP FUNCTION IF EXISTS record_prepayment(uuid, numeric, text, uuid);
CREATE OR REPLACE FUNCTION record_prepayment(
  p_order_id uuid, p_amount numeric, p_method text, p_staff_id uuid DEFAULT NULL
) RETURNS uuid AS $fn$
DECLARE
  v_pid uuid := gen_random_uuid();
  v_rid uuid;
BEGIN
  SELECT restaurant_id INTO v_rid FROM orders WHERE id = p_order_id;
  INSERT INTO payments (id, order_id, amount, method, type, restaurant_id, staff_id)
  VALUES (v_pid, p_order_id, p_amount, p_method, 'prepayment', v_rid, p_staff_id);
  UPDATE orders SET prepayment = COALESCE(prepayment, 0) + p_amount WHERE id = p_order_id;
  RETURN v_pid;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atomic RPC: pay_order_items (item-based payment)
DROP FUNCTION IF EXISTS pay_order_items(uuid, uuid[], numeric, text, uuid, numeric, text);
CREATE OR REPLACE FUNCTION pay_order_items(
  p_order_id uuid, p_item_ids uuid[], p_amount numeric, p_method text,
  p_staff_id uuid DEFAULT NULL, p_discount_amount numeric DEFAULT 0, p_discount_reason text DEFAULT NULL
) RETURNS uuid AS $fn$
DECLARE
  v_pid uuid := gen_random_uuid();
  v_rid uuid;
  v_table_id uuid;
BEGIN
  SELECT restaurant_id, table_id INTO v_rid, v_table_id FROM orders WHERE id = p_order_id;
  INSERT INTO payments (id, order_id, amount, method, type, restaurant_id, staff_id, discount_amount, discount_reason)
  VALUES (v_pid, p_order_id, p_amount, p_method, 'payment', v_rid, p_staff_id, p_discount_amount, p_discount_reason);
  UPDATE order_items SET payment_status = 'paid' WHERE id = ANY(p_item_ids) AND order_id = p_order_id;
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = p_order_id AND payment_status = 'unpaid') THEN
    UPDATE orders SET status = 'paid' WHERE id = p_order_id;
    IF v_table_id IS NOT NULL THEN
      UPDATE tables SET status = 'available', current_total = 0, opened_at = NULL WHERE id = v_table_id;
    END IF;
  END IF;
  RETURN v_pid;
END; $fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. View: remaining amount from payments
CREATE OR REPLACE VIEW order_remaining AS
SELECT o.id AS order_id, o.total,
  COALESCE(SUM(p.amount), 0) AS total_paid,
  GREATEST(0, o.total - COALESCE(SUM(p.amount), 0)) AS remaining
FROM orders o LEFT JOIN payments p ON p.order_id = o.id
GROUP BY o.id, o.total;

-- 7. Realtime for payments
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE payments; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
