const STATUS_COLORS = {
  ACTIVE:   'bg-green-100 text-green-700',
  PAUSED:   'bg-yellow-100 text-yellow-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
  DELETED:  'bg-red-100 text-red-600',
};

const MetaCampaigns = () => {
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [toggling, setToggling] = React.useState(null);

  React.useEffect(() => {
    MetaService.getCampaigns()
      .then(data => {
        setCampaigns(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleStatus = async (campaign) => {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setToggling(campaign.id);
    try {
      const res = await MetaService.updateCampaignStatus(campaign.id, newStatus);
      if (res.error) throw new Error(res.error.message);
      setCampaigns(prev =>
        prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c)
      );
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setToggling(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <span className="icon-loader-2 animate-spin text-2xl mr-3"></span>
      Cargando campañas desde Meta...
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
      <p className="font-semibold">Error al conectar con Meta Ads API</p>
      <p className="text-sm mt-1">{error}</p>
      <p className="text-xs mt-3 text-red-500">Verificá que META_ACCESS_TOKEN y META_AD_ACCOUNT_ID estén configurados en Supabase Secrets.</p>
    </div>
  );

  if (campaigns.length === 0) return (
    <div className="text-center py-24 text-gray-400">
      <span className="icon-megaphone text-5xl block mb-4"></span>
      No hay campañas en esta cuenta. Creá tu primera campaña en la pestaña "Nueva campaña".
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Campañas ({campaigns.length})</h2>
      <div className="space-y-4">
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{c.objective}</span>
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                {c.daily_budget && (
                  <p className="text-sm text-gray-500 mt-1">
                    Presupuesto diario: ${(parseInt(c.daily_budget) / 100).toLocaleString('es-AR')}
                  </p>
                )}
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {c.id}</p>
              </div>
              <button
                onClick={() => toggleStatus(c)}
                disabled={toggling === c.id}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  c.status === 'ACTIVE'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {toggling === c.id
                  ? <span className="icon-loader-2 animate-spin"></span>
                  : c.status === 'ACTIVE' ? 'Pausar' : 'Activar'
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
