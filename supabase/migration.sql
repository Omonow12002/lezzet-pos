-- ============================================
-- LEZZET-I ALA POS - DATABASE SCHEMA
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- MENU ITEMS
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  category_id uuid references categories(id) on delete set null,
  has_modifiers boolean default false,
  image text,
  active boolean default true,
  created_at timestamptz default now()
);

-- MODIFIER GROUPS
create table if not exists modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('checkbox', 'radio')),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- MODIFIER OPTIONS
create table if not exists modifier_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references modifier_groups(id) on delete cascade,
  name text not null,
  extra_price numeric(10,2) default 0,
  sort_order int default 0
);

-- FLOORS
create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int default 0
);

-- TABLES
create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'bos' check (status in ('bos', 'dolu', 'odeme_bekliyor')),
  floor_id uuid references floors(id) on delete cascade,
  current_total numeric(10,2) default 0,
  opened_at timestamptz,
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references tables(id) on delete set null,
  table_name text not null,
  status text not null default 'yeni' check (status in ('yeni', 'hazirlaniyor', 'hazir', 'tamamlandi')),
  total numeric(10,2) default 0,
  prepayment numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  menu_item_name text not null,
  menu_item_price numeric(10,2) not null,
  quantity int not null default 1,
  modifiers jsonb default '[]'::jsonb,
  note text,
  sent_to_kitchen boolean default false,
  created_at timestamptz default now()
);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  amount numeric(10,2) not null,
  method text not null check (method in ('nakit', 'kredi_karti', 'bolunmus')),
  created_at timestamptz default now()
);

-- ============================================
-- ENABLE REALTIME ON KEY TABLES
-- ============================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table tables;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table categories;

-- ============================================
-- RLS POLICIES
-- ============================================
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table modifier_groups enable row level security;
alter table modifier_options enable row level security;
alter table floors enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

