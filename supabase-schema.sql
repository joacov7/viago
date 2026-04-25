-- ============================================================
-- NATIVA - Supabase Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Config (fila única)
create table if not exists config (
  id integer primary key default 1,
  company_name text default 'NATIVA',
  tagline text default 'Agua que llega. Siempre.',
  phone text default '',
  email text default '',
  address text default '',
  city text default '',
  primary_color text default '#2563EB',
  points_per_order integer default 10,
  points_for_reward integer default 100,
  free_product_id integer,
  referral_bonus integer default 50,
  mp_public_key text default '',
  whatsapp_number text default '',
  payment_methods jsonb default '["efectivo","transferencia","mercadopago"]',
  admin_user_id uuid
);
insert into config (id) values (1) on conflict (id) do nothing;

-- Zonas
create table if not exists zones (
  id bigserial primary key,
  name text not null,
  color text default '#3B82F6',
  delivery_days jsonb default '[]',
  created_at timestamptz default now()
);

-- Productos
create table if not exists products (
  id bigserial primary key,
  name text not null,
  type text default 'bidon',
  price decimal(10,2) default 0,
  unit text default 'unidad',
  active boolean default true,
  created_at timestamptz default now()
);

-- Clientes
create table if not exists clients (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  address text default '',
  city text default '',
  phone text default '',
  email text default '',
  zone_id bigint references zones(id) on delete set null,
  type text default 'hogar',
  frequency text default 'semanal',
  delivery_day text default '',
  points integer default 0,
  referral_code text unique,
  referred_by bigint references clients(id) on delete set null,
  active boolean default true,
  notes text default '',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Pedidos
create table if not exists orders (
  id bigserial primary key,
  client_id bigint references clients(id) on delete cascade not null,
  status text default 'pendiente',
  items jsonb default '[]',
  total decimal(10,2) default 0,
  delivery_date date,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Facturas
create table if not exists invoices (
  id bigserial primary key,
  number text unique not null,
  order_id bigint references orders(id) on delete set null,
  client_id bigint references clients(id) on delete cascade not null,
  total decimal(10,2) default 0,
  payment_method text default 'efectivo',
  payment_status text default 'pendiente',
  mp_payment_id text,
  mp_payment_link text,
  paid_at timestamptz,
  notes text default '',
  items jsonb default '[]',
  created_at timestamptz default now()
);

-- Historial de puntos
create table if not exists points_history (
  id bigserial primary key,
  client_id bigint references clients(id) on delete cascade not null,
  points integer not null,
  action text default 'earned',
  description text default '',
  created_at timestamptz default now()
);

-- Promociones
create table if not exists promotions (
  id bigserial primary key,
  name text not null,
  type text default 'primera_compra',
  discount_type text default 'porcentaje',
  discount_value decimal(10,2) default 0,
  zone_id bigint references zones(id) on delete set null,
  min_quantity integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table config enable row level security;
alter table zones enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table orders enable row level security;
alter table invoices enable row level security;
alter table points_history enable row level security;
alter table promotions enable row level security;

-- Función: verifica si el usuario actual es el admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select auth.uid() = admin_user_id from config where id = 1),
    false
  )
$$;

-- Config: admin full + cualquier auth puede leer (para primer login)
create policy "config_admin_all" on config for all using (is_admin()) with check (is_admin());
create policy "config_read_auth"  on config for select using (auth.role() = 'authenticated');

-- Zonas: admin full, clientes solo lectura
create policy "zones_admin"       on zones for all    using (is_admin()) with check (is_admin());
create policy "zones_client_read" on zones for select using (auth.role() = 'authenticated');

-- Productos: admin full, clientes solo lectura
create policy "products_admin"       on products for all    using (is_admin()) with check (is_admin());
create policy "products_client_read" on products for select using (auth.role() = 'authenticated');

-- Clientes: admin full, cliente lee/edita su propio registro
create policy "clients_admin"       on clients for all    using (is_admin()) with check (is_admin());
create policy "clients_self_read"   on clients for select using (user_id = auth.uid());
create policy "clients_self_update" on clients for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Pedidos: admin full, cliente lee/crea los suyos
create policy "orders_admin"         on orders for all    using (is_admin()) with check (is_admin());
create policy "orders_client_read"   on orders for select using (client_id in (select id from clients where user_id = auth.uid()));
create policy "orders_client_insert" on orders for insert with check (client_id in (select id from clients where user_id = auth.uid()));

-- Facturas: admin full, cliente solo lee las suyas
create policy "invoices_admin"       on invoices for all    using (is_admin()) with check (is_admin());
create policy "invoices_client_read" on invoices for select using (client_id in (select id from clients where user_id = auth.uid()));

-- Puntos: admin full, cliente solo lee los suyos
create policy "points_admin"       on points_history for all    using (is_admin()) with check (is_admin());
create policy "points_client_read" on points_history for select using (client_id in (select id from clients where user_id = auth.uid()));

-- Promociones: admin full, clientes solo lectura
create policy "promotions_admin"       on promotions for all    using (is_admin()) with check (is_admin());
create policy "promotions_client_read" on promotions for select using (auth.role() = 'authenticated');
