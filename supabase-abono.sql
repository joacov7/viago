-- ============================================================
-- NATIVA — Migración: Abono por cliente + source en pedidos
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS abono jsonb DEFAULT '[]';

-- Inicializar en array vacío los clientes existentes
UPDATE clients SET abono = '[]' WHERE abono IS NULL;

-- Origen del pedido: 'manual' | 'agenda' | 'abono' | 'portal'
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

UPDATE orders SET source = 'manual' WHERE source IS NULL;
