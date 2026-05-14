// NATIVA - Client Portal: token-based access (no login required)
// Access URL: client.html?token=XXXXXXXXXX

function Spinner() {
  return <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />;
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
}
function fmtDate(s) {
  if (!s) return '-';
  return new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDateTime(s) {
  if (!s) return '-';
  return new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── No token screen ─────────────────────────────────────────────────────

function NoAccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <span className="text-3xl">💧</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-4xl mb-3">🔗</div>
          <h2 className="font-bold text-slate-900 mb-2">Link de acceso requerido</h2>
          <p className="text-sm text-slate-500">Pedíle a NATIVA que te envíe tu link personal de acceso por WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}

function ClientNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm text-center">
        <div className="text-4xl mb-3">❌</div>
        <h2 className="font-bold text-slate-900 mb-2">Link inválido o expirado</h2>
        <p className="text-sm text-slate-500">Pedíle a NATIVA que te envíe un nuevo link de acceso.</p>
      </div>
    </div>
  );
}

// ─── Nav SVG icons ────────────────────────────────────────────────────────────

function NavIconHome({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function NavIconDrop({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={active ? color : 'none'}
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
    </svg>
  );
}
function NavIconBox({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function NavIconDoc({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
function NavIconGift({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  );
}

// ─── Client Portal App ───────────────────────────────────────────────────────────────

function ClientPortalApp({ client, config }) {
  const [tab, setTab] = React.useState('home');
  const primary = config.primaryColor || '#2563EB';

  const tabs = [
    { id: 'home',     label: 'Inicio',   Icon: NavIconHome },
    { id: 'order',    label: 'Pedir',    Icon: NavIconDrop },
    { id: 'orders',   label: 'Pedidos',  Icon: NavIconBox },
    { id: 'invoices', label: 'Facturas', Icon: NavIconDoc },
    ...(config.referralsEnabled ? [{ id: 'referrals', label: 'Referidos', Icon: NavIconGift }] : []),
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg,#fff 0%,#F4F7FA 100%)' }}>
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${primary},#00D2FF)` }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
            </svg>
          </div>
          <span className="font-black text-slate-900 text-base" style={{ letterSpacing: '0.12em' }}>
            {(config.companyName || 'NATIVA').toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#00D2FF' }} />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-amber-500 leading-none">{client.points || 0} pts</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">{client.name.split(' ')[0]}</p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {tab === 'home'      && <PortalHome      client={client} config={config} onTab={setTab} />}
        {tab === 'order'     && <PortalOrder     client={client} onDone={() => setTab('orders')} />}
        {tab === 'orders'    && <PortalOrders    client={client} />}
        {tab === 'invoices'  && <PortalInvoices  client={client} />}
        {tab === 'referrals' && <PortalReferrals client={client} config={config} />}
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors">
              <t.Icon active={active} color={primary} />
              <span className="text-xs font-medium" style={{ color: active ? primary : '#94a3b8' }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function PortalHome({ client, config, onTab }) {
  const [products, setProducts] = React.useState([]);
  const primary = config.primaryColor || '#0052D4';
  const pct = config.pointsForReward > 0
    ? Math.min(100, Math.round((client.points || 0) / config.pointsForReward * 100))
    : 0;
  const remaining = Math.max(0, (config.pointsForReward || 100) - (client.points || 0));

  React.useEffect(() => { DataService.getProducts().then(setProducts); }, []);

  return (
    <div className="-mx-4 -mt-2">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden px-5 pt-6 pb-5"
        style={{ background: `linear-gradient(145deg,${primary} 0%,#0ea5e9 55%,#00D2FF 100%)` }}>
        {config.clientHeroImage && (
          <img src={config.clientHeroImage} alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none"
            onError={e => { e.target.style.display = 'none'; }} />
        )}
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-0.5">
            ¡Hola, {client.name.split(' ')[0]}! 👋
          </p>
          <h1 className="text-white text-xl font-extrabold leading-snug mb-4 tracking-tight">
            Agua Pura de Vertiente,<br />
            <span style={{ color: '#9CECFB' }}>{config.tagline || 'Directo a tu Hogar'}</span>
          </h1>

          {/* Weather + Hydration */}
          <div className="bg-white/15 rounded-2xl p-3.5 flex items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-2xl leading-none">☀️</span>
              <div>
                <p className="text-white text-xs font-semibold">24°C · Caluroso</p>
                <p className="text-white/60 text-xs">Hoy</p>
              </div>
            </div>
            <div className="w-px self-stretch bg-white/25 mx-3" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-white/80 text-xs font-medium">Hidratación</p>
                <p className="text-xs font-bold" style={{ color: '#9CECFB' }}>65%</p>
              </div>
              <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: '65%', background: 'linear-gradient(90deg,#9CECFB,#00D2FF)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-32">
        {/* ── Points card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl leading-none">⭐</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-sm font-semibold text-slate-800">Mis puntos</p>
              <p className="font-bold text-amber-500 text-lg leading-none">{client.points || 0}</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{remaining} pts para tu próximo premio</p>
          </div>
        </div>

        {/* ── Products carousel ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-900">Nuestros Productos</p>
            <button onClick={() => onTab('order')}
              className="text-xs font-semibold" style={{ color: primary }}>
              Ver todos →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {products.length === 0
              ? [1, 2, 3].map(i => (
                  <div key={i} className="w-36 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 snap-start">
                    <div className="w-full h-24 bg-gray-100 rounded-xl mb-3 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                  </div>
                ))
              : products.map(p => (
                  <button key={p.id} onClick={() => onTab('order')}
                    className="w-36 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-3.5 text-left snap-start active:scale-95 transition-transform">
                    <div className="w-full h-24 rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#EFF6FF,#E0F2FE)' }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-xl"
                            onError={e => { e.target.style.display='none'; }} />
                        : <svg viewBox="0 0 24 24" width="40" height="40" fill={primary} opacity="0.5">
                            <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
                          </svg>
                      }
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-tight mb-1 line-clamp-2">{p.name}</p>
                    <p className="text-sm font-bold" style={{ color: primary }}>{fmt(p.price)}</p>
                  </button>
                ))
            }
          </div>
        </div>

        {/* ── My info ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm">Mi información</h3>
          <div className="space-y-2.5 text-sm">
            {client.address && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">📍</span>
                <span className="text-slate-700 leading-tight">{client.address}{client.city ? `, ${client.city}` : ''}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📞</span>
                <span className="text-slate-700">{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">✉️</span>
                <span className="text-slate-700">{client.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">🔄</span>
              <span className="text-slate-700 capitalize">{client.frequency || '—'}</span>
              {client.deliveryDay && <span className="text-slate-500">· {client.deliveryDay}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-16 left-0 right-0 px-5 z-20 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button onClick={() => onTab('order')}
            className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg,#0052D4 0%,#00D2FF 100%)',
              boxShadow: '0 8px 24px rgba(0,82,212,0.35)',
            }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
            </svg>
            PEDIR AHORA
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order ──────────────────────────────────────────────────────────────────────

function PortalOrder({ client, onDone }) {
  const [products, setProducts] = React.useState([]);
  const [qtys, setQtys] = React.useState({});
  const [notes, setNotes] = React.useState('');
  const [date, setDate] = React.useState(DataService.today());
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => { DataService.getProducts().then(setProducts); }, []);

  const setQty = (id, q) => setQtys(prev => ({ ...prev, [id]: Math.max(0, q) }));

  const orderItems = products.filter(p => (qtys[p.id] || 0) > 0).map(p => ({
    productId: p.id, productName: p.name,
    quantity: qtys[p.id], price: p.price, subtotal: p.price * qtys[p.id],
  }));
  const total = orderItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) { alert('Agregá al menos un producto'); return; }
    setLoading(true);
    await DataService.createOrder({ clientId: client.id, items: orderItems, total, deliveryDate: date, notes });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setQtys({}); setNotes(''); onDone(); }, 2000);
  };

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">¡Pedido enviado!</h2>
        <p className="text-slate-500 text-sm">Te avisamos cuando esté en camino.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <h2 className="text-lg font-bold text-slate-900">Nuevo pedido</h2>

      {products.length === 0 ? (
        <div className="text-center py-8 text-slate-400">Cargando productos...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">{p.name}</p>
                <p className="text-xs text-blue-600 font-semibold">{fmt(p.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQty(p.id, (qtys[p.id] || 0) - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-lg flex items-center justify-center">
                  −
                </button>
                <span className="w-8 text-center font-semibold text-slate-900">{qtys[p.id] || 0}</span>
                <button type="button" onClick={() => setQty(p.id, (qtys[p.id] || 0) + 1)}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg flex items-center justify-center">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha deseada de entrega</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Horario, instrucciones especiales..." />
        </div>
      </div>

      {total > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between">
          <span className="font-medium text-blue-800">Total estimado</span>
          <span className="text-xl font-bold text-blue-900">{fmt(total)}</span>
        </div>
      )}

      <button type="submit" disabled={loading || orderItems.length === 0}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
        {loading ? 'Enviando...' : `Confirmar pedido${total > 0 ? ' · ' + fmt(total) : ''}`}
      </button>
    </form>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function PortalOrders({ client }) {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    DataService.getClientOrders(client.id).then(o => { setOrders(o); setLoading(false); });
  }, [client.id]);

  const statusLabel = { pendiente: 'Pendiente', en_camino: 'En camino 🚚', entregado: 'Entregado ✅', cancelado: 'Cancelado' };
  const statusStyle = {
    pendiente: 'bg-amber-100 text-amber-700',
    en_camino: 'bg-blue-100 text-blue-700',
    entregado: 'bg-emerald-100 text-emerald-700',
    cancelado: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="py-16"><Spinner /></div>;

  return (
    <div className="space-y-3 pt-2">
      <h2 className="text-lg font-bold text-slate-900">Mis pedidos</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-slate-500">Todavía no hiciste ningún pedido</p>
        </div>
      ) : orders.map(o => (
        <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-semibold text-slate-900">Pedido #{o.id}</p>
              <p className="text-xs text-slate-400">{fmtDate(o.deliveryDate)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">{fmt(o.total)}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[o.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabel[o.status] || o.status}
              </span>
            </div>
          </div>
          {(o.items || []).length > 0 && (
            <p className="text-xs text-slate-500">{o.items.map(i => `${i.quantity}x ${i.productName}`).join(' · ')}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Invoices ──────────────────────────────────────────────────────────────

function PortalInvoices({ client }) {
  const [invoices, setInvoices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    DataService.getClientInvoices(client.id).then(i => { setInvoices(i); setLoading(false); });
  }, [client.id]);

  if (loading) return <div className="py-16"><Spinner /></div>;

  return (
    <div className="space-y-3 pt-2">
      <h2 className="text-lg font-bold text-slate-900">Mis facturas</h2>
      {invoices.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-slate-500">No hay facturas registradas</p>
        </div>
      ) : invoices.map(inv => (
        <div key={inv.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{inv.number}</p>
              <p className="text-xs text-slate-400">{fmtDateTime(inv.createdAt)}</p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{inv.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900 text-lg">{fmt(inv.total)}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inv.paymentStatus === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {inv.paymentStatus === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Referrals ───────────────────────────────────────────────────────────────────

function PortalReferrals({ client, config }) {
  const referralLink = `${window.location.href.split('?')[0]}?ref=${client.referralCode || client.code || ''}`;
  const template = config.referralShareMessage ||
    'Hola! Te recomiendo el agua de {empresa} 💧\nMe tienen re bien surtido. Entrá acá y dejá tus datos: {link}\n¡Los dos ganamos crédito! 🎁';
  const resolved = template
    .replace(/{empresa}/g, config.companyName || 'NATIVA')
    .replace(/{telefono}/g, config.phone || config.whatsappNumber || '')
    .replace(/{codigo}/g, client.referralCode || client.code || '')
    .replace(/{nombre}/g, client.name || '')
    .replace(/{link}/g, referralLink);
  const defaultMsg = resolved.includes(referralLink) ? resolved : `${resolved}\n${referralLink}`;

  const [msg, setMsg] = React.useState(defaultMsg);
  const [copied, setCopied] = React.useState(false);
  const [copiedMsg, setCopiedMsg] = React.useState(false);

  const handleWA = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyMsg = () => {
    navigator.clipboard.writeText(msg);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(client.referralCode || client.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
        <p className="text-green-100 text-sm mb-1">Programa de referidos</p>
        <h2 className="text-xl font-bold">Referí y ganás</h2>
        <p className="text-green-100 text-sm mt-1">
          {config.referralMessage || 'Referí a un amigo y ambos ganan crédito en su cuenta.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">${config.referralReferrerReward || 500}</p>
          <p className="text-xs text-slate-500 mt-1">crédito para vos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{config.referralReferredDiscount || 10}%</p>
          <p className="text-xs text-slate-500 mt-1">descuento para tu amigo</p>
        </div>
      </div>

      {(client.referralCode || client.code) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tu código</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-slate-900 flex-1">{client.referralCode || client.code}</span>
            <button onClick={handleCopyCode}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-slate-700">Mensaje para compartir</p>
        <textarea
          value={msg}
          onChange={e => setMsg(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none leading-relaxed"
        />
        <div className="flex gap-2">
          <button onClick={handleWA}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
            <span>💬</span> Abrir WhatsApp
          </button>
          <button onClick={handleCopyMsg}
            className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${copiedMsg ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 text-slate-600 hover:bg-gray-50'}`}>
            {copiedMsg ? '✓' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-slate-400">Podés editar el mensaje antes de enviarlo.</p>
      </div>
    </div>
  );
}
// ─── Referral Landing (amigo que recibió el link) ────────────────────────────────────────

function ReferralLanding({ refCode, config }) {
  const [referrer, setReferrer] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', phone: '', address: '' });
  const [state, setState] = React.useState('form'); // form | sending | done
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    DataService.getClientByReferral(refCode).then(c => setReferrer(c));
  }, [refCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setState('sending');
    try {
      await DataService.createLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        source: 'referido',
        notes: referrer ? `Referido por: ${referrer.name} (ID:${referrer.id})` : `Código referido: ${refCode}`,
      });
      setState('done');
    } catch (err) {
      alert('Error: ' + err.message);
      setState('form');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
            <span className="text-3xl">💧</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{config.companyName || 'NATIVA'}</h1>
          {referrer && (
            <p className="text-sm text-slate-500 mt-1">
              <span className="font-semibold text-green-700">{referrer.name}</span> te recomienda nuestro servicio 🎁
            </p>
          )}
        </div>

        {state === 'done' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¡Gracias!</h2>
            <p className="text-sm text-slate-500">
              Recibimos tus datos. Te contactamos a la brevedad para coordinar tu primer pedido.
            </p>
            {referrer && (
              <p className="text-xs text-green-600 mt-3 font-medium">
                Vas a recibir {config.referralReferredDiscount || 10}% de descuento en tu primera factura.
              </p>
            )}
            {config.whatsappNumber && (
              <a href={`https://wa.me/${(config.whatsappNumber).replace(/\D/g,'')}?text=${encodeURIComponent(`Hola! Soy ${form.name}, acabo de dejar mis datos en el formulario${referrer ? ` (me recomendó ${referrer.name})` : ''}. ¡Quedo a disposición!`)}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                <span>💬</span> Escribirle al negocio
              </a>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-slate-900 mb-1">Solicitá tu servicio</h2>
            <p className="text-xs text-slate-400 mb-4">
              Completá tus datos y te llamamos para coordinar.
              {config.referralReferredDiscount > 0 && ` Recibís ${config.referralReferredDiscount}% de descuento en tu primera factura.`}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                placeholder="Nombre completo *"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel"
                placeholder="Teléfono"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Dirección de entrega"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="submit" disabled={state === 'sending' || !form.name.trim()}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                {state === 'sending' ? 'Enviando...' : 'Quiero el servicio'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────────────
function ClientPortalRoot() {
  const [state, setState] = React.useState('loading');
  const [client, setClient] = React.useState(null);
  const [config, setConfig] = React.useState({});
  const [refCode, setRefCode] = React.useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    // Token: URL tiene prioridad, sino lee localStorage (para PWA instalada)
    const token = params.get('token') || localStorage.getItem('nativa_client_token');

    if (!token && ref) {
      setRefCode(ref);
      DataService.getConfig().then(cfg => { setConfig(cfg); setState('referral'); });
      return;
    }
    if (!token) { setState('no-token'); return; }

    Promise.all([
      DataService.getClientByToken(token),
      DataService.getConfig(),
    ]).then(([c, cfg]) => {
      setConfig(cfg);
      if (!c) { setState('not-found'); return; }
      setClient(c);
      setState('ready');
    }).catch(() => setState('not-found'));
  }, []);

  if (state === 'loading')  return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (state === 'referral') return <ReferralLanding refCode={refCode} config={config} />;
  if (state === 'no-token') return <NoAccess />;
  if (state === 'not-found') return <ClientNotFound />;
  return <ClientPortalApp client={client} config={config} />;
}

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(<ClientPortalRoot />);
