// NATIVA — Captación inteligente v2: scoring, competencia, CRM, mensajes

const _inputCls = (extra = '') =>
  `w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${extra}`;

// ── Tipos de negocio con puntaje base ──────────────────────────────────────
const BIZ_TYPES = [
  { id: 'clinica',     label: 'Clínica / Salud',       icon: '🏥', score: 45 },
  { id: 'oficina',     label: 'Oficina / Empresa',      icon: '🏢', score: 42 },
  { id: 'gimnasio',    label: 'Gimnasio / Fitness',     icon: '💪', score: 40 },
  { id: 'escuela',     label: 'Escuela / Educación',    icon: '🎓', score: 40 },
  { id: 'restaurante', label: 'Restaurante / Bar',      icon: '🍽️', score: 35 },
  { id: 'comercio',    label: 'Comercio / Local',       icon: '🏪', score: 28 },
  { id: 'hogar',       label: 'Hogar / Familia',        icon: '🏠', score: 20 },
  { id: 'otro',        label: 'Otro',                   icon: '📋', score: 18 },
];

const CRM_STATES = {
  nuevo:      { label: 'Nuevo',      bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  contactado: { label: 'Contactado', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  interesado: { label: 'Interesado', bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  cliente:    { label: 'Cliente',    bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  descartado: { label: 'Descartado', bg: 'bg-gray-100',    text: 'text-gray-400',    dot: 'bg-gray-300' },
};

const COMP_CFG = {
  dominante:  { label: 'Dominante',  bg: 'bg-red-100',     text: 'text-red-700',    icon: '🔴' },
  intermedio: { label: 'Intermedio', bg: 'bg-amber-100',   text: 'text-amber-700',  icon: '🟡' },
  debil:      { label: 'Débil',      bg: 'bg-emerald-100', text: 'text-emerald-700',icon: '🟢' },
};

// ── Scoring ────────────────────────────────────────────────────────────────
function calcScore(lead) {
  let score = 0;
  const biz = BIZ_TYPES.find(b => b.id === (lead.businessType || lead.type));
  if (biz) score += biz.score;
  if (lead.employeeCount >= 50)       score += 25;
  else if (lead.employeeCount >= 20)  score += 18;
  else if (lead.employeeCount >= 10)  score += 12;
  else if (lead.employeeCount >= 5)   score += 6;
  if (lead.website)                   score += 8;
  if (lead.phone)                     score += 5;
  if (lead.rating >= 4.5)             score += 10;
  else if (lead.rating >= 4.0)        score += 6;
  else if (lead.rating >= 3.5)        score += 3;
  if (lead.reviewsCount >= 200)       score += 8;
  else if (lead.reviewsCount >= 50)   score += 5;
  else if (lead.reviewsCount >= 10)   score += 2;
  const st = lead.status;
  if (st === 'interesado')            score += 15;
  else if (st === 'contactado')       score += 5;
  else if (st === 'descartado')       score  = 0;
  return Math.min(score, 100);
}

function getPriority(score) {
  if (score >= 70) return 'alta';
  if (score >= 40) return 'media';
  return 'baja';
}

function getOfferType(lead) {
  const biz = BIZ_TYPES.find(b => b.id === (lead.businessType || lead.type));
  if (!biz) return 'Plan estándar';
  if (biz.score >= 40) return 'Plan Premium';
  if (biz.score >= 28) return 'Plan Empresas';
  return 'Plan Hogar';
}

function buildWAMessage(lead, config, competitors) {
  const offer = getOfferType(lead);
  const score = calcScore(lead);
  const priority = getPriority(score);
  const comp = competitors.length > 0
    ? `Sabemos que en la zona hay otras empresas de agua, pero ${config.companyName || 'nosotros'} nos diferenciamos en calidad y servicio.`
    : '';
  const urgency = priority === 'alta'
    ? '¡Esta semana tenemos una promoción especial para nuevos clientes!'
    : 'Podemos coordinar una prueba sin compromiso.';

  return `Hola ${lead.name}! 👋

Soy de *${config.companyName || 'NATIVA'}* — distribución de agua purificada.

Vimos que ${lead.type === 'hogar' ? 'tu familia podría' : 'su negocio podría'} beneficiarse con nuestro *${offer}*:
✅ Agua purificada de alta calidad
✅ Entrega a domicilio programada
✅ Bidones retornables / dispensers

${comp}

${urgency}

¿Les interesa recibir más información? 💧`;
}

// ── UI primitivos ──────────────────────────────────────────────────────────
function ScoreChip({ score }) {
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}pts
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = {
    alta:  { label: 'Alta',  cls: 'bg-red-100 text-red-700' },
    media: { label: 'Media', cls: 'bg-amber-100 text-amber-700' },
    baja:  { label: 'Baja',  cls: 'bg-gray-100 text-gray-500' },
  };
  const c = cfg[priority] || cfg.baja;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

function CRMBadge({ status }) {
  const st = CRM_STATES[status] || CRM_STATES.nuevo;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
      {st.label}
    </span>
  );
}

// ── Formulario de lead ─────────────────────────────────────────────────────
function LeadFormModal({ isOpen, lead, onClose, onSave }) {
  const [form, setForm] = React.useState({
    name: '', phone: '', address: '', city: '', type: 'empresa',
    businessType: 'oficina', employeeCount: '', website: '', notes: '',
    status: 'nuevo', source: 'manual',
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '', phone: lead.phone || '',
        address: lead.address || '', city: lead.city || '',
        type: lead.type || 'empresa', businessType: lead.businessType || 'oficina',
        employeeCount: lead.employeeCount || '', website: lead.website || '',
        notes: lead.notes || '', status: lead.status || 'nuevo',
        source: lead.source || 'manual',
      });
    } else {
      setForm({
        name: '', phone: '', address: '', city: '', type: 'empresa',
        businessType: 'oficina', employeeCount: '', website: '', notes: '',
        status: 'nuevo', source: 'manual',
      });
    }
  }, [lead, isOpen]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lead ? 'Editar lead' : 'Nuevo lead'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Empresa *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className={_inputCls()} placeholder="Ej: Clínica del Norte" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className={_inputCls()} placeholder="+54 9 11 xxxx xxxx" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de negocio</label>
            <select value={form.businessType} onChange={e => set('businessType', e.target.value)} className={_inputCls()}>
              {BIZ_TYPES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empleados aprox.</label>
            <input type="number" min="1" value={form.employeeCount}
              onChange={e => set('employeeCount', e.target.value)}
              className={_inputCls()} placeholder="Ej: 15" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
          <input value={form.address} onChange={e => set('address', e.target.value)}
            className={_inputCls()} placeholder="Calle 123, Piso 2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              className={_inputCls()} placeholder="Buenos Aires" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sitio web</label>
            <input value={form.website} onChange={e => set('website', e.target.value)}
              className={_inputCls()} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado CRM</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={_inputCls()}>
              {Object.entries(CRM_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fuente</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} className={_inputCls()}>
              <option value="manual">Manual</option>
              <option value="osm">Mapa OSM</option>
              <option value="google">Google Places</option>
              <option value="referido">Referido</option>
              <option value="meta">Meta Ads</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={3} className={_inputCls()} placeholder="Observaciones, próximos pasos..." />
        </div>

        <div className="flex gap-3 pt-2">
          <Btn type="submit" disabled={saving} variant="primary" className="flex-1 justify-center">
            {saving ? 'Guardando...' : lead ? 'Actualizar' : 'Crear lead'}
          </Btn>
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Prospecting principal ─────────────────────────────────────────────────
function Prospecting() {
  const [tab, setTab] = React.useState('oportunidades');
  const [leads, setLeads] = React.useState([]);
  const [competitors, setCompetitors] = React.useState([]);
  const [config, setConfig] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [showLeadForm, setShowLeadForm] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [ls, comps, cfg] = await Promise.all([
        DataService.getLeads(),
        DataService.getCompetitors().catch(() => []),
        DataService.getConfig(),
      ]);
      setLeads(ls);
      setCompetitors(comps);
      setConfig(cfg);
    } catch (err) {
      console.error('[Captación] Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => { reload(); }, []);

  const enriched = React.useMemo(() =>
    leads.map(l => ({ ...l, _score: calcScore(l), _priority: getPriority(calcScore(l)) })),
    [leads]
  );

  const stats = React.useMemo(() => {
    const active = enriched.filter(l => l.status !== 'descartado');
    return {
      total: leads.length,
      alta: active.filter(l => l._priority === 'alta').length,
      seguimiento: leads.filter(l => ['contactado', 'interesado'].includes(l.status)).length,
      conversion: leads.length > 0
        ? Math.round(leads.filter(l => l.status === 'cliente').length / leads.length * 100)
        : 0,
    };
  }, [enriched, leads]);

  const handleUpdateStatus = async (lead, status) => {
    try {
      await DataService.updateLead(lead.id, { status });
      setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, status } : l));
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`¿Eliminar "${lead.name}"?`)) return;
    await DataService.deleteLead(lead.id);
    setLeads(ls => ls.filter(l => l.id !== lead.id));
  };

  const handleConvert = async (lead) => {
    if (!window.confirm(`¿Convertir "${lead.name}" en cliente?`)) return;
    try {
      await DataService.createClient({
        name: lead.name, phone: lead.phone, address: lead.address,
        city: lead.city, type: 'empresa', notes: lead.notes || '',
      });
      await DataService.updateLead(lead.id, { status: 'cliente' });
      setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, status: 'cliente' } : l));
    } catch (err) { alert(err.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const TABS = [
    { id: 'oportunidades', label: '⚡ Oportunidades' },
    { id: 'buscar',        label: '🔍 OSM' },
    { id: 'google',        label: '📍 Google Places' },
    { id: 'competencia',   label: '📊 Competencia' },
    { id: 'mensajes',      label: '💬 Mensajes' },
    { id: 'meta',          label: '📣 Meta Ads' },
  ];

  return (
    <div>
      <PageHeader
        title="Captación inteligente"
        subtitle={`${leads.length} leads · ${stats.alta} alta prioridad · ${stats.conversion}% conversión`}
        action={
          <Btn onClick={() => { setEditingLead(null); setShowLeadForm(true); }} icon="plus" variant="primary">
            Nuevo lead
          </Btn>
        }
      />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'oportunidades' && (
        <TabOportunidades
          leads={enriched} stats={stats} config={config} competitors={competitors}
          onUpdateStatus={handleUpdateStatus} onDelete={handleDelete}
          onConvert={handleConvert} onEdit={l => { setEditingLead(l); setShowLeadForm(true); }}
        />
      )}
      {tab === 'buscar' && (
        <TabBuscar leads={leads} config={config} onAdded={reload} />
      )}
      {tab === 'google' && (
        <TabGooglePlaces config={config} competitors={competitors} onRefresh={reload} />
      )}
      {tab === 'competencia' && (
        <TabCompetencia competitors={competitors} leads={enriched} onRefresh={reload} />
      )}
      {tab === 'mensajes' && (
        <TabMensajes leads={enriched} config={config} competitors={competitors} />
      )}
      {tab === 'meta' && <TabMetaAds />}

      <LeadFormModal
        isOpen={showLeadForm}
        lead={editingLead}
        onClose={() => { setShowLeadForm(false); setEditingLead(null); }}
        onSave={async (data) => {
          if (editingLead) {
            await DataService.updateLead(editingLead.id, data);
          } else {
            await DataService.createLead({ ...data, source: data.source || 'manual' });
          }
          setShowLeadForm(false);
          setEditingLead(null);
          reload();
        }}
      />
    </div>
  );
}

