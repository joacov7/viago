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

const PRIO_CFG = {
  alta:  { label: 'ALTA', bg: 'bg-red-100',   text: 'text-red-700',   dot: 'bg-red-500' },
  media: { label: 'MEDIA',bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  baja:  { label: 'BAJA', bg: 'bg-gray-100',  text: 'text-gray-500',  dot: 'bg-gray-400' },
};

const OSM_TYPES = [
  { label: 'Gimnasio / Fitness',    tags: [['leisure','fitness_centre'],['amenity','gym']], icon: '🏋️' },
  { label: 'Empresa / Oficina',     tags: [['office','company'],['office','yes']],          icon: '🏢' },
  { label: 'Restaurante',           tags: [['amenity','restaurant']],                       icon: '🍽️' },
  { label: 'Bar / Café',            tags: [['amenity','bar'],['amenity','cafe']],            icon: '☕' },
  { label: 'Farmacia',              tags: [['amenity','pharmacy']],                          icon: '💊' },
  { label: 'Supermercado',          tags: [['shop','supermarket']],                          icon: '🛒' },
  { label: 'Escuela / Colegio',     tags: [['amenity','school']],                            icon: '🎓' },
  { label: 'Hotel / Hostel',        tags: [['tourism','hotel'],['tourism','hostel']],        icon: '🏨' },
  { label: 'Panadería',             tags: [['shop','bakery']],                               icon: '🥖' },
  { label: 'Consultorio / Clínica', tags: [['amenity','doctors'],['amenity','clinic']],     icon: '🏥' },
  { label: 'Kiosco / Almacén',      tags: [['shop','kiosk'],['shop','convenience']],        icon: '🏪' },
  { label: 'Taller / Mecánica',     tags: [['shop','car_repair']],                          icon: '🔧' },
];

// ── Scoring ─────────────────────────────────────────────────────────────────
function calcScore(lead) {
  const bt = BIZ_TYPES.find(t => t.id === (lead.businessType || lead.type));
  let s = bt ? bt.score : 18;                                              // tipo: 18-45

  const emp = Number(lead.employeeCount) || 0;
  s += emp >= 50 ? 20 : emp >= 20 ? 16 : emp >= 10 ? 11 : emp >= 5 ? 7 : 4; // tamaño: 4-20

  if (lead.phone) s += 12;   // contacto
  if (lead.address) s += 5;  // ubicación

  const src = { referido: 13, referral: 13, google: 10, web: 9, instagram: 9, openstreetmap: 8, manual: 5 };
  s += src[lead.source] ?? 5;                                              // fuente: 5-13

  const n = (lead.notes || '').length;
  s += n > 30 ? 5 : n > 10 ? 3 : 0;                                      // contexto: 0-5

  return Math.min(100, Math.max(0, s));
}

function getPriority(score) {
  return score >= 70 ? 'alta' : score >= 42 ? 'media' : 'baja';
}

function getOfferType(lead) {
  const bt = lead.businessType || lead.type;
  if (['oficina', 'clinica', 'escuela'].includes(bt)) return 'Plan empresa';
  if (bt === 'gimnasio') return 'Abono semanal';
  if (bt === 'hogar') return 'Plan familiar';
  return '1er bidón con descuento';
}

function buildWAMessage(lead, config, competitors) {
  const co = config.companyName || 'nuestra empresa';
  const bt = lead.businessType || lead.type || '';
  const weaknesses = (competitors || [])
    .flatMap(c => (c.weaknesses || '').split(',').map(w => w.trim()))
    .filter(Boolean).slice(0, 2);
  const weakLine = weaknesses.length
    ? `A diferencia de otros: *sin ${weaknesses.join(' ni ')}* ✅\n`
    : '';

  const middles = {
    clinica:     'En una clínica el agua tiene que estar *siempre disponible*, sin excusas',
    oficina:     'En una empresa, la hidratación del equipo impacta directo en el rendimiento',
    gimnasio:    'Para un gimnasio, la hidratación es parte del servicio que ofrecés',
    escuela:     'Para una escuela, que los chicos tengan agua fresca es fundamental',
    restaurante: 'Un restaurante necesita abastecimiento seguro, todos los días',
    comercio:    'Te ahorrás el trabajo de ir a buscar o esperar reposición',
    hogar:       'Agua de calidad para tu familia, sin el peso de cargar bidones',
  };
  const mid = middles[bt] || 'Entregamos agua en bidones directamente en tu puerta';

  return `Hola${lead.name ? ` *${lead.name}*` : ''}! 👋

Somos *${co}*, proveemos agua en bidones con entrega a domicilio en tu zona.

${mid}.
${weakLine}
Esta semana tenemos *${getOfferType(lead)}* para nuevos clientes 💧

¿Les cuento más info o coordinamos una entrega de prueba?`.trim();
}

// ── OSM helpers ──────────────────────────────────────────────────────────────
async function geocodeCity(city) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'es', 'User-Agent': 'NATIVA-app' } }
  );
  const data = await res.json();
  if (!data.length) throw new Error('Ciudad no encontrada. Probá con un nombre más específico.');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function queryOverpass(tags, lat, lng, radius) {
  const conds = tags.flatMap(([k, v]) => [
    `node["${k}"="${v}"](around:${radius},${lat},${lng});`,
    `way["${k}"="${v}"](around:${radius},${lat},${lng});`,
  ]).join('');
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', body: `[out:json][timeout:30];(${conds});out center tags;`,
  });
  return (await res.json()).elements || [];
}

