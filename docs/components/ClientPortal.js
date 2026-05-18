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
  return active
    ? (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={color}>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    );
}
function NavIconDrop({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? color : 'none'}
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
    </svg>
  );
}
function NavIconBox({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function NavIconDoc({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
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
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  );
}
function NavIconShop({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke={active ? color : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
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
    ...(config.storeEnabled    ? [{ id: 'store',    label: 'Tienda',   Icon: NavIconShop }] : []),
    ...(config.referralsEnabled ? [{ id: 'referrals', label: 'Referidos', Icon: NavIconGift }] : []),
  ];

  return (
    <div className="min-h-screen pb-20"
      style={{ background: 'linear-gradient(155deg,#dbeafe 0%,#eff6ff 25%,#f8fafc 55%,#ffffff 80%)' }}>

      {/* ── Header ── */}
      <header className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
            </svg>
          </div>
          <span className="font-black text-slate-900 text-xl" style={{ letterSpacing: '0.06em' }}>
            {(config.companyName || 'NATIVA').toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white" style={{ background: primary }} />
          </div>
        </div>
      </header>

      <div className="px-5 max-w-lg mx-auto">
        {tab === 'home'      && <PortalHome      client={client} config={config} onTab={setTab} />}
        {tab === 'order'     && <PortalOrder     client={client} onDone={() => setTab('orders')} />}
        {tab === 'orders'    && <PortalOrders    client={client} />}
        {tab === 'invoices'  && <PortalInvoices  client={client} />}
        {tab === 'store'     && <PortalStore     client={client} config={config} onTab={setTab} />}
        {tab === 'referrals' && <PortalReferrals client={client} config={config} />}
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 pt-3 pb-2.5 relative transition-colors">
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: primary }} />
              )}
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
  const primary = config.primaryColor || '#2563EB';

  React.useEffect(() => { DataService.getProducts().then(setProducts); }, []);

  return (
    <div className="pt-3 pb-36 space-y-5">

      {/* ── Hero title ── */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">
          {config.tagline || 'Agua Pura de Vertiente, Directo a tu Hogar'}
        </h1>
      </div>

      {/* ── Products carousel ── */}
      <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {products.length === 0
          ? [1, 2, 3].map(i => (
              <div key={i} className="w-[120px] flex-shrink-0 bg-white rounded-2xl p-3 border border-gray-100"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
                <div className="w-full h-28 bg-gray-100 rounded-xl mb-2 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded mb-1.5 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
              </div>
            ))
          : products.map(p => (
              <button key={p.id} onClick={() => onTab('order')}
                className="w-[120px] flex-shrink-0 bg-white rounded-2xl p-3 text-left border border-gray-100 active:scale-95 transition-transform"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
                <div className="w-full h-28 rounded-xl mb-2 flex items-center justify-center overflow-hidden bg-slate-50">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-1"
                        onError={e => { e.target.style.display = 'none'; }} />
                    : <svg viewBox="0 0 24 24" width="44" height="44" fill={primary} opacity="0.25">
                        <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
                      </svg>
                  }
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-tight mb-0.5 line-clamp-2">{p.name}</p>
                <p className="text-sm font-bold text-slate-900">{fmt(p.price)}</p>
              </button>
            ))
        }
      </div>

      {/* ── CTA pill button ── */}
      <div className="flex justify-center pt-2">
        <button onClick={() => onTab('order')}
          className="flex items-center gap-2 px-10 py-4 rounded-full text-white font-bold text-base active:scale-95 transition-transform"
          style={{
            background: primary,
            boxShadow: `0 6px 24px ${primary}55`,
          }}>
          PEDIR AHORA
          <svg viewBox="0 0 24 24" width="17" height="17" fill="white">
            <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
          </svg>
        </button>
      </div>

      {/* ── Points card (compacta) ── */}
      {(client.points > 0 || config.pointsForReward > 0) && (() => {
        const pct = config.pointsForReward > 0
          ? Math.min(100, Math.round((client.points || 0) / config.pointsForReward * 100))
          : 0;
        const remaining = Math.max(0, (config.pointsForReward || 100) - (client.points || 0));
        return (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl leading-none">⭐</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="text-sm font-semibold text-slate-700">Mis puntos</p>
                <p className="font-bold text-amber-500 text-base leading-none">{client.points || 0}</p>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{remaining} pts para tu próximo premio</p>
            </div>
          </div>
        );
      })()}
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
    setTimeout(() => { setSuccess(false); setQtys({}); setNotes(''); onDone(); }, 2500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,.35)' }}>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">¡Pedido enviado!</h2>
        <p className="text-slate-400 text-sm">Te avisamos cuando esté en camino.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pt-3 pb-36 space-y-5">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nuevo pedido</h1>

      {/* Products list */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Spinner />
          <p className="mt-4 text-sm">Cargando productos...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          {products.map((p, i) => (
            <div key={p.id}
              className={`flex items-center gap-3 p-4 ${i < products.length - 1 ? 'border-b border-slate-50' : ''}`}>
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-50">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-0.5"
                      onError={e => { e.target.style.display = 'none'; }} />
                  : <svg viewBox="0 0 24 24" width="22" height="22" fill="#93c5fd">
                      <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
                    </svg>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-tight">{p.name}</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">{fmt(p.price)}</p>
              </div>
              {/* Qty stepper */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => setQty(p.id, (qtys[p.id] || 0) - 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform">
                  −
                </button>
                <span className="w-7 text-center font-bold text-slate-900 text-sm tabular-nums">
                  {qtys[p.id] || 0}
                </span>
                <button type="button" onClick={() => setQty(p.id, (qtys[p.id] || 0) + 1)}
                  className="w-8 h-8 rounded-full text-white font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date + Notes */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Fecha de entrega
          </label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Notas (opcional)
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Horario, instrucciones especiales..." />
        </div>
      </div>

      {/* Total */}
      {total > 0 && (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-blue-100"
          style={{ boxShadow: '0 4px 16px rgba(37,99,235,.08)' }}>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total estimado</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{fmt(total)}</p>
          </div>
          <div className="text-right text-xs text-slate-400 leading-relaxed">
            {orderItems.map(i => (
              <p key={i.productId}>{i.quantity}× {i.productName}</p>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="fixed bottom-16 left-0 right-0 px-5 z-20 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button type="submit" disabled={loading || orderItems.length === 0}
            className="w-full h-14 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)', boxShadow: '0 6px 24px rgba(37,99,235,.4)' }}>
            {loading
              ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando…</>
              : <>Confirmar pedido{total > 0 ? ` · ${fmt(total)}` : ''}</>
            }
          </button>
        </div>
      </div>
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

  const STATUS = {
    pendiente:  { label: 'Pendiente',   dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    en_camino:  { label: 'En camino',   dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
    entregado:  { label: 'Entregado',   dot: '#22c55e', bg: '#f0fdf4', text: '#166534' },
    cancelado:  { label: 'Cancelado',   dot: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
  };

  if (loading) return <div className="py-20"><Spinner /></div>;

  return (
    <div className="pt-3 pb-8 space-y-5">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <p className="font-semibold text-slate-700 mb-1">Sin pedidos aún</p>
          <p className="text-sm text-slate-400">Tus pedidos aparecerán acá cuando los hagas.</p>
        </div>
      ) : orders.map(o => {
        const s = STATUS[o.status] || { label: o.status, dot: '#94a3b8', bg: '#f8fafc', text: '#475569' };
        return (
          <div key={o.id} className="bg-white rounded-3xl border border-gray-100 p-5"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-black text-slate-900 text-base">Pedido #{o.id}</p>
                <p className="text-xs text-slate-400 mt-0.5">{fmtDate(o.deliveryDate)}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                style={{ background: s.bg, color: s.text }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                {s.label}
                {o.status === 'en_camino' && ' 🚚'}
              </span>
            </div>
            {(o.items || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {o.items.map((i, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-50 rounded-full text-xs font-medium text-slate-600 border border-slate-100">
                    {i.quantity}× {i.productName}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <p className="text-xs text-slate-400">Total</p>
              <p className="font-black text-slate-900 text-lg">{fmt(o.total)}</p>
            </div>
          </div>
        );
      })}
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

  if (loading) return <div className="py-20"><Spinner /></div>;

  const total = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const pending = invoices.filter(i => i.paymentStatus !== 'pagado').reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="pt-3 pb-8 space-y-5">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis facturas</h1>

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Histórico</p>
            <p className="text-xl font-black text-slate-900">{fmt(total)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Pendiente</p>
            <p className={`text-xl font-black ${pending > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{fmt(pending)}</p>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p className="font-semibold text-slate-700 mb-1">Sin facturas aún</p>
          <p className="text-sm text-slate-400">Tus facturas aparecerán acá.</p>
        </div>
      ) : invoices.map(inv => (
        <div key={inv.id} className="bg-white rounded-3xl border border-gray-100 p-5"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-black text-slate-900">{inv.number}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fmtDateTime(inv.createdAt)}</p>
              {inv.paymentMethod && (
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{inv.paymentMethod}</p>
              )}
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              inv.paymentStatus === 'pagado'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inv.paymentStatus === 'pagado' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {inv.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <p className="text-xs text-slate-400">Total</p>
            <p className="font-black text-slate-900 text-xl">{fmt(inv.total)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Store ───────────────────────────────────────────────────────────────────────

function PortalStore({ client, config, onTab }) {
  const [products, setProducts] = React.useState([]);
  const [cat, setCat] = React.useState('all');
  const [payMode, setPayMode] = React.useState('cash');
  const [cart, setCart] = React.useState({});
  const [screen, setScreen] = React.useState('browse');
  const [pointsUsed, setPointsUsed] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const primary = config.primaryColor || '#2563EB';

  const rate = config.pointsConversionRate || 1;
  const clientPoints = client.points || 0;

  React.useEffect(() => { DataService.getProducts().then(setProducts); }, []);

  const CAT_MAP = { bidon: 'agua', botella: 'agua', limpieza: 'limpieza', accesorio: 'accesorio' };
  const CATS = [
    { id: 'all',      label: 'Todos' },
    { id: 'agua',     label: '💧 Agua' },
    { id: 'limpieza', label: '🧴 Limpieza' },
    { id: 'accesorio',label: '🔧 Accesorios' },
  ];

  const ptPrice = (p) => Math.ceil(p.price / rate);
  const filtered = cat === 'all' ? products : products.filter(p => CAT_MAP[p.type] === cat);

  const setQty = (id, q) => setCart(prev => ({ ...prev, [id]: Math.max(0, q) }));

  const cartItems = products
    .filter(p => (cart[p.id] || 0) > 0)
    .map(p => ({ ...p, qty: cart[p.id], subtotal: p.price * cart[p.id], ptSubtotal: ptPrice(p) * cart[p.id] }));

  const totalCash = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const totalPts  = cartItems.reduce((s, i) => s + i.ptSubtotal, 0);
  const maxPts    = Math.min(clientPoints, Math.floor(totalCash / rate));
  const discount  = Math.min(pointsUsed * rate, totalCash);
  const finalTotal = Math.max(0, totalCash - discount);

  React.useEffect(() => {
    if (payMode !== 'mixed') setPointsUsed(0);
  }, [payMode, cart]);

  const handleConfirm = async () => {
    setLoading(true);
    const items = cartItems.map(i => ({
      productId: i.id, productName: i.name,
      quantity: i.qty, price: i.price, subtotal: i.subtotal,
    }));

    let ptsToRedeem = 0;
    let orderTotal = totalCash;

    if (payMode === 'points') {
      orderTotal = 0;
      ptsToRedeem = totalPts;
    } else if (payMode === 'mixed') {
      orderTotal = finalTotal;
      ptsToRedeem = pointsUsed;
    }

    await DataService.createOrder({
      clientId: client.id, items, total: orderTotal,
      deliveryDate: DataService.today(),
      notes: ptsToRedeem > 0 ? `Puntos canjeados: ${ptsToRedeem}` : '',
    });

    if (ptsToRedeem > 0) {
      await DataService.redeemPoints(client.id, ptsToRedeem, 'Canje en tienda');
      client.points = Math.max(0, clientPoints - ptsToRedeem);
    }

    setLoading(false);
    setScreen('success');
    setTimeout(() => { setCart({}); setPointsUsed(0); setPayMode('cash'); setScreen('browse'); onTab('orders'); }, 3000);
  };

  // ── Success screen
  if (screen === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center pt-10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,.35)' }}>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">¡Pedido enviado!</h2>
        <p className="text-slate-400 text-sm">Te avisamos cuando esté en camino.</p>
        {client.points != null && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-3">
            <p className="text-amber-700 font-bold text-lg">🪙 {client.points} pts</p>
            <p className="text-amber-500 text-xs">saldo actual</p>
          </div>
        )}
      </div>
    );
  }

  // ── Checkout screen
  if (screen === 'checkout') {
    return (
      <div className="pt-3 pb-36 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('browse')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="text-2xl font-black text-slate-900">Confirmar pedido</h1>
        </div>

        {/* Items */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          {cartItems.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i < cartItems.length - 1 ? 'border-b border-slate-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                <p className="text-xs text-slate-400">{item.qty}× {fmt(item.price)}</p>
              </div>
              <p className="font-bold text-slate-900 text-sm flex-shrink-0">{fmt(item.subtotal)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-600">Subtotal</p>
            <p className="font-black text-slate-900">{fmt(totalCash)}</p>
          </div>
        </div>

        {/* Pay mode */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-3" style={{ boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Forma de pago</p>
          <div className="flex gap-2">
            {[
              { id: 'cash',   label: '💵 Solo dinero' },
              { id: 'points', label: '🪙 Solo puntos', disabled: totalPts > clientPoints },
              { id: 'mixed',  label: '⚡ Mixto',       disabled: clientPoints === 0 },
            ].map(m => (
              <button key={m.id} onClick={() => !m.disabled && setPayMode(m.id)} disabled={!!m.disabled}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all disabled:opacity-40"
                style={payMode === m.id
                  ? { background: primary, color: 'white', borderColor: primary }
                  : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Points balance */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Tus puntos</span>
            <span className="font-bold text-amber-500">🪙 {clientPoints} pts = {fmt(clientPoints * rate)}</span>
          </div>

          {/* Points-only warning */}
          {payMode === 'points' && totalPts > clientPoints && (
            <p className="text-xs text-red-500">No tenés suficientes puntos ({totalPts} necesarios, tenés {clientPoints}).</p>
          )}

          {/* Mixed slider */}
          {payMode === 'mixed' && maxPts > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Puntos a usar</span>
                <span className="font-bold text-amber-500">🪙 {pointsUsed} pts = {fmt(pointsUsed * rate)}</span>
              </div>
              <input type="range" min="0" max={maxPts} value={pointsUsed}
                onChange={e => setPointsUsed(parseInt(e.target.value))}
                className="w-full accent-amber-400" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0</span><span>{maxPts} pts máx</span>
              </div>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100" style={{ boxShadow: '0 4px 16px rgba(37,99,235,.08)' }}>
          {payMode === 'mixed' && pointsUsed > 0 && (
            <div className="flex items-center justify-between text-sm text-amber-600 mb-2 pb-2 border-b border-slate-100">
              <span>Descuento puntos</span>
              <span className="font-bold">− {fmt(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total a pagar</p>
            <p className="text-2xl font-black text-slate-900">
              {payMode === 'points' ? '🪙 ' + totalPts + ' pts' : fmt(payMode === 'mixed' ? finalTotal : totalCash)}
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="fixed bottom-16 left-0 right-0 px-5 z-20 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button onClick={handleConfirm}
              disabled={loading || (payMode === 'points' && totalPts > clientPoints)}
              className="w-full h-14 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{ background: `linear-gradient(135deg,${primary},${primary}cc)`, boxShadow: `0 6px 24px ${primary}55` }}>
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
                : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Browse screen
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  return (
    <div className="pt-3 pb-36 space-y-4">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tienda & Canje</h1>

      {/* Points banner */}
      {clientPoints > 0 && (
        <div className="rounded-2xl p-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#451a03,#78350f)', border: '1px solid #92400e' }}>
          <span className="text-2xl leading-none flex-shrink-0">🪙</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{clientPoints} puntos disponibles</p>
            <p className="text-xs" style={{ color: '#fcd34d' }}>= {fmt(clientPoints * rate)} de descuento</p>
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={cat === c.id
              ? { background: primary, color: 'white' }
              : { background: '#f1f5f9', color: '#475569' }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Products */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <span className="text-4xl mb-3">📦</span>
          <p className="text-sm">Sin productos en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const qty = cart[p.id] || 0;
            return (
              <div key={p.id} className="bg-white rounded-3xl border border-gray-100 p-4 flex items-center gap-3"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-slate-50">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-1"
                        onError={e => { e.target.style.display = 'none'; }} />
                    : <svg viewBox="0 0 24 24" width="28" height="28" fill="#93c5fd">
                        <path d="M12 2C8.43 2 6 6.32 6 9.5c0 3.86 2.69 7 6 7s6-3.14 6-7C18 6.32 15.57 2 12 2z"/>
                      </svg>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm leading-tight">{p.name}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: primary }}>{fmt(p.price)}</p>
                  <p className="text-xs text-amber-500 font-medium">🪙 {ptPrice(p)} pts</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setQty(p.id, qty - 1)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform">
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-slate-900 text-sm tabular-nums">{qty}</span>
                  <button onClick={() => setQty(p.id, qty + 1)}
                    className="w-8 h-8 rounded-full text-white font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: `linear-gradient(135deg,${primary},${primary}cc)` }}>
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-5 z-20 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button onClick={() => setScreen('checkout')}
              className="w-full h-14 rounded-full text-white font-bold text-base flex items-center justify-center gap-3 transition-all"
              style={{ background: `linear-gradient(135deg,${primary},${primary}cc)`, boxShadow: `0 6px 24px ${primary}55` }}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">{cartCount}</span>
              Ver carrito · {fmt(totalCash)}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Referrals ───────────────────────────────────────────────────────────────────

function PortalReferrals({ client, config }) {
  const referralLink = `${window.location.href.split('?')[0]}?ref=${client.referralCode || client.code || ''}`;
  const template = config.referralShareMessage ||
    'Hola! Te recomiendo el agua de {empresa}\nMe tienen re bien surtido. Entrá acá y dejá tus datos: {link}\n¡Los dos ganamos!';
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

  const handleWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  const handleCopyMsg = () => { navigator.clipboard.writeText(msg); setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000); };
  const handleCopyCode = () => { navigator.clipboard.writeText(client.referralCode || client.code || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="pt-3 pb-8 space-y-5">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Referidos</h1>

      {/* Hero */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', boxShadow: '0 8px 24px rgba(34,197,94,.3)' }}>
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-2 w-14 h-14 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-green-100 text-sm font-medium mb-1">Programa de referidos</p>
          <h2 className="text-2xl font-black mb-2">Referí y ganás</h2>
          <p className="text-green-100 text-sm leading-relaxed">
            {config.referralMessage || 'Referí a un amigo y ambos ganan crédito en su cuenta.'}
          </p>
        </div>
      </div>

      {/* Rewards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <p className="text-2xl font-black text-emerald-600">${config.referralReferrerReward || 500}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">crédito para vos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <p className="text-2xl font-black text-blue-600">{config.referralReferredDiscount || 10}%</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">descuento para tu amigo</p>
        </div>
      </div>

      {/* Code */}
      {(client.referralCode || client.code) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Tu código</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-black text-slate-900 flex-1 tracking-wider">
              {client.referralCode || client.code}
            </span>
            <button onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={copied
                ? { background: '#f0fdf4', color: '#16a34a' }
                : { background: '#f8fafc', color: '#475569' }}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Share */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Mensaje para compartir</p>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none leading-relaxed" />
        <div className="flex gap-2">
          <button onClick={handleWA}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,.35)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M11.973 2C6.465 2 2 6.465 2 11.973c0 1.89.525 3.658 1.438 5.168L2 22l4.978-1.408A9.96 9.96 0 0 0 11.973 22C17.481 22 22 17.535 22 12.027 22 6.519 17.481 2 11.973 2z" opacity=".3"/>
            </svg>
            Compartir por WhatsApp
          </button>
          <button onClick={handleCopyMsg}
            className="px-4 py-3.5 rounded-2xl text-sm font-bold border transition-all"
            style={copiedMsg
              ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }
              : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}>
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
