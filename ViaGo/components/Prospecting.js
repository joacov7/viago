// NATIVA - Prospecting / Captación module (OpenStreetMap + lead management)

const inputCls = (extra = '') => `w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${extra}`;

const BUSINESS_TYPES = [
  { label: 'Gimnasio / Fitness', tags: [['leisure','fitness_centre'],['amenity','gym']], icon: '🏋️' },
  { label: 'Empresa / Oficina',  tags: [['office','company'],['office','yes']], icon: '🏢' },
  { label: 'Restaurante',        tags: [['amenity','restaurant']], icon: '🍽️' },
  { label: 'Bar / Café',         tags: [['amenity','bar'],['amenity','cafe']], icon: '☕' },
  { label: 'Farmacia',           tags: [['amenity','pharmacy']], icon: '💊' },
  { label: 'Supermercado',       tags: [['shop','supermarket']], icon: '🛒' },
  { label: 'Escuela / Colegio',  tags: [['amenity','school']], icon: '🎓' },
  { label: 'Hotel / Hostel',     tags: [['tourism','hotel'],['tourism','hostel']], icon: '🏨' },
  { label: 'Panadería',          tags: [['shop','bakery']], icon: '🥖' },
  { label: 'Peluquería / Salón', tags: [['shop','hairdresser'],['shop','beauty']], icon: '✂️' },
  { label: 'Consultorio / Clínica', tags: [['amenity','doctors'],['amenity','clinic']], icon: '🏥' },
  { label: 'Veterinaria',        tags: [['amenity','veterinary']], icon: '🐾' },
  { label: 'Taller / Mecánica',  tags: [['shop','car_repair']], icon: '🔧' },
  { label: 'Kiosco / Almacén',   tags: [['shop','kiosk'],['shop','convenience']], icon: '🏪' },
];

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
  const conditions = tags.flatMap(([k, v]) => [
    `node["${k}"="${v}"](around:${radius},${lat},${lng});`,
    `way["${k}"="${v}"](around:${radius},${lat},${lng});`,
  ]).join('');
  const query = `[out:json][timeout:30];(${conditions});out center tags;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
  const data = await res.json();
  return data.elements || [];
}

function parseOsmResult(el, city, typeLabel) {
  const t = el.tags || {};
  const address = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
  const phone = t.phone || t['contact:phone'] || t['mobile'] || '';
  const website = t.website || t['contact:website'] || '';
  return {
    osmId: String(el.id),
    name: t.name || t['name:es'] || '',
    phone: phone.replace(/\s/g, ''),
    address,
    city: t['addr:city'] || city,
    website,
    type: typeLabel,
  };
}

function Prospecting() {
  const [tab, setTab] = React.useState('buscar');
  const [leads, setLeads] = React.useState([]);
  const [typeIdx, setTypeIdx] = React.useState(0);
  const [city, setCity] = React.useState('');
  const [radius, setRadius] = React.useState(3000);
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());
  const [searchError, setSearchError] = React.useState('');
  const [addingIds, setAddingIds] = React.useState(new Set());

  const reload = async () => {
    const [ls, cfg] = await Promise.all([DataService.getLeads(), DataService.getConfig()]);
    setLeads(ls);
    setCity(c => c || cfg.city || '');
  };
  React.useEffect(() => { reload(); }, []);

  const existingOsmIds = new Set(leads.map(l => l.osmId).filter(Boolean));

  const handleSearch = async () => {
    if (!city.trim()) { setSearchError('Ingresá una ciudad o zona.'); return; }
    setSearchError(''); setResults([]); setSelected(new Set()); setSearching(true);
    try {
      const { lat, lng } = await geocodeCity(city);
      const btype = BUSINESS_TYPES[typeIdx];
      const elements = await queryOverpass(btype.tags, lat, lng, radius);
      const parsed = elements
        .map(el => parseOsmResult(el, city, btype.label))
        .filter(r => r.name)
        .filter((r, i, arr) => arr.findIndex(x => x.osmId === r.osmId) === i);
      setResults(parsed);
      if (!parsed.length) setSearchError('No se encontraron resultados. Probá otro tipo de negocio o un radio mayor.');
    } catch (err) {
      setSearchError(err.message);
    }
    setSearching(false);
  };

  const addLead = async (r) => {
    setAddingIds(s => new Set([...s, r.osmId]));
    try {
      await DataService.createLead({ ...r, source: 'openstreetmap' });
      setLeads(ls => [...ls, { ...r, status: 'nuevo' }]);
    } catch (err) { alert('Error: ' + err.message); }
    setAddingIds(s => { const n = new Set(s); n.delete(r.osmId); return n; });
  };

  const addSelected = async () => {
    const toAdd = results.filter(r => selected.has(r.osmId) && !existingOsmIds.has(r.osmId));
    for (const r of toAdd) await addLead(r);
    setSelected(new Set());
  };

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const addable = results.filter(r => !existingOsmIds.has(r.osmId));
  const allSelected = addable.length > 0 && selected.size === addable.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(addable.map(r => r.osmId)));

  return (
    <div>
      <PageHeader title="Captación" subtitle="Buscá prospectos y gestioná tus leads"
        action={<span className="text-xs text-slate-400 font-medium">{leads.length} leads guardados</span>} />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[['buscar','Buscar negocios'],['leads','Mis leads']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}{id === 'leads' && leads.length > 0 && <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{leads.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'buscar' && (
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <FormField label="Tipo de negocio">
                <select value={typeIdx} onChange={e => setTypeIdx(Number(e.target.value))} className={inputCls()}>
                  {BUSINESS_TYPES.map((bt, i) => <option key={i} value={i}>{bt.icon} {bt.label}</option>)}
                </select>
              </FormField>
              <FormField label="Ciudad / Zona">
                <input value={city} onChange={e => setCity(e.target.value)} className={inputCls()}
                  placeholder="Ej: Villa María, Córdoba" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </FormField>
              <FormField label="Radio">
                <select value={radius} onChange={e => setRadius(Number(e.target.value))} className={inputCls()}>
                  {[[1000,'1 km'],[2000,'2 km'],[3000,'3 km'],[5000,'5 km'],[10000,'10 km']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </FormField>
            </div>
            <Btn onClick={handleSearch} disabled={searching} variant="primary" icon="search">
              {searching ? 'Buscando en OpenStreetMap...' : 'Buscar'}
            </Btn>
            <p className="text-xs text-slate-400 mt-2">Datos de OpenStreetMap — gratis, sin límites. Puede no tener todos los negocios.</p>
          </div>

          {searchError && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">{searchError}</div>}

          {results.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-slate-700">{results.length} resultado{results.length !== 1 ? 's' : ''} · {addable.length} sin agregar</p>
                <div className="flex items-center gap-3">
                  {selected.size > 0 && (
                    <Btn onClick={addSelected} variant="primary" size="sm" icon="plus">Agregar {selected.size}</Btn>
                  )}
                  <button onClick={toggleAll} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {results.map(r => {
                  const added = existingOsmIds.has(r.osmId);
                  const adding = addingIds.has(r.osmId);
                  return (
                    <div key={r.osmId} className={`flex items-center gap-3 px-5 py-3.5 ${added ? 'opacity-40' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={selected.has(r.osmId)} disabled={added}
                        onChange={() => toggleSelect(r.osmId)} className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {[r.address, r.city].filter(Boolean).join(', ')}
                          {r.phone && <span className="ml-2 text-slate-500">· {r.phone}</span>}
                        </p>
                      </div>
                      {r.website && (
                        <a href={r.website.startsWith('http') ? r.website : `https://${r.website}`}
                          target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex-shrink-0">web</a>
                      )}
                      {added ? (
                        <span className="text-xs text-emerald-600 font-medium flex-shrink-0">✓ Guardado</span>
                      ) : (
                        <button onClick={() => addLead(r)} disabled={adding}
                          className="flex-shrink-0 p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 disabled:opacity-50" title="Agregar a leads">
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
      )}

      {tab === 'leads' && <LeadsList leads={leads} onReload={reload} />}
    </div>
  );
}