function parseOsmResult(el, city, typeLabel) {
  const t = el.tags || {};
  return {
    osmId: String(el.id),
    name: t.name || t['name:es'] || '',
    phone: (t.phone || t['contact:phone'] || t.mobile || '').replace(/\s/g, ''),
    address: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '),
    city: t['addr:city'] || city,
    website: t.website || t['contact:website'] || '',
    type: typeLabel,
  };
}

// ── GOOGLE PLACES API (New) ───────────────────────────────────────────────────
const GP_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const GP_FIELDS   = 'places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.reviews,nextPageToken';

const NEG_KW = ['demora', 'tarde', 'sucio', 'caro', 'no vienen', 'nunca', 'frío', 'caliente', 'roto', 'mal servicio', 'no llegan', 'lento', 'falta', 'cobran'];
const POS_KW = ['puntual', 'limpio', 'fresco', 'rápido', 'recomiendo', 'excelente', 'bueno', 'calidad', 'confiable', 'siempre'];

const GP_SEARCHES = {
  competitors: [
    { query: 'Sodería',                  label: 'Soderías' },
    { query: 'Agua de mesa',             label: 'Agua de mesa' },
    { query: 'Distribuidora agua bidón', label: 'Distribuidoras' },
    { query: 'Agua purificada domicilio',label: 'Agua purificada' },
    { query: 'Bidones agua potable',     label: 'Bidones' },
  ],
  leads: [
    { query: 'Gimnasio',         label: 'Gimnasios',  bizType: 'gimnasio' },
    { query: 'Clínica médica',   label: 'Clínicas',   bizType: 'clinica'  },
    { query: 'Empresa oficinas', label: 'Oficinas',   bizType: 'oficina'  },
  ],
};

// ── Contador de uso ──────────────────────────────────────────────────────────
function gpUsage() {
  const month = new Date().toISOString().slice(0, 7);
  const stored = JSON.parse(localStorage.getItem('gp_usage') || '{}');
  if (stored.month !== month) return { month, count: 0 };
  return stored;
}
function gpAddUsage(n = 1) {
  const u = gpUsage();
  u.count += n;
  localStorage.setItem('gp_usage', JSON.stringify(u));
  return u.count;
}
function gpLimit() {
  return parseInt(localStorage.getItem('gp_limit') || '9990');
}

async function searchGP(query, city, lat, lng, apiKey, pageToken = null, radius = 25000) {
  const body = {
    textQuery: `${query} ${city}`,
    languageCode: 'es',
    maxResultCount: 20,
    locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
  };
  if (pageToken) body.pageToken = pageToken;
  const r = await fetch(GP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': GP_FIELDS,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error?.message || `Error Google Places: ${r.status}`);
  }
  const d = await r.json();
  return { places: d.places || [], nextPageToken: d.nextPageToken || null };
}

function analyzeGPPlace(place) {
  const reviews = place.reviews || [];
  const negRevs = reviews.filter(r =>
    r.rating < 3 || NEG_KW.some(k => (r.text?.text || '').toLowerCase().includes(k))
  );
  const posRevs = reviews.filter(r =>
    r.rating >= 4 && POS_KW.some(k => (r.text?.text || '').toLowerCase().includes(k))
  );
  const weaknesses = [...new Set(
    negRevs.flatMap(r => NEG_KW.filter(k => (r.text?.text || '').toLowerCase().includes(k)))
  )].join(', ');
  const rating = place.rating || 0;
  const cnt    = place.userRatingCount || 0;
  const strength = rating >= 4.5 && cnt >= 10 ? 'dominante'
    : rating >= 3.5 || cnt >= 5 ? 'intermedio' : 'debil';
  return { weaknesses, strength, negRevs, posRevs };
}

