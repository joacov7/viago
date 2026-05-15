const MetaLeads = () => {
  const [leads, setLeads]     = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState(null);
  const [search, setSearch]   = React.useState('');

  React.useEffect(() => {
    if (!MetaService.isConfigured()) {
      setError('not_configured');
      setLoading(false);
      return;
    }
    MetaService.getLeads()
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l =>
    (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.email    || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone    || '').includes(search)
  );

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <span className="icon-loader-2 animate-spin text-2xl mr-3"></span>
      Cargando leads...
    </div>
  );

  if (error && error !== 'not_configured') return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
      <p className="font-semibold">Error al cargar leads</p>
      <p className="text-sm mt-1 font-mono">{error}</p>
    </div>
  );

  if (error === 'not_configured') return (
    <div className="text-center py-24 text-gray-400">
      <span className="icon-settings text-5xl block mb-4"></span>
      <p className="font-medium">Configurá las credenciales para ver los leads.</p>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leads de Meta Ads</h2>
          <p className="text-gray-500 text-sm mt-0.5">{leads.length} total</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <span className="icon-users text-5xl block mb-4"></span>
          {leads.length === 0
            ? 'Todavía no llegaron leads. Configurá el webhook de Meta Lead Ads.'
            : 'Sin resultados.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Teléfono</th>
                <th className="px-6 py-3">Campaña</th>
                <th className="px-6 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{lead.full_name || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.email || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.phone || '—'}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                    {lead.campaign_id ? `...${lead.campaign_id.slice(-6)}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(lead.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
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
