-- ============================================================
-- NATIVA — Migración: Rachas (Streaks)
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS order_streak     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pay_streak       integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS container_streak integer DEFAULT 0;

ALTER TABLE config
  ADD COLUMN IF NOT EXISTS streaks_enabled              boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS streak_order_reward_every    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_order_reward_pts      integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS streak_pay_reward_every      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_pay_reward_pts        integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS streak_container_reward_every integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_container_reward_pts  integer DEFAULT 75;

-- Inicializar en 0 los clientes existentes
UPDATE clients SET order_streak     = 0 WHERE order_streak     IS NULL;
UPDATE clients SET pay_streak       = 0 WHERE pay_streak       IS NULL;
UPDATE clients SET container_streak = 0 WHERE container_streak IS NULL;
