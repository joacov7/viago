// NATIVA — Seguimiento en tiempo real del repartidor

function LiveTracking() {
  const [driverPos, setDriverPos]   = React.useState(null);
  const [lastUpdate, setLastUpdate] = React.useState(null);
  const [orders, setOrders]         = React.useState([]);
  const [clients, setClients]       = React.useState([]);
  const [loading, setLoading]       = React.useState(true);

  const mapRef          = React.useRef(null);
  const mapInstance     = React.useRef(null);
  const driverMarker    = React.useRef(null);
  const deliveryMarkers = React.useRef([]);
  const channelRef      = React.useRef(null);

  // Load today's orders + clients
  React.useEffect(() => {
    Promise.all([
      DataService.getTodayOrders(),
      DataService.getClients(true),
      DataService.getDriverLocation(),
    ]).then(([os, cs, pos]) => {
      const enriched = os.map(o => ({ ...o, client: cs.find(c => c.id === o.clientId) || {} }));
      setOrders(enriched);
      setClients(cs);
      if (pos && pos.lat) {
        setDriverPos(pos);
        setLastUpdate(new Date(pos.updatedAt));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Init map
  React.useEffect(() => {
    if (loading || !mapRef.current || mapInstance.current) return;
    const cfg = DataService.getConfigSync();
    const map = L.map(mapRef.current, { zoomControl: true }).setView([-32.98, -59.02], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;

    // Geocode and plot delivery stops
    orders.forEach(async (o) => {
      const addr = o.client?.address;
      if (!addr) return;
      const coords = await GeoService.geocode(addr).catch(() => null);
      if (!coords || !mapInstance.current) return;
      const done = o.status === 'entregado';
      const icon = L.divIcon({
        html: `<div style="
          background:${done ? '#16a34a' : '#2563eb'};color:white;
          border-radius:50%;width:30px;height:30px;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3)">
          ${done ? '✓' : '💧'}
        </div>`,
        iconSize: [30, 30], iconAnchor: [15, 15], className: '',
      });
      const marker = L.marker([coords.lat, coords.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`<b>${o.client?.name || 'Cliente'}</b><br>${addr}<br>
          <span style="color:${done ? '#16a34a' : '#2563eb'};font-weight:600">
            ${done ? '✓ Entregado' : '⏳ Pendiente'}
          </span>`);
      deliveryMarkers.current.push(marker);
    });

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [loading, orders]);

  // Driver marker
  React.useEffect(() => {
    const map = mapInstance.current;
    if (!map || !driverPos?.lat) return;
    const { lat, lng } = driverPos;
    if (driverMarker.current) {
      driverMarker.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        html: `<div style="
          background:#dc2626;color:white;border-radius:50%;
          width:40px;height:40px;display:flex;align-items:center;
          justify-content:center;font-size:20px;
          border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4)">
          🚚
        </div>`,
        iconSize: [40, 40], iconAnchor: [20, 20], className: '',
      });
      driverMarker.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>${driverPos.driverName || 'Repartidor'}</b><br>En línea`);
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 14));
  }, [driverPos]);

  // Supabase Realtime + polling fallback
  React.useEffect(() => {
    const refresh = () =>
      DataService.getDriverLocation().then(pos => {
        if (pos?.lat) {
          setDriverPos({ lat: pos.lat, lng: pos.lng, driverName: pos.driverName });
          setLastUpdate(new Date(pos.updatedAt));
        }
      }).catch(() => {});

    channelRef.current = SupabaseDB
      .channel('driver-live')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'driver_locations',
      }, payload => {
        const row = payload.new;
        if (row?.lat) {
          setDriverPos({ lat: row.lat, lng: row.lng, driverName: row.driver_name });
          setLastUpdate(new Date(row.updated_at));
        }
      })
      .subscribe();

    // Poll every 15s as fallback when Realtime isn't available
    const poll = setInterval(refresh, 15000);
    return () => {
      clearInterval(poll);
      if (channelRef.current) SupabaseDB.removeChannel(channelRef.current);
    };
  }, []);

  const minutesAgo = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 60000) : null;
  const isOnline   = minutesAgo !== null && minutesAgo < 5;

  const pending   = orders.filter(o => o.status === 'pendiente');
  const delivered = orders.filter(o => o.status === 'entregado');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Seguimiento en tiempo real"
        subtitle={`${delivered.length} entregados · ${pending.length} pendientes hoy`}
      />

      {/* Status bar */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-5 border
        ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`w-3 h-3 rounded-full flex-shrink-0
          ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isOnline ? 'text-emerald-700' : 'text-gray-500'}`}>
            {isOnline ? `${driverPos?.driverName || 'Repartidor'} — En línea` : 'Sin señal del repartidor'}
          </p>
          {lastUpdate && (
            <p className="text-xs text-slate-400 mt-0.5">
              Última ubicación: {minutesAgo === 0 ? 'Ahora mismo' : `hace ${minutesAgo} min`}
              {' · '}{lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {!isOnline && !lastUpdate && (
          <p className="text-xs text-slate-400">El repartidor debe activar el GPS en su app</p>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-5"
        style={{ height: '420px' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 mb-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-xs">🚚</span>
          Repartidor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">💧</span>
          Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">✓</span>
          Entregado
        </span>
      </div>

      {/* Delivery list */}
      {orders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-slate-700">Pedidos de hoy</p>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.map(o => {
              const done = o.status === 'entregado';
              return (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {done ? '✓' : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{o.client?.name || 'Cliente'}</p>
                    <p className="text-xs text-slate-400 truncate">{o.client?.address || 'Sin dirección'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${done ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {done ? 'Entregado' : 'Pendiente'}
                    </p>
                    <p className="text-xs text-slate-400">{DataService.formatCurrency(o.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <EmptyState icon="truck" title="Sin pedidos hoy" description="No hay pedidos programados para hoy" />
      )}
    </div>
  );
}
