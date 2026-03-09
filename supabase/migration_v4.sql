-- ============================================
-- LEZZET-I ALA POS - MIGRATION V4
-- Staff PIN RPC + Atomic Restaurant Creation
-- IDEMPOTENT: Safe to re-run
-- Run AFTER migration_v3.sql in Supabase SQL Editor
-- ============================================

-- 1. VERIFY STAFF PIN (security definer, bypasses RLS)
drop function if exists verify_staff_pin(text, uuid);

create or replace function verify_staff_pin(
  p_pin text,
  p_restaurant_id uuid
) returns table (
  id uuid,
  name text,
  role text,
  restaurant_id uuid,
  active boolean
) as $fn$
begin
  return query
    select s.id, s.name, s.role, s.restaurant_id, s.active
    from staff s
    where s.pin = p_pin
      and s.restaurant_id = p_restaurant_id
      and s.active = true;
end;
$fn$ language plpgsql security definer;

-- 2. CREATE RESTAURANT + OWNER (atomic transaction)
drop function if exists create_restaurant_with_admin(text, text, text, text, text, text, text, text);

create or replace function create_restaurant_with_admin(
  p_name text,
  p_slug text,
  p_owner_name text,
  p_phone text,
  p_address text,
  p_email text,
  p_password text,
  p_plan text
) returns uuid as $fn$
declare
  new_restaurant_id uuid;
begin
  insert into restaurants (name, slug, owner_name, phone, address, license_plan, active)
  values (p_name, lower(trim(p_slug)), p_owner_name, p_phone, p_address, p_plan, true)
  returning id into new_restaurant_id;

  insert into platform_users (email, password_hash, name, role, restaurant_id)
  values (
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    coalesce(p_owner_name, p_name),
    'restoran_admin',
    new_restaurant_id
  );

  return new_restaurant_id;
end;
$fn$ language plpgsql security definer;

-- 3. SLUG UNIQUE CONSTRAINT
create unique index if not exists idx_restaurant_slug_unique on restaurants(slug);

-- 4. EMAIL NORMALIZATION INDEX
create unique index if not exists idx_platform_users_email_lower on platform_users(lower(email));

-- 5. FIX RLS POLICIES (ensure all tables allow CRUD via anon key)
alter table staff enable row level security;
drop policy if exists "Allow all on staff" on staff;
create policy "Allow all on staff" on staff for all using (true) with check (true);

alter table restaurants enable row level security;
drop policy if exists "Allow all on restaurants" on restaurants;
create policy "Allow all on restaurants" on restaurants for all using (true) with check (true);

alter table categories enable row level security;
drop policy if exists "Allow all on categories" on categories;
create policy "Allow all on categories" on categories for all using (true) with check (true);

alter table menu_items enable row level security;
drop policy if exists "Allow all on menu_items" on menu_items;
create policy "Allow all on menu_items" on menu_items for all using (true) with check (true);

alter table tables enable row level security;
drop policy if exists "Allow all on tables" on tables;
create policy "Allow all on tables" on tables for all using (true) with check (true);

alter table orders enable row level security;
drop policy if exists "Allow all on orders" on orders;
create policy "Allow all on orders" on orders for all using (true) with check (true);

alter table order_items enable row level security;
drop policy if exists "Allow all on order_items" on order_items;
create policy "Allow all on order_items" on order_items for all using (true) with check (true);

alter table floors enable row level security;
drop policy if exists "Allow all on floors" on floors;
create policy "Allow all on floors" on floors for all using (true) with check (true);

alter table modifier_groups enable row level security;
drop policy if exists "Allow all on modifier_groups" on modifier_groups;
create policy "Allow all on modifier_groups" on modifier_groups for all using (true) with check (true);

alter table modifier_options enable row level security;
drop policy if exists "Allow all on modifier_options" on modifier_options;
create policy "Allow all on modifier_options" on modifier_options for all using (true) with check (true);

alter table payments enable row level security;
drop policy if exists "Allow all on payments" on payments;
create policy "Allow all on payments" on payments for all using (true) with check (true);

alter table daily_closures enable row level security;
drop policy if exists "Allow all on daily_closures" on daily_closures;
create policy "Allow all on daily_closures" on daily_closures for all using (true) with check (true);
