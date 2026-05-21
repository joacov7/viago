-- ============================================================
-- NATIVA — Security & Integrity Fixes
-- Ejecutar DESPUÉS de supabase-rls.sql y todas las migraciones
-- ============================================================

-- ─── 1. Eliminar admin_password (campo muerto, expuesto públicamente) ────────
ALTER TABLE config DROP COLUMN IF EXISTS admin_password;

-- ─── 2. Sequences para numeración race-free ──────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq;
CREATE SEQUENCE IF NOT EXISTS client_code_seq;

-- Inicializar desde el máximo actual
DO $$
DECLARE max_inv integer; max_cli integer;
BEGIN
  SELECT COALESCE(MAX(CAST(REPLACE(number, 'FAC-', '') AS integer)), 0)
    INTO max_inv FROM invoices WHERE number ~ '^FAC-[0-9]+$';
  PERFORM setval('invoice_number_seq', max_inv + 1, false);

  SELECT COALESCE(MAX(CAST(REPLACE(code, 'NAT-', '') AS integer)), 0)
    INTO max_cli FROM clients WHERE code ~ '^NAT-[0-9]+$';
  PERFORM setval('client_code_seq', max_cli + 1, false);
END $$;

-- ─── 3. next_invoice_number — race-free (usa sequence) ───────────────────────
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 'FAC-' || LPAD(nextval('invoice_number_seq')::text, 4, '0');
$$;

-- ─── 4. next_client_code — race-free (usa sequence) ──────────────────────────
CREATE OR REPLACE FUNCTION next_client_code()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 'NAT-' || LPAD(nextval('client_code_seq')::text, 3, '0');
$$;

-- ─── 5. add_points — atómico, autorizado, sin read-modify-write ──────────────
-- Admin (authenticated): puede sumar/restar puntos a cualquier cliente.
-- Portal cliente (anon): solo puede restar puntos (canje) a su propio cliente.
CREATE OR REPLACE FUNCTION add_points(
  p_client_id   bigint,
  p_points      integer,
  p_action      text,
  p_description text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_caller_id bigint;
BEGIN
  IF current_user = 'anon' THEN
    SELECT id INTO v_caller_id FROM clients
    WHERE access_token = get_client_token() AND active = true AND get_client_token() != ''
    LIMIT 1;
    IF v_caller_id IS NULL OR v_caller_id != p_client_id THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
    IF p_points > 0 THEN
      RAISE EXCEPTION 'Unauthorized: anon can only redeem (negative) points';
    END IF;
  END IF;

  UPDATE clients SET points = COALESCE(points, 0) + p_points WHERE id = p_client_id;
  INSERT INTO points_history (client_id, points, action, description)
  VALUES (p_client_id, p_points, p_action, p_description);
END;
$$;

-- ─── 6. redeem_points — atómico con row-level lock ───────────────────────────
-- Verifica saldo suficiente y deduce en una sola transacción.
CREATE OR REPLACE FUNCTION redeem_points(
  p_client_id   bigint,
  p_points      integer,
  p_description text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current integer;
  v_caller_id bigint;
BEGIN
  IF current_user = 'anon' THEN
    SELECT id INTO v_caller_id FROM clients
    WHERE access_token = get_client_token() AND active = true AND get_client_token() != ''
    LIMIT 1;
    IF v_caller_id IS NULL OR v_caller_id != p_client_id THEN RETURN false; END IF;
  END IF;

  SELECT points INTO v_current FROM clients WHERE id = p_client_id FOR UPDATE;
  IF v_current IS NULL OR v_current < p_points THEN RETURN false; END IF;

  UPDATE clients SET points = points - p_points WHERE id = p_client_id;
  INSERT INTO points_history (client_id, points, action, description)
  VALUES (p_client_id, -p_points, 'redeemed', p_description);
  RETURN true;
END;
$$;

-- ─── 7. adjust_balance — atómico con movimiento en la misma transacción ──────
CREATE OR REPLACE FUNCTION adjust_balance(
  p_client_id   bigint,
  p_amount      decimal,
  p_description text
) RETURNS decimal LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_balance decimal;
BEGIN
  UPDATE clients
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id = p_client_id
    RETURNING balance INTO v_new_balance;

  INSERT INTO balance_movements (client_id, amount, description)
  VALUES (p_client_id, p_amount, p_description);

  RETURN v_new_balance;
END;
$$;

-- ─── 8. Grants ────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION next_invoice_number  TO authenticated;
GRANT EXECUTE ON FUNCTION next_client_code     TO authenticated;
GRANT EXECUTE ON FUNCTION add_points           TO authenticated, anon;
GRANT EXECUTE ON FUNCTION redeem_points        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION adjust_balance       TO authenticated;

-- ─── 9. Trigger: proteger campos sensibles de updates anon ───────────────────
-- La política client_self_update no puede restringir columnas (limitación de RLS).
-- Este trigger actúa como capa de protección: restaura todos los campos al valor
-- original y solo permite modificar: phone, email, address, city, notes.
CREATE OR REPLACE FUNCTION protect_client_sensitive_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone   text := NEW.phone;
  v_email   text := NEW.email;
  v_address text := NEW.address;
  v_city    text := NEW.city;
  v_notes   text := NEW.notes;
BEGIN
  IF current_user = 'anon' THEN
    NEW := OLD;            -- Restaurar todo
    NEW.phone   := v_phone;   -- Permitir solo estas columnas
    NEW.email   := v_email;
    NEW.address := v_address;
    NEW.city    := v_city;
    NEW.notes   := v_notes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_client_sensitive_fields_trigger ON clients;
CREATE TRIGGER protect_client_sensitive_fields_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION protect_client_sensitive_fields();

-- ─── 10. Corregir client_orders_insert: forzar status pendiente ──────────────
DROP POLICY IF EXISTS "client_orders_insert" ON orders;
CREATE POLICY "client_orders_insert" ON orders
  FOR INSERT TO anon
  WITH CHECK (
    client_id = (
      SELECT id FROM clients
      WHERE access_token = get_client_token()
        AND active = true AND get_client_token() != ''
      LIMIT 1
    )
    AND status = 'pendiente'
    AND total >= 0
  );

-- ─── 11. Eliminar client_points_insert (reemplazado por RPCs atómicas) ───────
-- Los canjes van por redeem_points(), los puntos ganados van por add_points().
-- El insert directo queda prohibido para anon.
DROP POLICY IF EXISTS "client_points_insert" ON points_history;

-- ============================================================
-- Verificación post-ejecución
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'clients'::regclass;
-- ============================================================