function gpToCSV(results, mode) {
  const headers = mode === 'competitors'
    ? ['Nombre','Dirección','Teléfono','Rating','Reseñas','Fortaleza','Debilidades','Reseña negativa','Lo que valoran']
    : ['Nombre','Dirección','Teléfono','Rating','Reseñas','Tipo','Score','Prioridad'];
  const rows = results.map(p => {
    const { weaknesses, strength, negRevs, posRevs } = p._analysis;
    const name  = p.displayName?.text || '';
    const addr  = p.formattedAddress || '';
    const phone = p.internationalPhoneNumber || '';
    const rat   = p.rating || '';
    const cnt   = p.userRatingCount || 0;
    if (mode === 'competitors') {
      return [name, addr, phone, rat, cnt, COMP_CFG[strength]?.label || strength, weaknesses,
        negRevs[0]?.text?.text?.slice(0, 120) || '', posRevs[0]?.text?.text?.slice(0, 120) || ''];
    }
    const fake = { businessType: p._bizType, phone, address: addr, source: 'google' };
    const score = calcScore(fake);
    return [name, addr, phone, rat, cnt, p._bizType, score, getPriority(score)];
  });
  return [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

// ── SHARED SMALL COMPONENTS ───────────────────────────────────────────────────
function ScoreChip({ score }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 42 ? 'bg-amber-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0" title={`Score: ${score}/100`}>
      <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-600 w-6 text-right">{score}</span>
    </div>
  );
}

function PriorityBadge({ priority, dot }) {
  const pc = PRIO_CFG[priority] || PRIO_CFG.baja;
  if (dot) return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pc.dot}`} title={pc.label} />;
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${pc.bg} ${pc.text}`}>{pc.label}</span>;
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
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
  const [filterStatus, setFilterStatus] = React.useState('');
  const [filterType, setFilterType] = React.useState('');
  const [showTop, setShowTop] = React.useState(true);
  const [waLead, setWaLead] = React.useState(null);

  const topTen = [...leads]
    .filter(l => !['cliente', 'descartado'].includes(l.status))
    .sort((a, b) => b._score - a._score)
    .slice(0, 10);

  const filtered = leads
    .filter(l => !filterPriority || l._priority === filterPriority)
    .filter(l => !filterStatus || l.status === filterStatus)
    .filter(l => !filterType || (l.businessType || l.type) === filterType)
    .sort((a, b) => b._score - a._score);

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total leads',     value: stats.total,          icon: 'users',        bg: 'bg-blue-100',    c: 'text-blue-600' },
          { label: 'Alta prioridad',  value: stats.alta,           icon: 'trendingUp',   bg: 'bg-red-100',     c: 'text-red-600' },
          { label: 'En seguimiento',  value: stats.seguimiento,    icon: 'messageCircle',bg: 'bg-violet-100',  c: 'text-violet-600' },
          { label: 'Tasa conversión', value: `${stats.conversion}%`,icon: 'checkCircle', bg: 'bg-emerald-100', c: 'text-emerald-600' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
              <Icon name={c.icon} size={20} className={c.c} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Top 10 */}
      {topTen.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f2142 0%, #1e3a5f 100%)' }}>
          <button onClick={() => setShowTop(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left">
            <div>
              <p className="text-white font-bold">⚡ Top {topTen.length} oportunidades</p>
              <p className="text-blue-300 text-xs mt-0.5">Leads con mayor puntaje pendientes de contacto</p>
            </div>
            <Icon name={showTop ? 'chevDown' : 'chevRight'} size={18} className="text-blue-300" />
          </button>
          {showTop && (
            <div className="px-4 pb-4 space-y-2">
              {topTen.map((lead, i) => {
                const bt = BIZ_TYPES.find(b => b.id === (lead.businessType || lead.type));
                return (
                  <div key={lead.id}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-blue-300 font-bold text-base w-6 flex-shrink-0 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{lead.name}</p>
                      <p className="text-blue-300 text-xs truncate">
                        {bt ? `${bt.icon} ${bt.label}` : (lead.type || '—')}
                        {lead.city ? ` · ${lead.city}` : ''}
                      </p>
                    </div>
                    <ScoreChip score={lead._score} />
                    <PriorityBadge priority={lead._priority} dot />
                    <div className="flex items-center gap-1">
                      {lead.phone && (
                        <button onClick={() => setWaLead(lead)}
                          className="p-1.5 rounded-lg text-green-300 hover:text-green-200 transition-colors"
                          style={{ background: 'rgba(34,197,94,0.15)' }} title="Generar mensaje WA">
                          <Icon name="messageCircle" size={14} />
                        </button>
                      )}
                      <button onClick={() => onEdit(lead)}
                        className="p-1.5 rounded-lg text-blue-300 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.1)' }} title="Editar">
                        <Icon name="edit" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
        <span className="text-sm font-semibold text-slate-700">Filtrar:</span>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta prioridad</option>
          <option value="media">Media prioridad</option>
          <option value="baja">Baja prioridad</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
          <option value="">Todos los estados</option>
          {Object.entries(CRM_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white">
          <option value="">Todos los tipos</option>
          {BIZ_TYPES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.label}</option>)}
        </select>
        {(filterPriority || filterStatus || filterType) && (
          <button onClick={() => { setFilterPriority(''); setFilterStatus(''); setFilterType(''); }}
            className="text-xs text-blue-600 font-medium hover:text-blue-700">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <EmptyState icon="users" title="Sin leads" description="Buscá negocios o agregá leads manualmente" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(lead => (
              <LeadRow
                key={lead.id} lead={lead}
                onUpdateStatus={onUpdateStatus} onDelete={onDelete}
                onConvert={onConvert} onEdit={onEdit}
                onWA={() => setWaLead(lead)}
              />
            ))}
          </div>
        </div>
      )}

      {waLead && (
        <WAMessageModal
          lead={waLead} config={config} competitors={competitors}
          onClose={() => setWaLead(null)}
        />
      )}
    </div>
  );
}

// ── TAB: BUSCAR (OSM) ──────────────────────────────────────────────────────────
function TabBuscar({ leads, config, onAdded }) {
  const [typeIdx, setTypeIdx] = React.useState(0);
  const [city, setCity] = React.useState(config.city || '');
  const [radius, setRadius] = React.useState(3000);
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());
  const [searchError, setSearchError] = React.useState('');
  const [addingIds, setAddingIds] = React.useState(new Set());

  const existingIds = new Set(leads.map(l => l.osmId).filter(Boolean));

  const handleSearch = async () => {
    if (!city.trim()) { setSearchError('Ingresá una ciudad o zona.'); return; }
    setSearchError(''); setResults([]); setSelected(new Set()); setSearching(true);
    try {
      const { lat, lng } = await geocodeCity(city);
      const bt = OSM_TYPES[typeIdx];
      const elements = await queryOverpass(bt.tags, lat, lng, radius);
      const parsed = elements.map(el => parseOsmResult(el, city, bt.label))
        .filter(r => r.name)
        .filter((r, i, a) => a.findIndex(x => x.osmId === r.osmId) === i);
      setResults(parsed);
      if (!parsed.length) setSearchError('Sin resultados. Probá otro tipo o radio mayor.');
    } catch (err) { setSearchError(err.message); }
    setSearching(false);
  };

  const addLead = async (r) => {
    setAddingIds(s => new Set([...s, r.osmId]));
    try {
      await DataService.createLead({ ...r, source: 'openstreetmap' });
      onAdded();
    } catch (err) { alert('Error: ' + err.message); }
    setAddingIds(s => { const n = new Set(s); n.delete(r.osmId); return n; });
  };

  const addSelected = async () => {
    for (const r of results.filter(r => selected.has(r.osmId) && !existingIds.has(r.osmId))) {
      await addLead(r);
    }
    setSelected(new Set());
  };

  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const addable = results.filter(r => !existingIds.has(r.osmId));
  const allSel = addable.length > 0 && selected.size === addable.length;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Buscar negocios por zona — OpenStreetMap</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <FormField label="Tipo de negocio">
            <select value={typeIdx} onChange={e => setTypeIdx(Number(e.target.value))} className={_inputCls()}>
              {OSM_TYPES.map((bt, i) => <option key={i} value={i}>{bt.icon} {bt.label}</option>)}
            </select>
          </FormField>
          <FormField label="Ciudad / Zona">
            <input value={city} onChange={e => setCity(e.target.value)} className={_inputCls()}
              placeholder="Ej: Villa María, Córdoba"
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </FormField>
          <FormField label="Radio de búsqueda">
            <select value={radius} onChange={e => setRadius(Number(e.target.value))} className={_inputCls()}>
              {[[1000,'1 km'],[2000,'2 km'],[3000,'3 km'],[5000,'5 km'],[10000,'10 km']].map(([v, l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
        </div>
        <div className="flex items-center gap-3">
          <Btn onClick={handleSearch} disabled={searching} variant="primary" icon="search">
            {searching ? 'Buscando...' : 'Buscar negocios'}
          </Btn>
          <p className="text-xs text-slate-400">Gratis, sin límites. Puede no incluir todos los negocios.</p>
        </div>
      </div>

      {searchError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">{searchError}</div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-slate-700">
              {results.length} resultado{results.length !== 1 ? 's' : ''} · {addable.length} sin agregar
            </p>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <Btn onClick={addSelected} variant="primary" size="sm" icon="plus">
                  Agregar {selected.size}
                </Btn>
              )}
              <button onClick={() => setSelected(allSel ? new Set() : new Set(addable.map(r => r.osmId)))}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                {allSel ? 'Deseleccionar' : 'Seleccionar todos'}
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {results.map(r => {
              const added = existingIds.has(r.osmId);
              const adding = addingIds.has(r.osmId);
              return (
                <div key={r.osmId}
                  className={`flex items-center gap-3 px-5 py-3.5 ${added ? 'opacity-40' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selected.has(r.osmId)} disabled={added}
                    onChange={() => toggleSel(r.osmId)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {[r.address, r.city].filter(Boolean).join(', ')}{r.phone ? ` · ${r.phone}` : ''}
                    </p>
                  </div>
                  {r.website && (
                    <a href={r.website.startsWith('http') ? r.website : `https://${r.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex-shrink-0">web</a>
                  )}
                  {added ? (
                    <span className="text-xs text-emerald-600 font-medium flex-shrink-0">✓ Guardado</span>
                  ) : (
                    <button onClick={() => addLead(r)} disabled={adding}
                      className="flex-shrink-0 p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 disabled:opacity-50">
                      <Icon name={adding ? 'refresh' : 'plus'} size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: COMPETENCIA ─────────────────────────────────────────────────────────
function TabCompetencia({ competitors, leads, onRefresh }) {
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  const handleDelete = async (comp) => {
    if (!window.confirm(`¿Eliminar "${comp.name}"?`)) return;
    try {
      await DataService.deleteCompetitor(comp.id);
      onRefresh();
    } catch (err) { alert(err.message); }
  };

  // Detección automática de oportunidades
  const opportunities = [];
  const zones = [...new Set(leads.map(l => l.city).filter(Boolean))];
  zones.forEach(zone => {
    const zLeads = leads.filter(l => l.city === zone);
    const zComps = competitors.filter(c => c.zone === zone);
    const hasDominant = zComps.some(c => c.strength === 'dominante');
    const highPrio = zLeads.filter(l => l._priority === 'alta').length;
    if (highPrio >= 2 && !hasDominant) {
      opportunities.push({
        color: 'emerald',
        msg: `🚀 ${zone}: ${highPrio} leads de alta prioridad — sin competidor dominante`,
      });
    }
  });
  competitors.filter(c => c.strength === 'debil').forEach(comp => {
    opportunities.push({
      color: 'amber',
      msg: `⚡ ${comp.name}${comp.zone ? ` (${comp.zone})` : ''} está clasificado como DÉBIL — zona recuperable`,
    });
  });
  if (competitors.length === 0 && leads.filter(l => l._priority === 'alta').length >= 3) {
    opportunities.push({
      color: 'emerald',
      msg: `🎯 Sin competidores registrados — zona con ${leads.filter(l => l._priority === 'alta').length} leads de alta prioridad libre`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Análisis de competencia</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {competitors.length} competidore{competitors.length !== 1 ? 's' : ''} registrado{competitors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Btn onClick={() => { setEditing(null); setShowModal(true); }} variant="primary" icon="plus">
          Agregar competidor
        </Btn>
      </div>

      {opportunities.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">🎯 Oportunidades detectadas</p>
          {opportunities.map((op, i) => (
            <div key={i} className={`p-4 rounded-xl border text-sm font-medium ${
              op.color === 'emerald'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {op.msg}
            </div>
          ))}
        </div>
      )}

      {competitors.length === 0 ? (
        <EmptyState icon="users" title="Sin competidores registrados"
          description="Registrá a tus competidores para detectar oportunidades y generar argumentos de venta basados en sus debilidades"
          action={
            <Btn onClick={() => { setEditing(null); setShowModal(true); }} variant="primary" icon="plus">
              Agregar competidor
            </Btn>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitors.map(comp => {
            const cc = COMP_CFG[comp.strength] || COMP_CFG.intermedio;
            const weaknesses = (comp.weaknesses || '').split(',').map(w => w.trim()).filter(Boolean);
            return (
              <div key={comp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
                      {cc.icon} {cc.label}
                    </span>
                    <h4 className="font-semibold text-slate-900 mt-2">{comp.name}</h4>
                    {comp.zone && <p className="text-xs text-slate-400">{comp.zone}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(comp); setShowModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400">
                      <Icon name="edit" size={14} />
                    </button>
                    <button onClick={() => handleDelete(comp)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
                {comp.rating > 0 && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-amber-400 text-sm leading-none">
                      {'★'.repeat(Math.round(comp.rating))}{'☆'.repeat(5 - Math.round(comp.rating))}
                    </span>
                    <span className="text-xs text-slate-400">{comp.rating}/5</span>
                    {comp.reviewsCount > 0 && (
                      <span className="text-xs text-slate-400">({comp.reviewsCount} reseñas)</span>
                    )}
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Debilidades → tus argumentos de venta
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {weaknesses.map((w, i) => (
                        <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
                          ⚠️ {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {comp.notes && <p className="text-xs text-slate-400 mt-2 italic">{comp.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CompetitorModal
          competitor={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={async (data) => {
            if (editing) await DataService.updateCompetitor(editing.id, data);
            else await DataService.createCompetitor(data);
            setShowModal(false);
            setEditing(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ── TAB: MENSAJES ─────────────────────────────────────────────────────────────
function TabMensajes({ leads, config, competitors }) {
  const [selectedId, setSelectedId] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const lead = leads.find(l => String(l.id) === selectedId);
  const message = lead ? buildWAMessage(lead, config, competitors) : '';
  const activeLeads = leads.filter(l => l.status !== 'descartado' && l.phone).sort((a, b) => b._score - a._score);

  const copyMsg = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCSV = () => {
    const h = ['Nombre', 'Teléfono', 'Dirección', 'Ciudad', 'Tipo', 'Estado', 'Prioridad', 'Score', 'Fuente', 'Notas'];
    const rows = leads.map(l => [
      l.name, l.phone, l.address, l.city,
      BIZ_TYPES.find(b => b.id === (l.businessType || l.type))?.label || l.type || '',
      CRM_STATES[l.status]?.label || l.status || '',
      PRIO_CFG[l._priority]?.label || l._priority || '',
      l._score, l.source,
      (l.notes || '').replace(/,/g, ';'),
    ]);
    const csv = [h, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })),
      download: `leads-${DataService.today()}.csv`,
    });
    a.click();
  };

  return (
    <div className="space-y-6">

      {/* Message generator */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-1">Generador de mensajes de venta</h3>
        <p className="text-sm text-slate-500 mb-4">
          Mensaje personalizado por tipo de negocio, incluye argumento de venta y oferta sugerida
        </p>
        <FormField label="Seleccionar lead">
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={_inputCls()}>
            <option value="">— Elegir lead —</option>
            {activeLeads.map(l => {
              const bt = BIZ_TYPES.find(b => b.id === (l.businessType || l.type));
              return (
                <option key={l.id} value={l.id}>
                  {PRIO_CFG[l._priority]?.label || 'LEAD'} · {l.name}
                  {l.city ? ` (${l.city})` : ''} · Score {l._score}
                  {bt ? ` · ${bt.icon}` : ''}
                </option>
              );
            })}
          </select>
        </FormField>
        {lead ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ScoreChip score={lead._score} />
              <PriorityBadge priority={lead._priority} />
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {getOfferType(lead)}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-3">
              <Btn onClick={copyMsg} variant="secondary" icon={copied ? 'check' : 'copy'}>
                {copied ? '¡Copiado!' : 'Copiar mensaje'}
              </Btn>
              {lead.phone && (
                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
                  <Icon name="messageCircle" size={16} />
                  Abrir WhatsApp
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-6 bg-gray-50 rounded-xl text-center">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-sm text-slate-400">Elegí un lead para ver el mensaje generado</p>
          </div>
        )}
      </div>

      {/* Quick contact list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-1">Contactar hoy</h3>
        <p className="text-sm text-slate-500 mb-4">Top 5 leads nuevos de alta prioridad con teléfono</p>
        <div className="space-y-2">
          {leads.filter(l => l.status === 'nuevo' && l.phone)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)
            .map(l => (
              <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <ScoreChip score={l._score} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{l.name}</p>
                  <p className="text-xs text-slate-400">{l.city || '—'} · {getOfferType(l)}</p>
                </div>
                <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}?text=${encodeURIComponent(buildWAMessage(l, config, competitors))}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0">
                  <Icon name="messageCircle" size={13} />WA
                </a>
              </div>
            ))}
          {leads.filter(l => l.status === 'nuevo' && l.phone).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No hay leads nuevos con teléfono</p>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Exportar base de leads</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {leads.length} leads con score y prioridad · CSV para Meta Ads, Excel o CRM externo
            </p>
          </div>
          <Btn onClick={exportCSV} variant="secondary" icon="fileText">Exportar CSV</Btn>
        </div>
      </div>
    </div>
  );
}

// ── LEAD ROW ──────────────────────────────────────────────────────────────────
function LeadRow({ lead, onUpdateStatus, onDelete, onConvert, onEdit, onWA }) {
  const bt = BIZ_TYPES.find(b => b.id === (lead.businessType || lead.type));
  const cs = CRM_STATES[lead.status] || CRM_STATES.nuevo;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-slate-900 truncate">{lead.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cs.bg} ${cs.text}`}>
            {cs.label}
          </span>
          <PriorityBadge priority={lead._priority} dot />
        </div>
        <p className="text-xs text-slate-400 truncate">
          {bt ? `${bt.icon} ${bt.label}` : (lead.type || '—')}
          {lead.city ? ` · ${lead.city}` : ''}
          {lead.phone ? ` · ${lead.phone}` : ''}
        </p>
      </div>
      <ScoreChip score={lead._score} />
      <div className="flex items-center gap-1 flex-shrink-0">
        <select value={lead.status} onChange={e => onUpdateStatus(lead, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white mr-1">
          {Object.entries(CRM_STATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {lead.phone && (
          <button onClick={onWA} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Mensaje WA">
            <Icon name="messageCircle" size={15} />
          </button>
        )}
        <button onClick={() => onEdit(lead)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400">
          <Icon name="edit" size={15} />
        </button>
        {lead.status !== 'cliente' && (
          <button onClick={() => onConvert(lead)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Convertir en cliente">
            <Icon name="userPlus" size={15} />
          </button>
        )}
        <button onClick={() => onDelete(lead)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
          <Icon name="trash" size={15} />
        </button>
      </div>
    </div>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function LeadFormModal({ isOpen, lead, onClose, onSave }) {
  const isEdit = !!lead?.id;
  const blank = { name: '', phone: '', address: '', city: '', businessType: 'oficina', employeeCount: '', notes: '' };
  const [form, setForm] = React.useState(blank);
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(lead ? {
      name: lead.name || '', phone: lead.phone || '', address: lead.address || '',
      city: lead.city || '', businessType: lead.businessType || lead.type || 'oficina',
      employeeCount: lead.employeeCount || '', notes: lead.notes || '',
    } : blank);
  }, [isOpen]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        type: form.businessType,
        businessType: form.businessType,
        employeeCount: Number(form.employeeCount) || null,
      });
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar lead' : 'Nuevo lead'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Nombre / Empresa" required>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className={_inputCls()} placeholder="Gym Centro, Farmacia López..." autoFocus required />
            </FormField>
          </div>
          <FormField label="Teléfono">
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className={_inputCls()} placeholder="1123456789" />
          </FormField>
          <FormField label="Ciudad">
            <input value={form.city} onChange={e => set('city', e.target.value)}
              className={_inputCls()} placeholder="Villa María" />
          </FormField>
          <FormField label="Tipo de negocio">
            <select value={form.businessType} onChange={e => set('businessType', e.target.value)} className={_inputCls()}>
              {BIZ_TYPES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.label}</option>)}
            </select>
          </FormField>
          <FormField label="Empleados (aprox.)">
            <input value={form.employeeCount} onChange={e => set('employeeCount', e.target.value)}
              type="number" min="0" className={_inputCls()} placeholder="Ej: 10" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Dirección">
              <input value={form.address} onChange={e => set('address', e.target.value)}
                className={_inputCls()} placeholder="Av. San Martín 123" />
            </FormField>
          </div>
        </div>
        <FormField label="Notas">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            className={_inputCls('resize-none')} rows="2"
            placeholder="Contacto, horarios, observaciones..." />
        </FormField>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon="plus" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Agregar lead'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function CompetitorModal({ competitor, onClose, onSave }) {
  const blank = { name: '', zone: '', strength: 'intermedio', weaknesses: '', rating: '', reviewsCount: '', notes: '' };
  const [form, setForm] = React.useState(blank);
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    setForm(competitor ? {
      name: competitor.name || '', zone: competitor.zone || '',
      strength: competitor.strength || 'intermedio',
      weaknesses: competitor.weaknesses || '',
      rating: competitor.rating || '', reviewsCount: competitor.reviewsCount || '',
      notes: competitor.notes || '',
    } : blank);
  }, [competitor]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, rating: Number(form.rating) || 0, reviewsCount: Number(form.reviewsCount) || 0 });
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={competitor ? 'Editar competidor' : 'Nuevo competidor'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Nombre del competidor" required>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                className={_inputCls()} placeholder="Agua Pura López..." autoFocus />
            </FormField>
          </div>
          <FormField label="Zona / Ciudad">
            <input value={form.zone} onChange={e => set('zone', e.target.value)}
              className={_inputCls()} placeholder="Villa del Rosario" />
          </FormField>
          <FormField label="Clasificación">
            <select value={form.strength} onChange={e => set('strength', e.target.value)} className={_inputCls()}>
              <option value="dominante">🔴 Dominante</option>
              <option value="intermedio">🟡 Intermedio</option>
              <option value="debil">🟢 Débil</option>
            </select>
          </FormField>
          <FormField label="Calificación (1-5)">
            <input value={form.rating} onChange={e => set('rating', e.target.value)}
              type="number" min="0" max="5" step="0.1" className={_inputCls()} placeholder="3.5" />
          </FormField>
          <FormField label="Cantidad de reseñas">
            <input value={form.reviewsCount} onChange={e => set('reviewsCount', e.target.value)}
              type="number" min="0" className={_inputCls()} placeholder="42" />
          </FormField>
        </div>
        <FormField label="Debilidades" hint="Separadas por coma: demoras en entrega, mala atención, precios altos">
          <input value={form.weaknesses} onChange={e => set('weaknesses', e.target.value)}
            className={_inputCls()} placeholder="demoras en entrega, mala atención, precios altos" />
        </FormField>
        <FormField label="Notas internas">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            className={_inputCls('resize-none')} rows="2" />
        </FormField>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando...' : competitor ? 'Guardar' : 'Agregar'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── TAB: GOOGLE PLACES ────────────────────────────────────────────────────────
function TabGooglePlaces({ config, competitors, onRefresh }) {
  const [apiKey, setApiKey]       = React.useState(() => localStorage.getItem('gp_api_key') || '');
  const [city, setCity]           = React.useState(config.city || '');
  const [mode, setMode]           = React.useState('competitors');
  const [radius, setRadius]       = React.useState(25000);
  const [searching, setSearching] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [results, setResults]     = React.useState([]);
  const [pageTokens, setPageTokens] = React.useState({});  // { label: token }
  const [error, setError]         = React.useState('');
  const [saving, setSaving]       = React.useState(null);
  const [usage, setUsage]         = React.useState(() => gpUsage());
  const [limitInput, setLimitInput] = React.useState(() => String(gpLimit()));
  const [showConfig, setShowConfig] = React.useState(false);

  const saveKey = k => { setApiKey(k); localStorage.setItem('gp_api_key', k); };
  const saveLimit = v => { localStorage.setItem('gp_limit', v); setLimitInput(v); };
  const limit = parseInt(limitInput) || 9990;
  const usagePct = Math.min(100, Math.round(usage.count / limit * 100));
  const usageColor = usagePct >= 95 ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  const usageBg   = usagePct >= 95 ? 'bg-red-50 border-red-200' : usagePct >= 80 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200';

  const processPlaces = (places, s, seen) => {
    const added = [];
    for (const p of places) {
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      p._analysis    = analyzeGPPlace(p);
      p._bizType     = s.bizType || 'competidor';
      p._searchLabel = s.label;
      added.push(p);
    }
    return added;
  };

  const handleSearch = async () => {
    if (!apiKey.trim()) { setError('Ingresá tu clave de Google Places API.'); return; }
    if (!city.trim())   { setError('Ingresá una ciudad.'); return; }
    if (usage.count >= limit) { setError(`Límite de ${limit} consultas alcanzado este mes.`); return; }
    setError(''); setResults([]); setPageTokens({}); setSearching(true);
    try {
      const { lat, lng } = await geocodeCity(city);
      const seen = new Set();
      const all  = [];
      const tokens = {};
      const searches = GP_SEARCHES[mode];
      for (const s of searches) {
        const { places, nextPageToken } = await searchGP(s.query, city, lat, lng, apiKey, null, radius);
        gpAddUsage(1);
        all.push(...processPlaces(places, s, seen));
        if (nextPageToken) tokens[s.label] = { token: nextPageToken, s, lat, lng, radius };
      }
      setUsage(gpUsage());
      setResults(all);
      setPageTokens(tokens);
      if (!all.length) setError('Sin resultados. Probá otra ciudad o verificá la clave API.');
    } catch (err) { setError(err.message); }
    setSearching(false);
  };

  const handleLoadMore = async () => {
    if (usage.count >= limit) { setError(`Límite de ${limit} consultas alcanzado.`); return; }
    setLoadingMore(true);
    try {
      const seen = new Set(results.map(r => r.name));
      const more = [];
      const newTokens = {};
      for (const [label, { token, s, lat, lng, radius: r }] of Object.entries(pageTokens)) {
        const { places, nextPageToken } = await searchGP(s.query, city, lat, lng, apiKey, token, r);
        gpAddUsage(1);
        more.push(...processPlaces(places, s, seen));
        if (nextPageToken) newTokens[label] = { token: nextPageToken, s, lat, lng, radius: r };
      }
      setUsage(gpUsage());
      setResults(r => [...r, ...more]);
      setPageTokens(newTokens);
    } catch (err) { setError(err.message); }
    setLoadingMore(false);
  };

  const saveAsCompetitor = async (place) => {
    setSaving(place.name);
    try {
      const { weaknesses, strength } = place._analysis;
      await DataService.createCompetitor({
        name: place.displayName?.text || '',
        zone: city, strength, weaknesses,
        rating: place.rating || null,
        reviewsCount: place.userRatingCount || null,
        notes: 'Fuente: Google Places',
      });
      onRefresh();
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(null);
  };

  const saveAsLead = async (place) => {
    setSaving(place.name);
    try {
      await DataService.createLead({
        name: place.displayName?.text || '',
        phone: place.internationalPhoneNumber || '',
        address: place.formattedAddress || '',
        city, businessType: place._bizType, type: place._bizType, source: 'google',
        notes: place.rating ? `Rating Google: ${place.rating}/5 (${place.userRatingCount || 0} reseñas)` : '',
      });
      onRefresh();
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(null);
  };

  const exportCSV = () => {
    if (!results.length) return;
    const blob = new Blob(['﻿' + gpToCSV(results, mode)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gplaces-${mode}-${city.replace(/\s/g, '_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const hasMore = Object.keys(pageTokens).length > 0;

  return (
    <div className="space-y-5">

      {/* API Key + Config */}
      <div className={`border rounded-2xl p-4 space-y-3 ${usagePct >= 80 ? usageBg : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Google Places API</p>
              <p className="text-xs text-amber-600">Guardada solo en este navegador.</p>
            </div>
          </div>
          <button onClick={() => setShowConfig(c => !c)}
            className="text-xs text-slate-500 hover:text-slate-700 border border-gray-200 rounded-lg px-2 py-1">
            {showConfig ? 'Cerrar' : '⚙ Config'}
          </button>
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-medium">Consultas este mes</p>
            <p className={`text-xs font-bold ${usagePct >= 95 ? 'text-red-600' : usagePct >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {usage.count} / {limit}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${usageColor}`} style={{ width: `${usagePct}%` }} />
          </div>
          {usagePct >= 80 && (
            <p className={`text-xs mt-1 ${usagePct >= 95 ? 'text-red-600 font-semibold' : 'text-amber-600'}`}>
              {usagePct >= 95 ? '⛔ Límite alcanzado. Reinicia el 1° del mes o subí el límite.' : '⚠ Cerca del límite configurado.'}
            </p>
          )}
        </div>

        {showConfig && (
          <div className="border-t border-amber-200 pt-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-600 mb-1 font-medium">Clave API</p>
                <input type="password" value={apiKey} onChange={e => saveKey(e.target.value)}
                  className={_inputCls('font-mono text-xs')} placeholder="AIzaSy..." />
              </div>
              {apiKey && (
                <div className="flex items-end">
                  <button onClick={() => saveKey('')}
                    className="px-3 py-2.5 text-xs border border-gray-200 rounded-xl text-red-500 hover:bg-red-50">
                    Borrar
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <p className="text-xs text-slate-600 mb-1 font-medium">Límite mensual de consultas</p>
                <input type="number" value={limitInput} onChange={e => saveLimit(e.target.value)}
                  className={_inputCls()} min="10" step="10" />
              </div>
              <button onClick={() => { const u = gpUsage(); u.count = 0; localStorage.setItem('gp_usage', JSON.stringify(u)); setUsage(gpUsage()); }}
                className="text-xs text-slate-500 border border-gray-200 rounded-xl px-3 py-2.5 hover:bg-gray-50">
                Resetear contador
              </button>
            </div>
          </div>
        )}

        {!showConfig && (
          <div className="flex gap-2">
            <input type="password" value={apiKey} onChange={e => saveKey(e.target.value)}
              className={_inputCls('font-mono text-xs')} placeholder="AIzaSy..." />
          </div>
        )}
      </div>

      {/* Search controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Buscar con Google Places</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <FormField label="Modo">
            <select value={mode} onChange={e => { setMode(e.target.value); setResults([]); setPageTokens({}); }} className={_inputCls()}>
              <option value="competitors">🏁 Competidores</option>
              <option value="leads">🎯 Clientes potenciales</option>
            </select>
          </FormField>
          <FormField label="Ciudad / Zona">
            <input value={city} onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={_inputCls()} placeholder="Gualeguay, Entre Ríos" />
          </FormField>
          <FormField label="Radio">
            <select value={radius} onChange={e => setRadius(Number(e.target.value))} className={_inputCls()}>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={25000}>25 km</option>
              <option value={50000}>50 km</option>
              <option value={100000}>100 km</option>
            </select>
          </FormField>
          <FormField label=" ">
            <Btn onClick={handleSearch} disabled={searching || usage.count >= limit} variant="primary" icon="search" className="w-full justify-center">
              {searching ? 'Buscando...' : 'Buscar'}
            </Btn>
          </FormField>
        </div>
        <p className="text-xs text-slate-400">
          Busca: {GP_SEARCHES[mode].map(s => s.label).join(', ')} ·
          Cada búsqueda usa {GP_SEARCHES[mode].length} consulta{GP_SEARCHES[mode].length !== 1 ? 's' : ''}.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {results.length} resultado{results.length !== 1 ? 's' : ''}
              {hasMore && <span className="text-xs text-blue-600 font-normal ml-2">· hay más disponibles</span>}
            </p>
            <Btn onClick={exportCSV} variant="secondary" size="sm" icon="download">Exportar CSV</Btn>
          </div>

          <div className="space-y-3">
            {results.map(place => {
              const { weaknesses, strength, negRevs, posRevs } = place._analysis;
              const isSaving = saving === place.name;
              const fakeLead = { businessType: place._bizType, phone: place.internationalPhoneNumber, address: place.formattedAddress, source: 'google' };
              const score = calcScore(fakeLead);
              return (
                <div key={place.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-slate-900 text-sm">{place.displayName?.text}</p>
                        <span className="text-xs text-slate-400 bg-gray-100 px-1.5 py-0.5 rounded">{place._searchLabel}</span>
                        {mode === 'competitors' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMP_CFG[strength].bg} ${COMP_CFG[strength].text}`}>
                            {COMP_CFG[strength].icon} {COMP_CFG[strength].label}
                          </span>
                        )}
                      </div>
                      {place.formattedAddress && (
                        <p className="text-xs text-slate-500 mb-0.5 truncate">{place.formattedAddress}</p>
                      )}
                      {place.internationalPhoneNumber && (
                        <p className="text-xs text-slate-500">{place.internationalPhoneNumber}</p>
                      )}
                      {place.rating != null && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-bold text-amber-500">★ {place.rating}</span>
                          <span className="text-xs text-slate-400">{place.userRatingCount || 0} reseñas</span>
                        </div>
                      )}
                      {mode === 'competitors' && (weaknesses || negRevs.length > 0 || posRevs.length > 0) && (
                        <div className="mt-2 space-y-1.5">
                          {weaknesses && (
                            <p className="text-xs text-red-700">
                              <span className="font-semibold">⚠ Debilidades:</span> {weaknesses}
                            </p>
                          )}
                          {negRevs[0]?.text?.text && (
                            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                              <p className="text-xs text-red-600 italic">"{negRevs[0].text.text.slice(0, 150)}{negRevs[0].text.text.length > 150 ? '...' : ''}"</p>
                            </div>
                          )}
                          {posRevs[0]?.text?.text && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                              <p className="text-xs text-emerald-700 italic">"{posRevs[0].text.text.slice(0, 150)}{posRevs[0].text.text.length > 150 ? '...' : ''}"</p>
                            </div>
                          )}
                        </div>
                      )}
                      {mode === 'leads' && (
                        <div className="flex items-center gap-2 mt-2">
                          <ScoreChip score={score} />
                          <PriorityBadge priority={getPriority(score)} />
                          <span className="text-xs text-slate-400">{getOfferType({ businessType: place._bizType })}</span>
                        </div>
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
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="text-center">
              <Btn onClick={handleLoadMore} disabled={loadingMore || usage.count >= limit} variant="secondary">
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
