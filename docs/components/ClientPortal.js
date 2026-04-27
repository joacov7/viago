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

// ─── No token screen ─────────────────────────────────────────────────────────

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
          <p className="text-sm text-slate-500">Pedile a NATIVA que te envíe tu link personal de acceso por WhatsApp.</p>
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
        <p className="text-sm text-slate-500">Pedile a NATIVA que te envíe un nuevo link de acceso.</p>
      </div>
    </div>
  );
}

// ─── Client Portal App ───────────────────────────────────────────────────────

function ClientPortalApp({ client, config }) {
  const [tab, setTab] = React.useState('home');

  const tabs = [
    { id: 'home',     label: 'Inicio',      icon: '🏠' },
    { id: 'order',    label: 'Pedir',       icon: '💧' },
    { id: 'orders',   label: 'Mis pedidos', icon: '📦' },
    { id: 'invoices', label: 'Facturas',    icon: '📄' },
    ...(config.referralsEnabled ? [{ id: 'referrals', label: 'Referidos', icon: '🎁' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <span className="text-white text-sm">💧</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none">{config.companyName || 'NATIVA'}</p>
            <p className="text-xs text-slate-400 leading-none mt-0.5">{client.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-amber-600">{client.points || 0} pts</p>
          <p className="text-xs text-slate-400">mis puntos</p>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {tab === 'home'      && <PortalHome      client={client} config={config} onTab={setTab} />}
        {tab === 'order'     && <PortalOrder     client={client} onDone={() => setTab('orders')} />}
        {tab === 'orders'    && <PortalOrders    client={client} />}
        {tab === 'invoices'  && <PortalInvoices  client={client} />}
        {tab === 'referrals' && <PortalReferrals client={client} config={config} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${tab === t.id ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────

function PortalHome({ client, config, onTab }) {
  const pct = config.pointsForReward > 0
    ? Math.min(100, Math.round((client.points || 0) / config.pointsForReward * 100))
    : 0;

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <p className="text-blue-200 text-sm mb-1">¡Hola!</p>
        <h2 className="text-xl font-bold">{client.name}</h2>
        <p className="text-blue-200 text-xs mt-0.5">{client.code}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Mis puntos</h3>
          <span className="text-2xl font-bold text-amber-600">{client.points || 0}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {client.points || 0} / {config.pointsForReward || 100} pts para tu próximo premio
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onTab('order')}
          className="bg-blue-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-blue-700 transition-colors">
          <span className="text-2xl">💧</span>
          <span className="text-sm font-semibold">Hacer pedido</span>
        </button>
        <button onClick={() => onTab('orders')}
          className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-gray-50 text-slate-700 shadow-sm">
          <span className="text-2xl">📦</span>
          <span className="text-sm font-semibold">Mis pedidos</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Mi información</h3>
        <div className="space-y-2 text-sm">
          {client.address && (
            <div className="flex items-start gap-2">
              <span className="text-slate-400 flex-shrink-0">📍</span>
              <span className="text-slate-700">{client.address}{client.city ? `, ${client.city}` : ''}</span>
            </div>
          )}
          {client.phone && <div className="flex items-center gap-2"><span className="text-slate-400">📞</span><span className="text-slate-700">{client.phone}</span></div>}
          {client.email && <div className="flex items-center gap-2"><span className="text-slate-400">✉️</span><span className="text-slate-700">{client.email}</span></div>}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">🔄</span>
            <span className="text-slate-700 capitalize">{client.frequency || '—'}</span>
            {client.deliveryDay && <span className="text-slate-500">· {client.deliveryDay}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order ───────────────────────────────────────────────────────────────────

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

// ─── Orders ──────────────────────────────────────────────────────────────────

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

// ─── Invoices ────────────────────────────────────────────────────────────────

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

// ─── Referrals ───────────────────────────────────────────────────────────────

function PortalReferrals({ client, config }) {
  const defaultMsg =
    `Hola! Te recomiendo el servicio de agua de ${config.companyName || 'NATIVA'} 💧\n` +
    `Me tienen re bien surtido. Llamalos al ${config.phone || config.whatsappNumber || ''} ` +
    `y mencioná mi código *${client.referralCode || client.code || ''}* ` +
    `para que los dos ganemos crédito 🎁`;

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
      {/* Banner */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
        <p className="text-green-100 text-sm mb-1">Programa de referidos</p>
        <h2 className="text-xl font-bold">Referí y ganás</h2>
        <p className="text-green-100 text-sm mt-1">
          {config.referralMessage || 'Referí a un amigo y ambos ganan crédito en su cuenta.'}
        </p>
      </div>

      {/* Beneficios */}
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

      {/* Código */}
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

      {/* Mensaje editable */}
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
// ─── Root ─────────────────────────────────────────────────────────────────────

function ClientPortalRoot() {
  const [state, setState] = React.useState('loading'); // loading | no-token | not-found | ready
  const [client, setClient] = React.useState(null);
  const [config, setConfig] = React.useState({});

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
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

  if (state === 'loading') return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (state === 'no-token') return <NoAccess />;
  if (state === 'not-found') return <ClientNotFound />;
  return <ClientPortalApp client={client} config={config} />;
}

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(<ClientPortalRoot />);
