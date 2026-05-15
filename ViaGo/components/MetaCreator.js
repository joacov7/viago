const OBJECTIVES = [
  { value: 'OUTCOME_LEADS',      label: 'Captación de leads' },
  { value: 'OUTCOME_AWARENESS',  label: 'Reconocimiento de marca' },
  { value: 'OUTCOME_TRAFFIC',    label: 'Tráfico al sitio web' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Interacción' },
  { value: 'OUTCOME_SALES',      label: 'Ventas' },
];

const MetaCreator = () => {
  const [form, setForm] = React.useState({
    name: '',
    objective: 'OUTCOME_LEADS',
    status: 'PAUSED',
    daily_budget: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(null);
  const [error, setError] = React.useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const payload = { ...form };
      if (form.daily_budget) payload.daily_budget = String(parseInt(form.daily_budget) * 100);
      const data = await MetaService.createCampaign(payload);
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      setSuccess(data.id);
      setForm({ name: '', objective: 'OUTCOME_LEADS', status: 'PAUSED', daily_budget: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Nueva campaña</h2>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <span className="icon-circle-check text-green-600 text-xl mt-0.5"></span>
          <div>
            <p className="font-semibold text-green-800">¡Campaña creada!</p>
            <p className="text-sm text-green-700 mt-0.5 font-mono">ID: {success}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="icon-circle-x text-red-600 text-xl mt-0.5"></span>
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la campaña</label>
          <input
            type="text" required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej: Captación Agua — Mayo 2026"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Objetivo</label>
          <select
            value={form.objective}
            onChange={e => set('objective', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {OBJECTIVES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Presupuesto diario (ARS)</label>
          <input
            type="number" min="1"
            value={form.daily_budget}
            onChange={e => set('daily_budget', e.target.value)}
            placeholder="Ej: 2000"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Dejalo vacío para configurarlo después en Meta Ads Manager.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado inicial</label>
          <div className="flex gap-6">
            {[{ v: 'PAUSED', l: 'Pausada' }, { v: 'ACTIVE', l: 'Activa' }].map(({ v, l }) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="status" value={v}
                  checked={form.status === v}
                  onChange={e => set('status', e.target.value)}
                />
                <span className="text-sm text-gray-700">{l}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="icon-loader-2 animate-spin"></span> Creando...</>
            : <><span className="icon-plus"></span> Crear campaña</>
          }
        </button>
      </form>
    </div>
  );
};