create policy "Allow all on categories" on categories for all using (true) with check (true);
create policy "Allow all on menu_items" on menu_items for all using (true) with check (true);
create policy "Allow all on modifier_groups" on modifier_groups for all using (true) with check (true);
create policy "Allow all on modifier_options" on modifier_options for all using (true) with check (true);
create policy "Allow all on floors" on floors for all using (true) with check (true);
create policy "Allow all on tables" on tables for all using (true) with check (true);
create policy "Allow all on orders" on orders for all using (true) with check (true);
create policy "Allow all on order_items" on order_items for all using (true) with check (true);
create policy "Allow all on payments" on payments for all using (true) with check (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Floors
insert into floors (name, sort_order) values
  ('Salon', 1), ('Teras', 2), ('Üst Kat', 3);

-- Categories
insert into categories (name, icon, sort_order) values
  ('Kebaplar', '🥩', 1),
  ('Dürümler', '🌯', 2),
  ('İçecekler', '🥤', 3),
  ('Tatlılar', '🍮', 4),
  ('Başlangıçlar', '🥗', 5),
  ('Izgara', '🔥', 6);

-- Menu Items
insert into menu_items (name, description, price, category_id, has_modifiers) values
  ('Adana Kebap', 'Odun ateşinde pişmiş acılı kebap', 280, (select id from categories where name='Kebaplar'), true),
  ('Urfa Kebap', 'Acısız el yapımı kebap', 280, (select id from categories where name='Kebaplar'), true),
  ('İskender', 'Tereyağlı İskender kebap', 320, (select id from categories where name='Kebaplar'), true),
  ('Patlıcan Kebap', 'Közlenmiş patlıcan ile', 300, (select id from categories where name='Kebaplar'), true),
  ('Beyti Sarma', 'Lavaş içinde beyti kebabı', 340, (select id from categories where name='Kebaplar'), true),
  ('Adana Dürüm', 'Lavaş içinde Adana kebabı', 200, (select id from categories where name='Dürümler'), true),
  ('Urfa Dürüm', 'Lavaş içinde Urfa kebabı', 200, (select id from categories where name='Dürümler'), true),
  ('Tavuk Dürüm', 'Izgara tavuk dürüm', 180, (select id from categories where name='Dürümler'), true),
  ('Lahmacun', 'İnce hamur lahmacun', 120, (select id from categories where name='Dürümler'), true),
  ('Ayran', null, 40, (select id from categories where name='İçecekler'), false),
  ('Kola', null, 60, (select id from categories where name='İçecekler'), false),
  ('Su', null, 20, (select id from categories where name='İçecekler'), false),
  ('Çay', null, 30, (select id from categories where name='İçecekler'), false),
  ('Limonata', null, 50, (select id from categories where name='İçecekler'), false),
  ('Künefe', 'Sıcak servis künefe', 150, (select id from categories where name='Tatlılar'), false),
  ('Baklava', 'Antep fıstıklı baklava', 180, (select id from categories where name='Tatlılar'), false),
  ('Sütlaç', null, 90, (select id from categories where name='Tatlılar'), false),
  ('Kazandibi', null, 90, (select id from categories where name='Tatlılar'), false),
  ('Mercimek Çorbası', 'Günlük taze çorba', 80, (select id from categories where name='Başlangıçlar'), false),
  ('Humus', null, 70, (select id from categories where name='Başlangıçlar'), false),
  ('Cacık', null, 60, (select id from categories where name='Başlangıçlar'), false),
  ('Ezme', null, 50, (select id from categories where name='Başlangıçlar'), false),
  ('Pide Karışık', 'Karışık malzemeli pide', 220, (select id from categories where name='Izgara'), false),
  ('Kuşbaşı', null, 260, (select id from categories where name='Izgara'), false),
  ('Tavuk Kanat', null, 180, (select id from categories where name='Izgara'), false);

-- Modifier Groups
insert into modifier_groups (name, type, sort_order) values
  ('İçindekiler', 'checkbox', 1),
  ('Acı Seviyesi', 'radio', 2),
  ('Ekstralar', 'checkbox', 3);

-- Modifier Options
insert into modifier_options (group_id, name, extra_price, sort_order) values
  ((select id from modifier_groups where name='İçindekiler'), 'Soğansız', 0, 1),
  ((select id from modifier_groups where name='İçindekiler'), 'Maydanozsuz', 0, 2),
  ((select id from modifier_groups where name='İçindekiler'), 'Domatessiz', 0, 3),
  ((select id from modifier_groups where name='Acı Seviyesi'), 'Acısız', 0, 1),
  ((select id from modifier_groups where name='Acı Seviyesi'), 'Az Acılı', 0, 2),
  ((select id from modifier_groups where name='Acı Seviyesi'), 'Normal', 0, 3),
  ((select id from modifier_groups where name='Acı Seviyesi'), 'Çok Acılı', 0, 4),
  ((select id from modifier_groups where name='Ekstralar'), 'Extra Kaşar', 20, 1),
  ((select id from modifier_groups where name='Ekstralar'), 'Double Et', 50, 2),
  ((select id from modifier_groups where name='Ekstralar'), 'Extra Sos', 10, 3);

-- Tables (12 tables across 3 floors)
insert into tables (name, status, floor_id) values
  ('Masa 1', 'bos', (select id from floors where name='Salon')),
  ('Masa 2', 'bos', (select id from floors where name='Salon')),
  ('Masa 3', 'bos', (select id from floors where name='Salon')),
  ('Masa 4', 'bos', (select id from floors where name='Salon')),
  ('Masa 5', 'bos', (select id from floors where name='Salon')),
  ('Masa 6', 'bos', (select id from floors where name='Salon')),
  ('Masa 7', 'bos', (select id from floors where name='Teras')),
  ('Masa 8', 'bos', (select id from floors where name='Teras')),
  ('Masa 9', 'bos', (select id from floors where name='Teras')),
  ('Masa 10', 'bos', (select id from floors where name='Teras')),
  ('Masa 11', 'bos', (select id from floors where name='Üst Kat')),
  ('Masa 12', 'bos', (select id from floors where name='Üst Kat'));
