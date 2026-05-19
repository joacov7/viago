-- ============================================================
-- NATIVA — Migración: Abono por cliente
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS abono jsonb DEFAULT '[]';

-- Inicializar en array vacío los clientes existentes
UPDATE clients SET abono = '[]' WHERE abono IS NULL;