function LeadsList({ leads, onReload }) {
  const [filter, setFilter] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const counts = ['nuevo','contactado','convertido','descartado'].reduce((acc, s) => ({ ...acc, [s]: leads.filter(l => l.status === s).length }), {});
  const filtered = filter ? leads.filter(l => l.status === filter) : leads;

  const statusColors = {
    nuevo: 'bg-blue-100 text-blue-700',
    contactado: 'bg-amber-100 text-amber-700',
    convertido: 'bg-emerald-100 text-emerald-700',
    descartado: 'bg-gray-100 text-gray-500',
  };

  const convertToClient = async (lead) => {
    if (!window.confirm(`¿Convertir "${lead.name}" en cliente?`)) return;
    try {
      await DataService.createClient({ name: lead.name, phone: lead.phone, address: lead.address, city: lead.city, type: 'empresa', notes: lead.notes || '' });
      await DataService.updateLead(lead.id, { status: 'convertido' });
      await onReload();
      alert(`Cliente "${lead.name}" creado.`);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const updateStatus = async (lead, status) => {
    try { await DataService.updateLead(lead.id, { status }); onReload(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  const deleteLead = async (lead) => {
    if (!window.confirm(`¿Eliminar "${lead.name}"?`)) return;
    await DataService.deleteLead(lead.id);
    onReload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {[['','Todos',leads.length],['nuevo','Nuevos',counts.nuevo],['contactado','Contactados',counts.contactado],['convertido','Convertidos',counts.convertido],['descartado','Descartados',counts.descartado]].map(([val,label,count]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
              {label} <span className="opacity-70">({count})</span>
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowForm(true)} icon="plus" variant="primary" size="sm">Nuevo lead</Btn>
      </div>

      {leads.length === 0 ? (
        <EmptyState icon="search" title="Sin leads todavía"
          description="Buscá negocios en la otra pestaña o agregá un lead manualmente"
          action={<Btn onClick={() => setShowForm(true)} icon="plus" variant="primary">Agregar lead</Btn>} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(lead => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[lead.status] || statusColors.nuevo}`}>{lead.status}</span>
                    {lead.source === 'openstreetmap' && <span className="text-xs text-slate-400">OSM</span>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {lead.type} · {[lead.address, lead.city].filter(Boolean).join(', ')}
                    {lead.phone && <span className="ml-2">· {lead.phone}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {lead.status !== 'convertido' && lead.status !== 'descartado' && (
                    <select value={lead.status} onChange={e => updateStatus(lead, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white mr-1">
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="descartado">Descartar</option>
                    </select>
                  )}
                  {lead.phone && (
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`¡Hola ${lead.name}! Te contactamos de NATIVA 💧 ¿Te interesa el servicio de agua a domicilio?`)}`}
                      target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="WhatsApp">
                      <Icon name="messageCircle" size={15} />
                    </a>
                  )}
                  {lead.status !== 'convertido' && (
                    <button onClick={() => convertToClient(lead)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Convertir en cliente">
                      <Icon name="userPlus" size={15} />
                    </button>
                  )}
                  <button onClick={() => deleteLead(lead)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Eliminar">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <LeadFormModal isOpen={showForm} onClose={() => setShowForm(false)} onSave={async (data) => {
        await DataService.createLead({ ...data, source: 'manual' });
        setShowForm(false);
        onReload();
      }} />
    </div>
  );
}

function LeadFormModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = React.useState({ name: '', phone: '', address: '', city: '', type: 'empresa', notes: '' });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    if (isOpen) setForm({ name: '', phone: '', address: '', city: '', type: 'empresa', notes: '' });
  }, [isOpen]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('El nombre es obligatorio'); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (err) { alert('Error al guardar: ' + err.message); }
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo lead" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nombre / Empresa" required>
            <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls()} placeholder="Gym Centro, Farmacia López..." autoFocus required />
          </FormField>
          <FormField label="Teléfono">
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls()} placeholder="1123456789" />
          </FormField>
          <FormField label="Dirección">
            <input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls()} placeholder="Av. San Martín 123" />
          </FormField>
          <FormField label="Ciudad">
            <input value={form.city} onChange={e => set('city', e.target.value)} className={inputCls()} placeholder="Villa María" />
          </FormField>
          <FormField label="Tipo">
            <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls()}>
              <option value="empresa">Empresa / Oficina</option>
              <option value="gimnasio">Gimnasio / Fitness</option>
              <option value="restaurante">Restaurante / Bar</option>
              <option value="comercio">Comercio</option>
              <option value="otro">Otro</option>
            </select>
          </FormField>
        </div>
        <FormField label="Notas">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls('resize-none')} rows="2" placeholder="Contacto, horarios, observaciones..." />
        </FormField>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon="plus" disabled={saving}>{saving ? 'Guardando...' : 'Agregar lead'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
