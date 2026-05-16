// NATIVA — Meta Ads tab (renderizado dentro de Prospecting.js como TabMetaAds)

const TabMetaAds = () => {
  const [subTab, setSubTab]             = React.useState('leads');
  const [insights, setInsights]         = React.useState(null);
  const [insightsLoading, setInsightsL] = React.useState(true);

  React.useEffect(() => {
    if (!MetaService.isConfigured()) { setInsightsL(false); return; }
    MetaService.getAccountInsights('last_30d')
      .then(d => setInsights(d.data?.[0] || null))
      .catch(() => {})
      .finally(() => setInsightsL(false));
  }, []);

  const fmt    = n => n ? parseInt(n).toLocaleString('es-AR') : '—';
  const fmtM   = n => n ? `$${parseFloat(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—';
  const fmtPct = n => n ? `${parseFloat(n).toFixed(2)}%` : '—';

  const SUBTABS = [
    { id: 'leads',     label: 'Leads' },
    { id: 'campaigns', label: 'Campañas' },
    { id: 'crear',     label: 'Nueva campaña' },
  ];

  const statsCards = [
    { label: 'Gasto 30d',   value: fmtM(insights?.spend)     },
    { label: 'Impresiones', value: fmt(insights?.impressions) },
    { label: 'Clics',       value: fmt(insights?.clicks)      },
    { label: 'CTR',         value: fmtPct(insights?.ctr)      },
  ];

  return (
    <div>
      {!MetaService.isConfigured() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
          <Icon name="alertCircle" size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Edge Functions no configuradas</p>
            <p className="text-amber-700 mt-0.5">
              Deployá <code className="bg-amber-100 px-1 rounded">meta-api-proxy</code> y{' '}
              <code className="bg-amber-100 px-1 rounded">meta-webhook</code> en Supabase y configurá
              los secrets: META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_PAGE_ACCESS_TOKEN, META_VERIFY_TOKEN.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statsCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-slate-900">{insightsLoading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${subTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'leads'     && <MetaLeadsTab />}
      {subTab === 'campaigns' && <MetaCampaignsTab />}
      {subTab === 'crear'     && <MetaCreatorTab />}
    </div>
  );
};

// ── Leads ─────────────────────────────────────────────────────────────────────
const MetaLeadsTab = () => {
  const [leads, setLeads]     = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState(null);
  const [search, setSearch]   = React.useState('');

  React.useEffect(() => {
    if (!MetaService.isConfigured()) { setLoading(false); return; }
    MetaService.getLeads()
      .then(d => setLeads(Array.isArray(d) ? d : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l =>
    (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.email    || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone    || '').includes(search)
  );

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      <p className="font-semibold">Error al cargar leads</p>
      <p className="mt-1 font-mono">{error}</p>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">{leads.length} leads sincronizados desde Meta</p>
        <input type="text" placeholder="Buscar..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📣</p>
          <p>{leads.length === 0 ? 'Configurá el webhook de Meta Lead Ads para recibir leads automáticamente.' : 'Sin resultados.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Teléfono</th><th className="px-4 py-3">Campaña</th><th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{lead.full_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{lead.campaign_id ? `...${lead.campaign_id.slice(-6)}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(lead.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Campañas ──────────────────────────────────────────────────────────────────
const META_STATUS_PILL = {
  ACTIVE:   'bg-emerald-100 text-emerald-700',
  PAUSED:   'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
  DELETED:  'bg-red-100 text-red-600',
};

const MetaCampaignsTab = () => {
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState(null);
  const [toggling, setToggling]   = React.useState(null);

  React.useEffect(() => {
    if (!MetaService.isConfigured()) { setLoading(false); return; }
    MetaService.getCampaigns()
      .then(d => setCampaigns(d.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async c => {
    const newStatus = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setToggling(c.id);
    try {
      const res = await MetaService.updateCampaignStatus(c.id, newStatus);
      if (res.error) throw new Error(res.error.message);
      setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x));
    } catch (err) { alert('Error: ' + err.message); }
    finally { setToggling(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"><p className="font-semibold">Error</p><p className="mt-1 font-mono">{error}</p></div>;
  if (campaigns.length === 0) return <div className="text-center py-16 text-slate-400"><p className="text-4xl mb-3">📊</p><p>No hay campañas. Creá una en "Nueva campaña".</p></div>;

  return (
    <div className="space-y-3">
      {campaigns.map(c => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${META_STATUS_PILL[c.status] || 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
              <span className="text-xs text-slate-400 font-mono">{c.objective}</span>
            </div>
            <p className="font-semibold text-slate-900 truncate">{c.name}</p>
            {c.daily_budget && <p className="text-xs text-slate-500 mt-0.5">Presupuesto: ${(parseInt(c.daily_budget)/100).toLocaleString('es-AR')}/día</p>}
          </div>
          <button onClick={() => toggleStatus(c)} disabled={toggling === c.id}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${c.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
            {toggling === c.id ? '...' : c.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
          </button>
        </div>
      ))}
    </div>
  );
};

// ── Nueva campaña ─────────────────────────────────────────────────────────────
const META_OBJECTIVES = [
  { value: 'OUTCOME_LEADS',      label: 'Captación de leads' },
  { value: 'OUTCOME_AWARENESS',  label: 'Reconocimiento de marca' },
  { value: 'OUTCOME_TRAFFIC',    label: 'Tráfico al sitio web' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Interacción' },
  { value: 'OUTCOME_SALES',      label: 'Ventas' },
];

const MetaCreatorTab = () => {
  const [form, setForm]       = React.useState({ name: '', objective: 'OUTCOME_LEADS', status: 'PAUSED', daily_budget: '' });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(null);
  const [error, setError]     = React.useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setSuccess(null); setError(null);
    try {
      const payload = { ...form };
      if (form.daily_budget) payload.daily_budget = String(parseInt(form.daily_budget) * 100);
      const data = await MetaService.createCampaign(payload);
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      setSuccess(data.id);
      setForm({ name: '', objective: 'OUTCOME_LEADS', status: 'PAUSED', daily_budget: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const _inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  return (
    <div className="max-w-md">
      {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-sm"><p className="font-semibold">¡Campaña creada!</p><p className="font-mono text-xs mt-0.5">ID: {success}</p></div>}
      {error   && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm"><p className="font-semibold">Error</p><p className="mt-0.5">{error}</p></div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
          <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Captación Agua — Junio 2026" className={_inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Objetivo</label>
          <select value={form.objective} onChange={e => set('objective', e.target.value)} className={_inp}>
            {META_OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Presupuesto diario (ARS)</label>
          <input type="number" min="1" value={form.daily_budget} onChange={e => set('daily_budget', e.target.value)} placeholder="Ej: 2000" className={_inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Estado inicial</label>
          <div className="flex gap-4">
            {[{ v: 'PAUSED', l: 'Pausada' }, { v: 'ACTIVE', l: 'Activa' }].map(({ v, l }) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input type="radio" name="meta_new_status" value={v} checked={form.status === v} onChange={e => set('status', e.target.value)} />{l}
              </label>
            ))}
          </div>
        </div>
        <Btn type="submit" disabled={loading} variant="primary" className="w-full justify-center">
          {loading ? 'Creando...' : '+ Crear campaña'}
        </Btn>
      </form>
    </div>
  );
};
