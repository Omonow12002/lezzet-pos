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
