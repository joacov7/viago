// NATIVA - Root App component

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('NATIVA error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="alertCircle" size={32} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Algo salió mal</h1>
            <p className="text-slate-500 mb-4 text-sm">{this.state.error?.message || 'Error inesperado'}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700">
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [authChecking, setAuthChecking] = React.useState(true);
  const [config, setConfig] = React.useState({ companyName: 'NATIVA' });
  const [activeModule, setActiveModule] = React.useState('dashboard');
  const [navParams, setNavParams] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);

  // Bootstrap: check existing Supabase session, then subscribe to auth changes
  React.useEffect(() => {
    DataService.getSession().then(session => {
      if (session) setLoggedIn(true);
      setAuthChecking(false);
    }).catch(() => setAuthChecking(false));

    const sub = DataService.onAuthChange((event, session) => {
      if (event === 'SIGNED_IN' && session) { setLoggedIn(true); }
      if (event === 'SIGNED_OUT') { setLoggedIn(false); setInitialized(false); DataService._configCache = null; }
      if (event === 'TOKEN_REFRESHED') { /* session silently refreshed — no action needed */ }
    });
    return () => sub.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!loggedIn) return;
    DataService.getConfig().then(cfg => {
      setConfig(cfg);
      setInitialized(true);
    }).catch(() => setInitialized(true));
  }, [loggedIn]);

  const navigate = (module, params = null) => {
    setActiveModule(module);
    setNavParams(params);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await DataService.signOut();
    // onAuthChange listener will set loggedIn = false
  };

  const moduleTitle = {
    dashboard: 'Dashboard', clients: 'Clientes', prospecting: 'Captación',
    orders: 'Pedidos', delivery: 'Reparto', zones: 'Zonas', billing: 'Facturación',
    loyalty: 'Fidelización', products: 'Productos', config: 'Configuración',
    costs: 'Costos', dispensers: 'Comodatos', machines: 'Máquinas', liveTracking: 'En vivo', mapView: 'Mapa',
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':    return <Dashboard onNavigate={navigate} />;
      case 'clients':      return <Clients onNavigate={navigate} navParams={navParams} />;
      case 'prospecting':  return <Prospecting />;
      case 'orders':    return <Orders onNavigate={navigate} navParams={navParams} />;
      case 'delivery':  return <Delivery onNavigate={navigate} />;
      case 'zones':     return <Zones />;
      case 'billing':   return <Billing navParams={navParams} />;
      case 'loyalty':   return <Loyalty />;
      case 'products':  return <Products />;
      case 'config':      return <Config onConfigChange={cfg => setConfig(cfg)} />;
      case 'costs':       return <Costs />;
      case 'dispensers':  return <Dispensers />;
      case 'machines':      return <Machines />;
      case 'liveTracking':  return <LiveTracking />;
      case 'mapView':       return <MapView />;
      default:              return <Dashboard onNavigate={navigate} />;
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!loggedIn) return <Auth onLogin={() => setLoggedIn(true)} />;

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <Icon name="droplets" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
          <p className="text-slate-400 text-sm mt-1">Cargando...</p>
          <div className="mt-4 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeModule={activeModule} onNavigate={navigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 text-slate-600">
            <Icon name="menu" size={22} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <Icon name="droplets" size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">{moduleTitle[activeModule] || 'NATIVA'}</span>
          </div>
          <NotificationBell onNavigate={navigate} />
          {activeModule !== 'config' && (
            <button onClick={() => navigate('config')} className="p-2 rounded-xl hover:bg-gray-100 text-slate-400">
              <Icon name="settings" size={18} />
            </button>
          )}
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
          <nav className="flex items-center gap-1 text-sm text-slate-400">
            <span className="font-medium text-blue-600">{config.companyName || 'NATIVA'}</span>
            <Icon name="chevRight" size={14} />
            <span className="font-medium text-slate-700">{moduleTitle[activeModule]}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{DataService.formatDate(DataService.today())}</span>
            <div className="w-px h-4 bg-gray-200" />
            <QuickStats />
            <div className="w-px h-4 bg-gray-200" />
            <NotificationBell onNavigate={navigate} />
            <div className="w-px h-4 bg-gray-200" />
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <Icon name="logout" size={14} />Salir
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}

function QuickStats() {
  const [pending, setPending] = React.useState(0);
  React.useEffect(() => {
    DataService.getTodayOrders().then(orders => setPending(orders.filter(o => o.status === 'pendiente').length));
  }, []);
  if (pending === 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full text-amber-700 font-medium text-xs">
      <Icon name="truck" size={12} />{pending} pendiente{pending !== 1 ? 's' : ''} hoy
    </div>
  );
}

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(<ErrorBoundary><App /></ErrorBoundary>);