// ── TAB: OPORTUNIDADES ────────────────────────────────────────────────────────
function TabOportunidades({ leads, stats, config, competitors, onUpdateStatus, onDelete, onConvert, onEdit }) {
  const [filterPriority, setFilterPriority] = React.useState('');
  const [filterStatus, setFilterStatus]     = React.useState('');
  const [filterBiz, setFilterBiz]           = React.useState('');
  const [search, setSearch]                 = React.useState('');
  const [sortBy, setSortBy]                 = React.useState('score');
  const [msgLead, setMsgLead]               = React.useState(null);

  const filtered = React.useMemo(() => {
    return leads
      .filter(l => l.status !== 'descartado' || filterStatus === 'descartado')
      .filter(l => !filterPriority || l._priority === filterPriority)
      .filter(l => !filterStatus  || l.status === filterStatus)
      .filter(l => !filterBiz     || (l.businessType || l.type) === filterBiz)
      .filter(l => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (l.name || '').toLowerCase().includes(q) ||
               (l.address || '').toLowerCase().includes(q) ||
               (l.city || '').toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'score')  return b._score - a._score;
        if (sortBy === 'name')   return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'recent') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return 0;
      });
  }, [leads, filterPriority, filterStatus, filterBiz, search, sortBy]);

  const exportCSV = () => {
    const header = ['Nombre','Teléfono','Ciudad','Tipo','Score','Prioridad','Estado','Sitio web','Notas'];
    const rows = filtered.map(l => [
      l.name, l.phone, l.city,
      BIZ_TYPES.find(b => b.id === (l.businessType || l.type))?.label || l.type,
      l._score, l._priority, l.status, l.website, l.notes
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads_nativa.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total leads',     value: stats.total,       color: 'text-slate-900' },
          { label: 'Alta prioridad',  value: stats.alta,        color: 'text-red-600' },
          { label: 'En seguimiento',  value: stats.seguimiento, color: 'text-violet-600' },
          { label: 'Conversión',      value: `${stats.conversion}%`, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, dirección..." className={_inputCls('max-w-xs')} />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={_inputCls('w-auto')}>
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={_inputCls('w-auto')}>
            <option value="">Todos los estados</option>
            {Object.entries(CRM_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterBiz} onChange={e => setFilterBiz(e.target.value)} className={_inputCls('w-auto')}>
            <option value="">Todos los tipos</option>
            {BIZ_TYPES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={_inputCls('w-auto')}>
            <option value="score">Ordenar: Score</option>
            <option value="name">Ordenar: Nombre</option>
            <option value="recent">Ordenar: Recientes</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400">{filtered.length} leads</span>
            <Btn onClick={exportCSV} variant="secondary" size="sm" icon="fileText">CSV</Btn>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {filtered.length} leads con score y prioridad · CSV para Meta Ads, Excel o CRM externo
        </p>
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>No hay leads con ese filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              config={config}
              competitors={competitors}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
              onConvert={onConvert}
              onEdit={onEdit}
              onMessage={() => setMsgLead(lead)}
            />
          ))}
        </div>
      )}

      {msgLead && (
        <WAMessageModal
          lead={msgLead}
          config={config}
          competitors={competitors}
          onClose={() => setMsgLead(null)}
        />
      )}
    </div>
  );
}

