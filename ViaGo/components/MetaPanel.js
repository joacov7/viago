const ConfigBanner = () => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex gap-4">
    <span className="icon-triangle-alert text-amber-500 text-2xl flex-shrink-0 mt-0.5"></span>
    <div>
      <p className="font-semibold text-amber-800">Credenciales no configuradas</p>
      <p className="text-sm text-amber-700 mt-1">
        Abrí <code className="bg-amber-100 px-1 rounded">ViaGo/utils/metaService.js</code> y
        reemplazá <code className="bg-amber-100 px-1 rounded">YOUR_PROJECT</code> con la URL de tu
        proyecto Supabase y <code className="bg-amber-100 px-1 rounded">YOUR_SUPABASE_ANON_KEY</code>
        con tu anon key.
      </p>
      <p className="text-xs text-amber-600 mt-2">
        También necesitás tener las Edge Functions deployadas y la tabla{' '}
        <code className="bg-amber-100 px-1 rounded">meta_leads</code> creada en Supabase.
      </p>
    </div>
  </div>
);

const MetaPanel = () => {
  const [activeTab, setActiveTab] = React.useState('leads');
  const [insights, setInsights]   = React.useState(null);
  const [insightsLoading, setInsightsLoading] = React.useState(true);
  const configured = MetaService.isConfigured();

  React.useEffect(() => {
    if (!configured) { setInsightsLoading(false); return; }
    MetaService.getAccountInsights('last_30d')
      .then(data => { setInsights(data.data?.[0] || null); })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }, []);

  const tabs = [
    { id: 'leads',     label: 'Leads',         icon: 'icon-users' },
    { id: 'campaigns', label: 'Campañas',       icon: 'icon-megaphone' },
    { id: 'crear',     label: 'Nueva campaña',  icon: 'icon-plus-circle' },
  ];

  const fmt      = (n) => n ? parseInt(n).toLocaleString('es-AR') : '—';
  const fmtMoney = (n) => n ? `$${parseFloat(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—';
  const fmtPct   = (n) => n ? `${parseFloat(n).toFixed(2)}%` : '—';

  const stats = [
    { label: 'Gasto 30d',   value: fmtMoney(insights?.spend),       icon: 'icon-credit-card',         color: 'text-blue-600 bg-blue-50' },
    { label: 'Impresiones', value: fmt(insights?.impressions),       icon: 'icon-eye',                 color: 'text-purple-600 bg-purple-50' },
    { label: 'Clics',       value: fmt(insights?.clicks),            icon: 'icon-mouse-pointer-click', color: 'text-green-600 bg-green-50' },
    { label: 'CTR',         value: fmtPct(insights?.ctr),            icon: 'icon-trending-up',         color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="index.html" className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
            <span className="icon-arrow-left text-xl"></span>
          </a>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="icon-megaphone text-white text-xl"></span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Marketing</h1>
            <p className="text-xs text-gray-400 mt-0.5">Meta Ads</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-50">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <span className={`${s.icon} text-sm`}></span>
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {insightsLoading ? '...' : s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-6 flex gap-1 border-t border-gray-100 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className={`${tab.icon} text-base`}></span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {!configured && <ConfigBanner />}
        {activeTab === 'leads'     && <MetaLeads />}
        {activeTab === 'campaigns' && <MetaCampaigns />}
        {activeTab === 'crear'     && <MetaCreator />}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MetaPanel />);
