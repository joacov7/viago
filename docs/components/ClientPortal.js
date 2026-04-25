// NATIVA - Client Portal: login, orders, invoices, points

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Spinner() {
  return <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
}
function formatDate(s) {
  if (!s) return '-';
  return new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(s) {
  if (!s) return '-';
  return new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Client Login ─────────────────────────────────────────────────────────────

function ClientLogin({ onLogin }) {
  const [mode, setMode] = React.useState('magic'); // 'magic' | 'password'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await SupabaseDB.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://joacov7.github.io/viago/client.html' },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error } = await SupabaseDB.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onLogin(data.user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <span className="text-3xl">💧</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
          <p className="text-slate-500 text-sm mt-1">Portal de clientes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-semibold text-slate-900 mb-2">¡Revisá tu email!</h3>
              <p className="text-sm text-slate-500">Te enviamos un link para ingresar a <strong>{email}</strong>. Hacé click en el link del email.</p>
              <button onClick={() => setSent(false)} className="mt-4 text-sm text-blue-600 hover:text-blue-700">Usar otro email</button>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-slate-900 mb-1">Ingresar</h2>
              <p className="text-xs text-slate-500 mb-5">Usá el email con el que está registrada tu cuenta</p>

              {error && <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">{error}</div>}

              {mode === 'magic' ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="tu@email.com" required />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                    {loading ? 'Enviando...' : 'Enviar link de acceso'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="tu@email.com" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••" required />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </button>
                </form>
              )}

              <button onClick={() => { setMode(m => m === 'magic' ? 'password' : 'magic'); setError(''); }}
                className="mt-4 w-full text-sm text-center text-blue-600 hover:text-blue-700">
                {mode === 'magic' ? 'Ingresar con contraseña' : 'Ingresar con link por email'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Client Portal (logged in) ───────────────────────────────────────────────

function ClientPortalApp({ user }) {
  const [client, setClient] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('home');
  const [config, setConfig] = React.useState({});

  React.useEffect(() => {
    (async () => {
      const [clientData, cfg] = await Promise.all([
        DataService.getClientByUserId(user.id),
        DataService.getConfig(),
      ]);
      // If client not linked yet, try to link by email
      if (!clientData) {
        const { data: allClients } = await SupabaseDB.from('clients').select('*').eq('email', user.email).single();
        if (allClients) {
          await SupabaseDB.from('clients').update({ user_id: user.id }).eq('id', allClients.id);
          const linked = DataService._js(allClients);
          linked.userId = user.id;
          setClient(linked);
        }
      } else {
        setClient(clientData);
      }
      setConfig(cfg);
      setLoading(false);
    })();
  }, [user.id]);

  const handleLogout = async () => { await SupabaseDB.auth.signOut(); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="font-bold text-slate-900 text-lg mb-2">Cuenta no encontrada</h2>
          <p className="text-sm text-slate-500 mb-4">No encontramos un cliente registrado con el email <strong>{user.email}</strong>.</p>
          <p className="text-sm text-slate-400 mb-6">Contactá a NATIVA para vincular tu cuenta.</p>
          <button onClick={handleLogout} className="px-6 py-2.5 bg-gray-100 text-slate-700 font-medium rounded-xl hover:bg-gray-200">
            Salir
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'order', label: 'Pedir', icon: '💧' },
    { id: 'orders', label: 'Mis pedidos', icon: '📦' },
    { id: 'invoices', label: 'Facturas', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <span className="text-white text-sm">💧</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none">{config.companyName || 'NATIVA'}</p>
            <p className="text-xs text-slate-400 leading-none">{client.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-amber-600 font-bold">{client.points || 0} pts</p>
            <p className="text-xs text-slate-400">saldo</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-gray-100">
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-lg mx-auto">
        {tab === 'home'     && <ClientHome client={client} config={config} onTab={setTab} />}
        {tab === 'order'    && <ClientOrder client={client} onDone={() => setTab('orders')} />}
        {tab === 'orders'   && <ClientOrders client={client} />}
        {tab === 'invoices' && <ClientInvoices client={client} />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${tab === t.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Home tab ────────────────────────────────────────────────────────────────

function ClientHome({ client, config, onTab }) {
  const pct = config.pointsForReward > 0 ? Math.min(100, Math.round((client.points || 0) / config.pointsForReward * 100)) : 0;
  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <p className="text-blue-200 text-sm mb-1">¡Hola!</p>
        <h2 className="text-xl font-bold mb-0.5">{client.name}</h2>
        <p className="text-blue-200 text-xs">{client.code}</p>
      </div>

      {/* Points card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Mis puntos</h3>
          <span className="text-2xl font-bold text-amber-600">{client.points || 0}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">{client.points || 0} / {config.pointsForReward || 100} pts para tu próximo premio</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onTab('order')}
          className="bg-blue-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-blue-700 transition-colors">
          <span className="text-2xl">💧</span>
          <span className="text-sm font-semibold">Hacer pedido</span>
        </button>
        <button onClick={() => onTab('orders')}
          className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-gray-50 text-slate-700 transition-colors shadow-sm">
          <span className="text-2xl">📦</span>
          <span className="text-sm font-semibold">Mis pedidos</span>
        </button>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Mi información</h3>
        <div className="space-y-2 text-sm">
          {client.address && <div className="flex items-start gap-2"><span className="text-slate-400">📍</span><span className="text-slate-700">{client.address}{client.city ? `, ${client.city}` : ''}</span></div>}
          {client.phone   && <div className="flex items-center gap-2"><span className="text-slate-400">📞</span><span className="text-slate-700">{client.phone}</span></div>}
          {client.email   && <div className="flex items-center gap-2"><span className="text-slate-400">✉️</span><span className="text-slate-700">{client.email}</span></div>}
          <div className="flex items-center gap-2"><span className="text-slate-400">🔄</span><span className="text-slate-700 capitalize">{client.frequency || '—'}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Order tab ───────────────────────────────────────────────────────────────

function ClientOrder({ client, onDone }) {
  const [products, setProducts] = React.useState([]);
  const [items, setItems] = React.useState({});
  const [notes, setNotes] = React.useState('');
  const [date, setDate] = React.useState(DataService.today());
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => { DataService.getProducts().then(setProducts); }, []);

  const setQty = (id, qty) => setItems(prev => ({ ...prev, [id]: Math.max(0, qty) }));
  const orderItems = products.filter(p => (items[p.id] || 0) > 0).map(p => ({
    productId: p.id, productName: p.name, quantity: items[p.id],
    price: p.price, subtotal: p.price * items[p.id],
  }));
  const total = orderItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) { alert('Agregá al menos un producto'); return; }
    setLoading(true);
    await DataService.createOrder({ clientId: client.id, items: orderItems, total, deliveryDate: date, notes });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setItems({}); setNotes(''); onDone(); }, 2000);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Nuevo pedido</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm">{p.name}</p>
              <p className="text-xs text-blue-600 font-semibold">{formatCurrency(p.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQty(p.id, (items[p.id] || 0) - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-lg flex items-center justify-center">
                −
              </button>
              <span className="w-8 text-center font-semibold text-slate-900">{items[p.id] || 0}</span>
              <button type="button" onClick={() => setQty(p.id, (items[p.id] || 0) + 1)}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg flex items-center justify-center">
                +
              </button>
            </div>
          </div>
        ))}
      </div>

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
            placeholder="Horario preferido, instrucciones de entrega..." />
        </div>
      </div>

      {total > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between">
          <span className="font-medium text-blue-800">Total estimado</span>
          <span className="text-xl font-bold text-blue-900">{formatCurrency(total)}</span>
        </div>
      )}

      <button type="submit" disabled={loading || orderItems.length === 0}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
        {loading ? 'Enviando...' : `Confirmar pedido${total > 0 ? ' · ' + formatCurrency(total) : ''}`}
      </button>
    </form>
  );
}

// ─── My Orders tab ───────────────────────────────────────────────────────────

function ClientOrders({ client }) {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    DataService.getClientOrders(client.id).then(o => { setOrders(o); setLoading(false); });
  }, [client.id]);

  const statusLabel = { pendiente: 'Pendiente', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };
  const statusStyle = {
    pendiente:  'bg-amber-100 text-amber-700',
    en_camino:  'bg-blue-100 text-blue-700',
    entregado:  'bg-emerald-100 text-emerald-700',
    cancelado:  'bg-red-100 text-red-700',
  };

  if (loading) return <div className="py-16"><Spinner /></div>;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">Mis pedidos</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-slate-500">Todavía no hiciste ningún pedido</p>
        </div>
      ) : orders.map(o => (
        <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-slate-900">Pedido #{o.id}</p>
              <p className="text-xs text-slate-400">{formatDate(o.deliveryDate)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">{formatCurrency(o.total)}</p>
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

// ─── My Invoices tab ─────────────────────────────────────────────────────────

function ClientInvoices({ client }) {
  const [invoices, setInvoices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    DataService.getClientInvoices(client.id).then(i => { setInvoices(i); setLoading(false); });
  }, [client.id]);

  if (loading) return <div className="py-16"><Spinner /></div>;

  return (
    <div className="space-y-3">
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
              <p className="text-xs text-slate-400">{formatDateTime(inv.createdAt)}</p>
              <p className="text-xs text-slate-500 mt-1 capitalize">{inv.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900 text-lg">{formatCurrency(inv.total)}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inv.paymentStatus === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {inv.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function ClientPortalRoot() {
  const [user, setUser] = React.useState(undefined);

  React.useEffect(() => {
    SupabaseDB.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = SupabaseDB.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (user === null) return <ClientLogin onLogin={setUser} />;

  return <ClientPortalApp user={user} />;
}

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(<ClientPortalRoot />);