function LeadCard({ lead, config, competitors, onUpdateStatus, onDelete, onConvert, onEdit, onMessage }) {
  const [expanded, setExpanded] = React.useState(false);
  const biz = BIZ_TYPES.find(b => b.id === (lead.businessType || lead.type));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
            {biz?.icon || '📋'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-slate-900 leading-tight">{lead.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lead.address}{lead.city ? `, ${lead.city}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ScoreChip score={lead._score} />
                <PriorityBadge priority={lead._priority} />
                <CRMBadge status={lead.status} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Icon name="phone" size={11} />{lead.phone}
                </a>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Icon name="globe" size={11} />Web
                </a>
              )}
              {lead.employeeCount && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Icon name="users" size={11} />{lead.employeeCount} empleados
                </span>
              )}
              {lead.rating && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  ⭐ {lead.rating}{lead.reviewsCount ? ` (${lead.reviewsCount})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <select
            value={lead.status}
            onChange={e => onUpdateStatus(lead, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {Object.entries(CRM_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <Btn onClick={onMessage} variant="secondary" size="sm" icon="messageCircle">
            WhatsApp
          </Btn>

          {lead.status !== 'cliente' && (
            <Btn onClick={() => onConvert(lead)} variant="secondary" size="sm" icon="userCheck">
              Convertir
            </Btn>
          )}

          <Btn onClick={() => onEdit(lead)} variant="ghost" size="sm" icon="edit">Editar</Btn>
          <Btn onClick={() => onDelete(lead)} variant="ghost" size="sm" icon="trash" className="text-red-500 hover:text-red-700">
            Eliminar
          </Btn>

          {lead.notes && (
            <button onClick={() => setExpanded(e => !e)}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <Icon name={expanded ? 'chevUp' : 'chevDown'} size={12} />
              Notas
            </button>
          )}
        </div>
      </div>

      {expanded && lead.notes && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}

// ── TAB: BUSCAR (OSM) ────────────────────────────────────────────────────────
function TabBuscar({ leads, config, onAdded }) {
  const [query, setQuery]         = React.useState('');
  const [city, setCity]           = React.useState(config?.city || '');
  const [radius, setRadius]       = React.useState(2000);
  const [results, setResults]     = React.useState([]);
  const [loading, setLoading]     = React.useState(false);
  const [saving, setSaving]       = React.useState({});
  const [error, setError]         = React.useState(null);
  const existingOsmIds = React.useMemo(() => new Set(leads.map(l => l.osmId).filter(Boolean)), [leads]);

  React.useEffect(() => { setCity(config?.city || ''); }, [config]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResults([]);
    try {
      const places = await GeoService.searchOSM(query, city, radius);
      setResults(places);
      if (places.length === 0) setError('Sin resultados. Probá con otro término o ciudad.');
    } catch (err) {
      setError(err.message || 'Error al buscar.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsLead = async (place) => {
    setSaving(s => ({ ...s, [place.id]: true }));
    try {
      await DataService.createLead({
        name: place.name, phone: place.phone || '', address: place.address,
        city: place.city || city, type: 'empresa',
        businessType: GeoService.guessBusinessType(place.tags),
        website: place.website || '', osmId: place.id,
        notes: place.tags?.['description'] || '',
        source: 'osm',
      });
      onAdded();
    } catch (err) { alert(err.message); }
    finally { setSaving(s => ({ ...s, [place.id]: false })); }
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h3 className="font-semibold text-slate-900 mb-4">Buscar prospectos en el mapa</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="clínica, gimnasio, oficina..." className={_inputCls('flex-1 min-w-[180px]')} />
          <input value={city} onChange={e => setCity(e.target.value)}
            placeholder="Ciudad" className={_inputCls('w-40')} />
          <select value={radius} onChange={e => setRadius(Number(e.target.value))} className={_inputCls('w-auto')}>
            <option value={500}>500m</option>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
            <option value={5000}>5km</option>
            <option value={10000}>10km</option>
          </select>
          <Btn onClick={handleSearch} disabled={loading} variant="primary" icon="search">
            {loading ? 'Buscando...' : 'Buscar'}
          </Btn>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>}

      {results.length > 0 && (
        <>
          <p className="text-sm text-slate-500 mb-3">{results.length} resultados encontrados</p>
          <div className="space-y-3">
            {results.map(place => {
              const alreadySaved = existingOsmIds.has(place.id);
              return (
                <div key={place.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900">{place.name}</h4>
                    <p className="text-sm text-slate-500 mt-0.5">{place.address}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {place.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Icon name="phone" size={11}/>{place.phone}</span>}
                      {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Icon name="globe" size={11}/>Web</a>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {alreadySaved ? (
                      <span className="text-xs text-emerald-600 font-medium px-3 py-1.5 bg-emerald-50 rounded-lg">✓ Guardado</span>
                    ) : (
                      <Btn onClick={() => saveAsLead(place)} disabled={saving[place.id]} variant="primary" size="sm">
                        {saving[place.id] ? '...' : '+ Lead'}
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── TAB: GOOGLE PLACES ───────────────────────────────────────────────────────
function TabGooglePlaces({ config, competitors, onRefresh }) {
  const [query, setQuery]         = React.useState('');
  const [location, setLocation]   = React.useState('');
  const [mode, setMode]           = React.useState('leads');
  const [radius, setRadius]       = React.useState(5000);
  const [results, setResults]     = React.useState([]);
  const [loading, setLoading]     = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError]         = React.useState(null);
  const [saving, setSaving]       = React.useState({});
  const [isSaving, setIsSaving]   = React.useState(false);
  const [hasMore, setHasMore]     = React.useState(false);
  const [pageTokens, setPageTokens]   = React.useState({});
  const [usage, setUsage]         = React.useState({ count: 0, limit: 3 });
  const apiKey = config?.googlePlacesApiKey || '';

  React.useEffect(() => { setLocation(config?.city || ''); }, [config]);

  if (!apiKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex gap-3">
          <Icon name="alertCircle" size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">API Key de Google Places no configurada</p>
            <p className="text-sm text-amber-700 mt-1">
              Ingresá tu Google Places API Key en <strong>Configuración → Integraciones</strong> para buscar prospectos con datos de Google Maps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const doSearch = async (isMore = false) => {
    if (!query.trim()) return;
    isMore ? setLoadingMore(true) : setLoading(true);
    setError(null);
    if (!isMore) { setResults([]); setPageTokens({}); setUsage({ count: 0, limit: 3 }); }
    try {
      const nextPageToken = isMore ? pageTokens[Object.keys(pageTokens).length - 1] : undefined;
      const data = await GeoService.searchGooglePlaces(query, location, radius, apiKey, nextPageToken);
      const newResults = data.results || [];
      setResults(prev => isMore ? [...prev, ...newResults] : newResults);
      setHasMore(!!data.next_page_token);
      if (data.next_page_token) {
        setPageTokens(prev => ({ ...prev, [Object.keys(prev).length]: data.next_page_token }));
      }
      setUsage(prev => ({ ...prev, count: prev.count + 1 }));
    } catch (err) {
      setError(err.message);
    } finally {
      isMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  const handleLoadMore = () => { if (usage.count < usage.limit) doSearch(true); };

  const saveAsLead = async (place) => {
    setIsSaving(true);
    try {
      await DataService.createLead({
        name: place.name, phone: place.formatted_phone_number || '',
        address: place.formatted_address || place.vicinity || '',
        city: location, type: 'empresa',
        businessType: GeoService.guessBusinessType({ amenity: place.types?.[0] }),
        website: place.website || '', rating: place.rating || null,
        reviewsCount: place.user_ratings_total || null, source: 'google',
      });
      onRefresh();
    } catch (err) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const saveAsCompetitor = async (place) => {
    setIsSaving(true);
    try {
      await DataService.createCompetitor({
        name: place.name,
        zone: location,
        strength: place.rating >= 4.2 ? 'dominante' : place.rating >= 3.5 ? 'intermedio' : 'debil',
        rating: place.rating || null,
        reviewsCount: place.user_ratings_total || null,
        notes: `Encontrado en Google Places. Dirección: ${place.formatted_address || place.vicinity || ''}`,
      });
      onRefresh();
    } catch (err) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h3 className="font-semibold text-slate-900 mb-4">Buscar en Google Places</h3>
        <div className="flex gap-2 mb-3">
          {['leads', 'competitors'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
              {m === 'leads' ? '🎯 Guardar como leads' : '📊 Mapear competencia'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="distribuidora de agua, purificadora..."
            className={_inputCls('flex-1 min-w-[180px]')} />
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Ciudad o dirección" className={_inputCls('w-44')} />
          <select value={radius} onChange={e => setRadius(Number(e.target.value))} className={_inputCls('w-auto')}>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
            <option value={5000}>5km</option>
            <option value={10000}>10km</option>
            <option value={20000}>20km</option>
          </select>
          <Btn onClick={() => doSearch()} disabled={loading} variant="primary" icon="search">
            {loading ? 'Buscando...' : 'Buscar'}
          </Btn>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>}

      {results.length > 0 && (
        <>
          <p className="text-sm text-slate-500 mb-3">{results.length} resultados · {usage.count}/{usage.limit} páginas cargadas</p>
          <div className="space-y-3 mb-4">
            {results.map((place, idx) => (
              <div key={place.place_id || idx} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h4 className="font-medium text-slate-900">{place.name}</h4>
                    {place.rating && (
                      <span className="text-xs text-slate-500 flex items-center gap-0.5">
                        ⭐ {place.rating}{place.user_ratings_total ? ` (${place.user_ratings_total})` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{place.formatted_address || place.vicinity}</p>
                  {place.formatted_phone_number && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Icon name="phone" size={11}/>{place.formatted_phone_number}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {mode === 'competitors' ? (
                    <Btn onClick={() => saveAsCompetitor(place)} disabled={isSaving} variant="primary" size="sm">
                      {isSaving ? '...' : '+ Competidor'}
                    </Btn>
                  ) : (
                    <Btn onClick={() => saveAsLead(place)} disabled={isSaving} variant="primary" size="sm">
                      {isSaving ? '...' : '+ Lead'}
                    </Btn>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <Btn onClick={handleLoadMore} disabled={loadingMore || usage.count >= usage.limit} variant="secondary">
                {loadingMore ? 'Cargando...' : '↓ Cargar más resultados'}
              </Btn>
              <p className="text-xs text-slate-400 mt-1">
                Usa {Object.keys(pageTokens).length} consulta{Object.keys(pageTokens).length !== 1 ? 's' : ''} adicional{Object.keys(pageTokens).length !== 1 ? 'es' : ''}.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── TAB: COMPETENCIA ────────────────────────────────────────────────────────
function TabCompetencia({ competitors, leads, onRefresh }) {
  const [showForm, setShowForm]     = React.useState(false);
  const [editing, setEditing]       = React.useState(null);
  const [form, setForm]             = React.useState({});
  const [saving, setSaving]         = React.useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm({ name: '', zone: '', strength: 'intermedio', weaknesses: '', rating: '', reviewsCount: '', notes: '' }); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses.join(', ') : (c.weaknesses || '') }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await DataService.updateCompetitor(editing.id, form); }
      else { await DataService.createCompetitor(form); }
      setShowForm(false); onRefresh();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Eliminar "${c.name}"?`)) return;
    await DataService.deleteCompetitor(c.id); onRefresh();
  };

  const totalLeads     = leads.filter(l => l.status !== 'descartado').length;
  const convertedLeads = leads.filter(l => l.status === 'cliente').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-900">Análisis de competencia</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {competitors.length} competidores mapeados · {convertedLeads}/{totalLeads} leads convertidos
          </p>
        </div>
        <Btn onClick={openNew} variant="primary" icon="plus">Agregar</Btn>
      </div>

      {competitors.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📊</p>
          <p>No hay competidores registrados.</p>
          <p className="text-sm mt-1">Agregá competidores para entender mejor el mercado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {competitors.map(c => {
            const cfg = COMP_CFG[c.strength] || COMP_CFG.intermedio;
            const weaknesses = Array.isArray(c.weaknesses) ? c.weaknesses : (c.weaknesses ? c.weaknesses.split(',').map(s => s.trim()).filter(Boolean) : []);
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {c.zone && <span className="text-xs text-slate-400">{c.zone}</span>}
                    </div>
                    <h4 className="font-semibold text-slate-900">{c.name}</h4>
                    {c.rating && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        ⭐ {c.rating}{c.reviewsCount ? ` · ${c.reviewsCount} reseñas` : ''}
                      </p>
                    )}
                    {weaknesses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {weaknesses.map((w, i) => (
                          <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{w}</span>
                        ))}
                      </div>
                    )}
                    {c.notes && <p className="text-xs text-slate-500 mt-2">{c.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Btn onClick={() => openEdit(c)} variant="ghost" size="sm" icon="edit" />
                    <Btn onClick={() => handleDelete(c)} variant="ghost" size="sm" icon="trash" className="text-red-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar competidor' : 'Nuevo competidor'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input required value={form.name || ''} onChange={e => set('name', e.target.value)} className={_inputCls()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zona</label>
              <input value={form.zone || ''} onChange={e => set('zone', e.target.value)} placeholder="Barrio / Ciudad" className={_inputCls()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fuerza</label>
              <select value={form.strength || 'intermedio'} onChange={e => set('strength', e.target.value)} className={_inputCls()}>
                {Object.entries(COMP_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rating Google</label>
              <input type="number" step="0.1" min="1" max="5" value={form.rating || ''} onChange={e => set('rating', e.target.value)} className={_inputCls()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nº reseñas</label>
              <input type="number" min="0" value={form.reviewsCount || ''} onChange={e => set('reviewsCount', e.target.value)} className={_inputCls()} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Debilidades (separadas por coma)</label>
            <input value={form.weaknesses || ''} onChange={e => set('weaknesses', e.target.value)} placeholder="precio alto, mala atención, demoras" className={_inputCls()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} className={_inputCls()} />
          </div>
          <div className="flex gap-3">
            <Btn type="submit" disabled={saving} variant="primary" className="flex-1 justify-center">
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Guardar'}
            </Btn>
            <Btn type="button" onClick={() => setShowForm(false)} variant="secondary">Cancelar</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── TAB: MENSAJES ────────────────────────────────────────────────────────────
function TabMensajes({ leads, config, competitors }) {
  const [filter, setFilter]   = React.useState('alta');
  const [msgLead, setMsgLead] = React.useState(null);

  const filtered = leads
    .filter(l => l.status !== 'descartado' && l.status !== 'cliente')
    .filter(l => !filter || l._priority === filter)
    .sort((a, b) => b._score - a._score);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h3 className="font-semibold text-slate-900">Mensajes de WhatsApp</h3>
        <div className="flex gap-1">
          {['alta', 'media', 'baja', ''].map(p => (
            <button key={p} onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
              {p || 'Todos'}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-400">{filtered.length} leads</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">💬</p>
          <p>No hay leads con esa prioridad.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-slate-900">{lead.name}</h4>
                  <ScoreChip score={lead._score} />
                  <CRMBadge status={lead.status} />
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{lead.address}{lead.city ? `, ${lead.city}` : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Btn onClick={() => setMsgLead(lead)} variant="secondary" size="sm" icon="messageCircle">
                  Ver mensaje
                </Btn>
                {lead.phone && (
                  <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(buildWAMessage(lead, config, competitors))}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                    <Icon name="messageCircle" size={13} />WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {msgLead && (
        <WAMessageModal
          lead={msgLead}
          config={config}
          competitors={competitors}
          onClose={() => setMsgLead(null)}
        />
      )}
    </div>
  );
}

function WAMessageModal({ lead, config, competitors, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const message = buildWAMessage(lead, config, competitors);
  const score = calcScore(lead);

  const copy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Mensaje para ${lead.name}`} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <ScoreChip score={score} />
          <PriorityBadge priority={getPriority(score)} />
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            {getOfferType(lead)}
          </span>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <Btn onClick={copy} variant="secondary" icon={copied ? 'check' : 'copy'} className="flex-1 justify-center">
            {copied ? '¡Copiado!' : 'Copiar mensaje'}
          </Btn>
          {lead.phone && (
            <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
              <Icon name="messageCircle" size={16} />
              Abrir WhatsApp
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}