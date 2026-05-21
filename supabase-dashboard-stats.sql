-- ============================================================
-- NATIVA — Dashboard stats: single-RPC aggregation
-- Reemplaza 3 queries full-table-scan desde el browser
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today      date      := CURRENT_DATE;
  v_month_start timestamptz := DATE_TRUNC('month', NOW());
  v_result     jsonb;
BEGIN
  SELECT jsonb_build_object(
    'totalClients',        (SELECT COUNT(*) FROM clients WHERE active = true),
    'newClientsThisMonth', (SELECT COUNT(*) FROM clients WHERE active = true AND created_at >= v_month_start),
    'todayOrdersCount',    (SELECT COUNT(*) FROM orders WHERE delivery_date = v_today),
    'todayPendingCount',   (SELECT COUNT(*) FROM orders WHERE delivery_date = v_today AND status = 'pendiente'),
    'todayDeliveredCount', (SELECT COUNT(*) FROM orders WHERE delivery_date = v_today AND status = 'entregado'),
    'todayRevenue',        (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE created_at::date = v_today AND payment_status = 'pagado'),
    'monthRevenue',        (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE created_at >= v_month_start AND payment_status = 'pagado'),
    'monthOrdersCount',    (SELECT COUNT(*) FROM orders WHERE delivery_date >= v_month_start::date),
    'pendingPayments',     (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE payment_status = 'pendiente'),
    'weekData', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date',    gs.d::text,
          'orders',  (SELECT COUNT(*) FROM orders  WHERE delivery_date = gs.d::date AND status = 'entregado'),
          'revenue', (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE created_at::date = gs.d::date AND payment_status = 'pagado')
        ) ORDER BY gs.d
      )
      FROM generate_series(v_today - 6, v_today, '1 day'::interval) AS gs(d)
    ),
    'repurchaseRate', (
      WITH order_counts AS (
        SELECT client_id, COUNT(*) AS cnt FROM orders GROUP BY client_id
      ),
      totals AS (
        SELECT
          COUNT(CASE WHEN cnt >= 1 THEN 1 END) AS with_orders,
          COUNT(CASE WHEN cnt >= 2 THEN 1 END) AS with_repeat
        FROM order_counts
      )
      SELECT CASE WHEN with_orders = 0 THEN 0
             ELSE ROUND(with_repeat::numeric / with_orders::numeric * 100)
             END
      FROM totals
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;

-- ============================================================
-- Índices recomendados para que las queries sean rápidas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date    ON orders (delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status  ON orders (delivery_date, status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_status ON invoices (created_at, payment_status);
CREATE INDEX IF NOT EXISTS idx_clients_active_created  ON clients (active, created_at);
