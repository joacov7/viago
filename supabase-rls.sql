-- ============================================================
-- NATIVA — Seguridad: Row Level Security (RLS)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- ANTES de correr este script:
--   1. Creá tu usuario administrador en Supabase Dashboard
--      → Authentication → Users → Add user
--      (o desde la app NATIVA usando "Crear cuenta de administrador")
--   2. Desactivá "Confirm email" en Authentication → Settings
--      si no querés confirmar via email.
-- ============================================================

-- ─── Helper: extrae el token del portal del cliente del header ────────────
CREATE OR REPLACE FUNCTION get_client_token()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.headers', true), '')::jsonb->>'x-client-token',
    ''
  );
$$;

-- ─── Habilitar RLS en todas las tablas ───────────────────────────────────
ALTER TABLE config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones              ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads              ENABLE ROW LEVEL SECURITY;

-- Estas tablas pueden no existir si no se crearon aún (ignorar el error si falla)
DO $$ BEGIN
  ALTER TABLE driver_locations  ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE machines          ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE dispensers        ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE maintenance_logs  ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE costs             ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE balance_movements ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── ADMIN: acceso completo para usuarios autenticados ───────────────────
-- (El admin inicia sesión con Supabase Auth → rol 'authenticated')
CREATE POLICY "admin_config"       ON config           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_zones"        ON zones            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_products"     ON products         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_clients"      ON clients          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_orders"       ON orders           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_invoices"     ON invoices         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_points"       ON points_history   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_promotions"   ON promotions       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_leads"        ON leads            FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$ BEGIN
  CREATE POLICY "admin_driver_loc"   ON driver_locations  FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_machines"     ON machines          FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_dispensers"   ON dispensers        FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_maintenance"  ON maintenance_logs  FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_costs"        ON costs             FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "admin_balance"      ON balance_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;

-- ─── PÚBLICO (anon sin token): sólo datos públicos ────────────────────────
CREATE POLICY "public_config"      ON config      FOR SELECT TO anon USING (true);
CREATE POLICY "public_products"    ON products    FOR SELECT TO anon USING (active = true);
CREATE POLICY "public_zones"       ON zones       FOR SELECT TO anon USING (true);
CREATE POLICY "public_promotions"  ON promotions  FOR SELECT TO anon USING (active = true);

DO $$ BEGIN
  CREATE POLICY "public_driver_loc" ON driver_locations FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;

-- ─── PORTAL DEL CLIENTE (anon + x-client-token header) ──────────────────
-- El portal envía el access_token del cliente en el header 'x-client-token'.
-- Las políticas filtran los datos a únicamente ese cliente.

-- Ver su propia fila de cliente
CREATE POLICY "client_self_read" ON clients
  FOR SELECT TO anon
  USING (active = true AND access_token = get_client_token() AND get_client_token() != '');

-- Ver/crear sus propios pedidos
CREATE POLICY "client_orders_read" ON orders
  FOR SELECT TO anon
  USING (client_id = (
    SELECT id FROM clients
    WHERE access_token = get_client_token() AND active = true AND get_client_token() != ''
    LIMIT 1
  ));

CREATE POLICY "client_orders_insert" ON orders
  FOR INSERT TO anon
  WITH CHECK (client_id = (
    SELECT id FROM clients
    WHERE access_token = get_client_token() AND active = true AND get_client_token() != ''
    LIMIT 1
  ));

-- Ver su historial de puntos
CREATE POLICY "client_points_read" ON points_history
  FOR SELECT TO anon
  USING (client_id = (
    SELECT id FROM clients
    WHERE access_token = get_client_token() AND active = true AND get_client_token() != ''
    LIMIT 1
  ));

-- Agregar movimiento de puntos (canje en tienda)
CREATE POLICY "client_points_insert" ON points_history
  FOR INSERT TO anon
  WITH CHECK (client_id = (
    SELECT id FROM clients
    WHERE access_token = get_client_token() AND active = true AND get_client_token() != ''
    LIMIT 1
  ));

-- Ver sus propias facturas
CREATE POLICY "client_invoices_read" ON invoices
  FOR SELECT TO anon
  USING (client_id = (
    SELECT id FROM clients
    WHERE access_token = get_client_token() AND active = true AND get_client_token() != ''
    LIMIT 1
  ));

-- Actualizar su propia fila (para actualizar puntos, datos de contacto, etc.)
CREATE POLICY "client_self_update" ON clients
  FOR UPDATE TO anon
  USING (access_token = get_client_token() AND active = true AND get_client_token() != '')
  WITH CHECK (access_token = get_client_token() AND active = true);

-- ─── REPARTIDOR: driver_locations (sin autenticación especial) ──────────
-- El repartidor actualiza su ubicación usando la clave anon sin token de cliente.
-- La seguridad se basa en que sólo quien tiene acceso a la app de reparto puede hacerlo.
DO $$ BEGIN
  CREATE POLICY "driver_upsert_location" ON driver_locations
    FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL; END $$;

-- ─── Revocar acceso directo anon a tablas sensibles (no listadas arriba) ─
-- Las tablas de costos, máquinas, comodatos, leads solo son accesibles para admin.
-- No se necesitan políticas anon adicionales para estas tablas.

-- ============================================================
-- Verificación: ejecutar esto para ver el estado de RLS
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ============================================================
