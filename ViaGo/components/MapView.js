// NATIVA — Mapa de clientes y comodatos

const MAP_ZONE_COLORS = [
  '#2563eb','#16a34a','#dc2626','#d97706','#7c3aed',
  '#0891b2','#db2777','#65a30d','#ea580c','#6366f1',
];

const DISP_STATUS_MAP = {
  comodato:   { color: '#16a34a', label: 'En comodato',   icon: '🟢' },
  deposito:   { color: '#2563eb', label: 'En depósito',   icon: '🔵' },
  reparacion: { color: '#d97706', label: 'En reparación', icon: '🟡' },
  baja:       { color: '#6b7280', label: 'Dado de baja',  icon: '⚫' },
};

function makeIcon(color, emoji, size = 32) {
  return L.divIcon({
    html: `<div style="
      background:${color};color:white;border-radius:50%;
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * 0.45)}px;
      border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
      ${emoji}
    </div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], className: '',
  });
}

// ── MapView main component ──────────────────────────────────────────────────
function MapView() {
  const [tab, setTab]           = React.useState('clients');
  const [clients, setClients]   = React.useState([]);
  const [zones, setZones]       = React.useState([]);
  const [dispensers, setDispensers] = React.useState([]);
  const [loading, setLoading]   = React.useState(true);
  const [geocoding, setGeocoding] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  React.useEffect(() => {
    Promise.all([
      DataService.getClients(false),
      DataService.getZones(),
      DataService.getDispensers(),
    ]).then(([cs, zs, ds]) => {
      setClients(cs);
      setZones(zs);
      setDispensers(ds);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Mapa"
        subtitle={`${clients.length} clientes · ${dispensers.filter(d => d.status === 'comodato').length} comodatos activos`}
      />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {[
          { id: 'clients',    label: `👥 Clientes (${clients.length})` },
          { id: 'dispensers', label: `🫙 Comodatos (${dispensers.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clients' && (
        <ClientsMap clients={clients} zones={zones} />
      )}
      {tab === 'dispensers' && (
        <DispensersMap dispensers={dispensers} clients={clients} />
      )}
    </div>
  );
}

// ── Clients map ─────────────────────────────────────────────────────────────
function ClientsMap({ clients, zones }) {
  const [filterZone, setFilterZone] = React.useState('');
  const [filterType, setFilterType] = React.useState('');
  const [geocoding, setGeocoding]   = React.useState(false);
  const [done, setDone]             = React.useState(0);

  const mapRef      = React.useRef(null);
  const mapInstance = React.useRef(null);
  const markersRef  = React.useRef([]);

  const filtered = clients.filter(c =>
    (!filterZone || String(c.zoneId) === filterZone) &&
    (!filterType  || c.type === filterType)
  );

  const zoneColor = (zoneId) => {
    const idx = zones.findIndex(z => z.id === zoneId);
    return idx >= 0 ? (zones[idx].color || MAP_ZONE_COLORS[idx % MAP_ZONE_COLORS.length]) : '#64748b';
  };

  // Init map
  React.useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const cfg = DataService.getConfigSync();
    const map = L.map(mapRef.current).setView([-32.98, -59.02], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // Plot markers
  const plotMarkers = async () => {
    const map = mapInstance.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    setGeocoding(true);
    setDone(0);
    const bounds = [];
    for (let i = 0; i < filtered.length; i++) {
      const c = filtered[i];
      if (!c.address) { setDone(i + 1); continue; }
      const coords = await GeoService.geocode(c.address).catch(() => null);
      setDone(i + 1);
      if (!coords || !mapInstance.current) continue;
      const color = zoneColor(c.zoneId);
      const zone  = zones.find(z => z.id === c.zoneId);
      const icon  = makeIcon(color, '👤', 30);
      const popup = `
        <div style="min-width:180px">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px">${c.name}</p>
          <p style="color:#64748b;font-size:12px;margin:0 0 2px">📍 ${c.address}${c.city ? `, ${c.city}` : ''}</p>
          ${c.phone ? `<p style="color:#64748b;font-size:12px;margin:0 0 2px">📞 ${c.phone}</p>` : ''}
          ${zone ? `<p style="font-size:12px;margin:0 0 2px"><span style="color:${color};font-weight:600">●</span> ${zone.name}</p>` : ''}
          <p style="font-size:12px;margin:4px 0 0;color:#2563eb;font-weight:600">${c.type || ''} · ${c.frequency || ''}</p>
          ${c.envasesP > 0 ? `<p style="font-size:12px;color:#d97706;margin:2px 0 0">🫙 ${c.envasesP} envases en calle</p>` : ''}
        </div>`;
      const marker = L.marker([coords.lat, coords.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(popup);
      markersRef.current.push(marker);
      bounds.push([coords.lat, coords.lng]);
    }
    if (bounds.length > 1 && mapInstance.current) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    }
    setGeocoding(false);
  };

  React.useEffect(() => {
    if (mapInstance.current) plotMarkers();
  }, [filtered.length, filterZone, filterType]);

  const types = [...new Set(clients.map(c => c.type).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <p className="text-xs text-slate-500 mb-1 font-medium">Zona</p>
            <select value={filterZone} onChange={e => setFilterZone(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-slate-700">
              <option value="">Todas las zonas</option>
              {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <p className="text-xs text-slate-500 mb-1 font-medium">Tipo</p>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-slate-700">
              <option value="">Todos los tipos</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Btn onClick={plotMarkers} variant="primary" size="sm" icon="search" disabled={geocoding}>
            {geocoding ? `Geocodificando ${done}/${filtered.length}...` : 'Mostrar en mapa'}
          </Btn>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ height: '450px' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Zone legend */}
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-3 px-1">
          {zones.map((z, i) => (
            <div key={z.id} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: z.color || MAP_ZONE_COLORS[i % MAP_ZONE_COLORS.length] }} />
              {z.name} ({clients.filter(c => c.zoneId === z.id).length})
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-slate-400 px-1">
        {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} · hacé clic en "Mostrar en mapa" para geocodificar
      </p>
    </div>
  );
}

// ── Dispensers map ───────────────────────────────────────────────────────────
function DispensersMap({ dispensers, clients }) {
  const [filterStatus, setFilterStatus] = React.useState('');
  const [geocoding, setGeocoding]       = React.useState(false);
  const [done, setDone]                 = React.useState(0);

  const mapRef      = React.useRef(null);
  const mapInstance = React.useRef(null);
  const markersRef  = React.useRef([]);

  const filtered = dispensers.filter(d => !filterStatus || d.status === filterStatus);

  React.useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current).setView([-32.98, -59.02], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  const plotMarkers = async () => {
    const map = mapInstance.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    setGeocoding(true);
    setDone(0);
    const bounds = [];

    for (let i = 0; i < filtered.length; i++) {
      const d = filtered[i];
      const client = clients.find(c => c.id === d.clientId);
      const addr = client?.address || d.location || '';
      if (!addr) { setDone(i + 1); continue; }
      const coords = await GeoService.geocode(addr).catch(() => null);
      setDone(i + 1);
      if (!coords || !mapInstance.current) continue;

      const cfg  = DISP_STATUS_MAP[d.status] || DISP_STATUS_MAP.deposito;
      const icon = makeIcon(cfg.color, '🫙', 30);
      const popup = `
        <div style="min-width:180px">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px">${d.serial || 'Sin serie'}</p>
          <p style="font-size:12px;margin:0 0 2px;color:#64748b">${d.model || ''} · ${d.type || ''}</p>
          <p style="font-size:12px;margin:0 0 4px">
            <span style="color:${cfg.color};font-weight:600">${cfg.icon} ${cfg.label}</span>
          </p>
          ${client ? `<p style="font-size:12px;color:#2563eb;font-weight:600;margin:0">👤 ${client.name}</p>` : ''}
          ${addr ? `<p style="font-size:12px;color:#64748b;margin:2px 0 0">📍 ${addr}</p>` : ''}
        </div>`;
      const marker = L.marker([coords.lat, coords.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(popup);
      markersRef.current.push(marker);
      bounds.push([coords.lat, coords.lng]);
    }
    if (bounds.length > 1 && mapInstance.current) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    }
    setGeocoding(false);
  };

  const counts = Object.fromEntries(
    Object.keys(DISP_STATUS_MAP).map(s => [s, dispensers.filter(d => d.status === s).length])
  );

  return (
    <div className="space-y-4">
      {/* Status counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(DISP_STATUS_MAP).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
            className={`rounded-2xl p-3 text-center border-2 transition-all
              ${filterStatus === key ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white shadow-sm'}`}>
            <p className="text-2xl font-bold" style={{ color: cfg.color }}>{counts[key] || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Plot button */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
        <p className="text-sm text-slate-600">
          {filtered.length} comodato{filtered.length !== 1 ? 's' : ''}
          {filterStatus ? ` · ${DISP_STATUS_MAP[filterStatus]?.label}` : ''}
        </p>
        <Btn onClick={plotMarkers} variant="primary" size="sm" icon="search" disabled={geocoding}>
          {geocoding ? `${done}/${filtered.length}...` : 'Mostrar en mapa'}
        </Btn>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ height: '420px' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {Object.entries(DISP_STATUS_MAP).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
            {cfg.label}
          </div>
        ))}
      </div>
    </div>
  );
}
