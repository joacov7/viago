// NATIVA - Dashboard module: stats, charts and quick overview

function Dashboard({ onNavigate }) {
  const [stats, setStats] = React.useState(null);
  const [todayOrders, setTodayOrders] = React.useState([]);

  React.useEffect(() => {
    setStats(DataService.getDashboardStats());
    const orders = DataService.getTodayOrders();
    const clients = DataService.getClients(true);
    const zones = DataService.getZones();
    setTodayOrders(orders.map(o => ({
      ...o,
      client: clients.find(c => c.id === o.clientId),
      zone: zones.find(z => z.id === (clients.find(c => c.id === o.clientId) || {}).zoneId),
    })));
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: 'Pedidos hoy', value: stats.todayOrdersCount, sub: `${stats.todayDeliveredCount} entregados`, icon: 'package', color: 'blue', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Ingresos del día', value: DataService.formatCurrency(stats.todayRevenue), sub: `${DataService.formatCurrency(stats.monthRevenue)} este mes`, icon: 'dollarSign', color: 'emerald', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { label: 'Clientes activos', value: stats.totalClients, sub: `+${stats.newClientsThisMonth} este mes`, icon: 'users', color: 'violet', bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { label: 'Cobros pendientes', value: DataService.formatCurrency(stats.pendingPayments), sub: 'Por cobrar', icon: 'wallet', color: 'amber', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  ];

  const maxRevenue = Math.max(...stats.weekData.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon name={card.icon} size={20} className={card.iconColor} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-none">{card.value}</div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
            <div className="text-xs text-slate-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Ingresos últimos 7 días</h3>
              <p className="text-sm text-slate-500 mt-0.5">Cobros confirmados</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Icon name="trendingUp" size={16} />
              <span className="text-sm font-semibold">{DataService.formatCurrency(stats.monthRevenue)}</span>
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-2 h-40">
            {stats.weekData.map((day, i) => {
              const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const isToday = i === stats.weekData.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div
                    className="relative w-full rounded-t-lg flex-shrink-0 transition-all duration-300"
                    style={{ height: `${Math.max(heightPct, 4)}%`, background: isToday ? 'linear-gradient(180deg, #2563eb, #1d4ed8)' : '#e2e8f0' }}
                    title={DataService.formatCurrency(day.revenue)}
                  >
                    {day.revenue > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-600 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {DataService.formatCurrency(day.revenue)}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium capitalize ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{day.day}</span>
                </div>
              );
            })}
          </div>

          {/* Orders per day dots */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {stats.weekData.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-xs text-slate-500">{day.orders}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1 text-center">Entregas por día</p>
        </div>

        {/* Today summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Hoy</h3>
            <span className="text-xs text-slate-400">{DataService.formatDate(DataService.today())}</span>
          </div>

          {/* Progress ring */}
          <div className="flex items-center justify-center py-4">
            <ProgressRing
              total={stats.todayOrdersCount}
              done={stats.todayDeliveredCount}
              pending={stats.todayPendingCount}
            />
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">Entregados</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{stats.todayDeliveredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-600">Pendientes</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{stats.todayPendingCount}</span>
            </div>
          </div>

          <div className="mt-5">
            <Btn onClick={() => onNavigate('delivery')} variant="primary" className="w-full justify-center" icon="truck">
              Ver reparto
            </Btn>
          </div>
        </div>
      </div>

      {/* Today's deliveries preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-slate-900">Entregas de hoy</h3>
          <Btn onClick={() => onNavigate('delivery')} variant="ghost" size="sm" icon="chevRight">Ver todo</Btn>
        </div>

        {todayOrders.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-slate-400 text-sm">No hay entregas programadas para hoy</p>
            <Btn onClick={() => onNavigate('orders')} variant="secondary" size="sm" className="mt-3" icon="plus">Crear pedido</Btn>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayOrders.slice(0, 5).map(order => (
              <DeliveryPreviewRow key={order.id} order={order} />
            ))}
            {todayOrders.length > 5 && (
              <div className="px-6 py-3 text-center">
                <button onClick={() => onNavigate('delivery')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Ver {todayOrders.length - 5} más
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-slate-900 mb-4">Acciones rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Nuevo cliente', icon: 'users', module: 'clients', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { label: 'Nuevo pedido', icon: 'package', module: 'orders', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
            { label: 'Ver reparto', icon: 'truck', module: 'delivery', color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
            { label: 'Facturación', icon: 'fileText', module: 'billing', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
          ].map(a => (
            <button
              key={a.module}
              onClick={() => onNavigate(a.module)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${a.color}`}
            >
              <Icon name={a.icon} size={22} />
              <span className="text-xs font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ total, done, pending }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="56" cy="56" r={r} fill="none" stroke="#10b981" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-900">{pct}%</div>
        <div className="text-xs text-slate-500">{done}/{total}</div>
      </div>
    </div>
  );
}

function DeliveryPreviewRow({ order }) {
  const statusStyle = {
    pendiente:  'bg-amber-100 text-amber-700',
    entregado:  'bg-emerald-100 text-emerald-700',
    cancelado:  'bg-red-100 text-red-700',
  };
  return (
    <div className="flex items-center gap-4 px-6 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {order.client?.name || `Cliente #${order.clientId}`}
        </p>
        <p className="text-xs text-slate-400 truncate">{order.client?.address || '—'} · {order.zone?.name || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-slate-900">{DataService.formatCurrency(order.total)}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>
    </div>
  );
}
