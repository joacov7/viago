// NATIVA - Delivery / Reparto module with driver mode

function Delivery({ onNavigate }) {
  const [date, setDate] = React.useState(DataService.today());
  const [orders, setOrders] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [zones, setZones] = React.useState([]);
  const [filterZone, setFilterZone] = React.useState('');
  const [driverMode, setDriverMode] = React.useState(false);
  const [showCobro, setShowCobro] = React.useState(null);

  const reload = async () => {
    const [allOrders, allClients, allZones] = await Promise.all([
      DataService.getOrdersByDate(date),
      DataService.getClients(true),
      DataService.getZones(),
    ]);
    const enriched = allOrders.map(o => {
      const client = allClients.find(c => c.id === o.clientId) || {};
      const zone = allZones.find(z => z.id === client.zoneId) || {};
      return { ...o, client, zone };
    }).sort((a, b) => {
      const za = a.zone.name || 'z';
      const zb = b.zone.name || 'z';
      if (za < zb) return -1; if (za > zb) return 1; return 0;
    });
    setOrders(enriched);
    setClients(allClients);
    setZones(allZones);
  };

  React.useEffect(() => { reload(); }, [date]);

  const filtered = orders.filter(o => !filterZone || o.zone.id == filterZone);
  const pending = filtered.filter(o => o.status === 'pendiente');
  const delivered = filtered.filter(o => o.status === 'entregado');
  const total = filtered.reduce((s, o) => s + o.total, 0);

  const handleStatus = async (id, status) => {
    await DataService.updateOrder(id, { status });
    reload();
  };

  const handleCobro = (order) => setShowCobro(order);

  const allAddresses = filtered.map(o => o.client.address).filter(Boolean);
  const allCities = filtered.filter(o => o.client.address).map(o => o.client.city || '');
  const mapUrl = WhatsAppService.openRoute(allAddresses, allCities);

  if (driverMode) {
    return (
      <>
        <DriverMode
          date={date}
          orders={filtered}
          onBack={() => setDriverMode(false)}
          onStatus={handleStatus}
          onCobro={handleCobro}
          pending={pending.length}
          delivered={delivered.length}
        />
        <CobroModal order={showCobro} onClose={() => { setShowCobro(null); reload(); }} />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reparto"
        subtitle={`${filtered.length} entregas · ${pending.length} pendientes`}
        action={
          <div className="flex gap-2">
            <Btn onClick={() => setDriverMode(true)} variant="success" icon="truck">Modo repartidor</Btn>
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size={16} className="text-slate-400 flex-shrink-0" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls('w-44')} />
        </div>
        <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className={inputCls('sm:w-44')}>
          <option value="">Todas las zonas</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        {allAddresses.length > 0 && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer">
            <Btn variant="secondary" icon="navigation">Abrir ruta en Maps</Btn>
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total pedidos', value: filtered.length, color: 'text-slate-900', bg: 'bg-gray-50' },
          { label: 'Pendientes', value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Entregados', value: delivered.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total a cobrar', value: DataService.formatCurrency(pending.reduce((s,o)=>s+o.total,0)), color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Print/export row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Lista de entregas — {DataService.formatDate(date)}</h3>
        <Btn onClick={() => PDFService.printDailySummary(date, filtered, DataService.getInvoices(), clients, zones)} variant="ghost" size="sm" icon="printer">Imprimir resumen</Btn>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="truck" title="Sin entregas para este día" description="No hay pedidos programados para la fecha seleccionada" action={<Btn onClick={() => onNavigate('orders', { openNew: true })} icon="plus" variant="primary">Crear pedido</Btn>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <DeliveryRow key={order.id} order={order} onStatus={handleStatus} onCobro={handleCobro} />
          ))}
        </div>
      )}

      <CobroModal order={showCobro} onClose={() => { setShowCobro(null); reload(); }} />
    </div>
  );
}

function DeliveryRow({ order, onStatus, onCobro }) {
  const [expanded, setExpanded] = React.useState(false);
  const borderColor = { pendiente: '#F59E0B', entregado: '#10B981', cancelado: '#EF4444' };
  const invoice = DataService.getInvoices().find(i => i.orderId === order.id);
  const paid = invoice && invoice.paymentStatus === 'pagado';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: borderColor[order.status] || '#CBD5E1' }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {order.zone?.name && <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: order.zone.color || '#6B7280' }}>{order.zone.name}</span>}
              <StatusBadge status={order.status} />
              {paid && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Cobrado</span>}
            </div>
            <p className="font-semibold text-slate-900">{order.client?.name || `#${order.clientId}`}</p>
            {order.client?.address && (
              <a href={WhatsAppService.openMaps(order.client.address, order.client.city)} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5">
                <Icon name="mapPin" size={11} />{order.client.address}{order.client.city ? `, ${order.client.city}` : ''}
              </a>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-slate-900">{DataService.formatCurrency(order.total)}</p>
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5 ml-auto mt-1">
              {expanded ? <><Icon name="chevUp" size={12}/>Menos</> : <><Icon name="chevDown" size={12}/>Más</>}
            </button>
          </div>
        </div>

        {/* Items preview */}
        <p className="text-xs text-slate-500 mt-2 truncate">{(order.items || []).map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {order.client?.phone && (
            <>
              <a href={`tel:${order.client.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-600 text-xs font-medium">
                <Icon name="phone" size={13} />Llamar
              </a>
              <a href={WhatsAppService.deliveryNotice(order.client, order)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium">
                <Icon name="messageCircle" size={13} />WA
              </a>
            </>
          )}
          <div className="ml-auto flex gap-1.5">
            {order.status === 'pendiente' && (
              <>
                <button onClick={() => onStatus(order.id, 'entregado')} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
                  <Icon name="checkCircle" size={13} />Entregado
                </button>
                <button onClick={() => onStatus(order.id, 'cancelado')} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium rounded-lg">
                  No entregado
                </button>
              </>
            )}
            {order.status === 'entregado' && !paid && (
              <button onClick={() => onCobro(order)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg">
                <Icon name="wallet" size={13} />Registrar cobro
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 bg-gray-50">
          <div className="divide-y divide-gray-100">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{item.quantity}x {item.productName}</span>
                <span className="font-semibold text-slate-900">{DataService.formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          {order.notes && <p className="text-xs text-slate-500 mt-2">Nota: {order.notes}</p>}
        </div>
      )}
    </div>
  );
}

function DriverMode({ date, orders, onBack, onStatus, onCobro, pending, delivered }) {
  const [current, setCurrent] = React.useState(null);
  const [gpsPos, setGpsPos] = React.useState(null);
  const [gpsStatus, setGpsStatus] = React.useState('requesting');
  const [distances, setDistances] = React.useState({});
  const watchRef = React.useRef(null);
  const geocodedRef = React.useRef(false);

  React.useEffect(() => {
    watchRef.current = GeoService.watchPosition(
      (pos) => {
        setGpsStatus('active');
        setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
      },
      () => setGpsStatus('error')
    );
    return () => GeoService.clearWatch(watchRef.current);
  }, []);

  // Geocode addresses once when GPS first becomes available
  React.useEffect(() => {
    if (!gpsPos || geocodedRef.current) return;
    geocodedRef.current = true;
    const pending = orders.filter(o => o.status === 'pendiente' && o.client?.address);
    (async () => {
      for (const order of pending) {
        const coords = await GeoService.geocode(order.client.address);
        if (coords) {
          const d = GeoService.distance(gpsPos.lat, gpsPos.lng, coords.lat, coords.lng);
          setDistances(prev => ({ ...prev, [order.id]: d }));
        }
        await new Promise(r => setTimeout(r, 1100)); // Nominatim rate limit: 1 req/s
      }
    })();
  }, [gpsPos]);

  // Update distances from cached coords on every position update
  React.useEffect(() => {
    if (!gpsPos) return;
    const cache = GeoService._getCache();
    orders.forEach(order => {
      if (!order.client?.address) return;
      const coords = cache[order.client.address];
      if (coords) {
        const d = GeoService.distance(gpsPos.lat, gpsPos.lng, coords.lat, coords.lng);
        setDistances(prev => ({ ...prev, [order.id]: d }));
      }
    });
  }, [gpsPos]);

  const pendingOrders = orders
    .filter(o => o.status === 'pendiente')
    .sort((a, b) => (distances[a.id] ?? Infinity) - (distances[b.id] ?? Infinity));
  const deliveredOrders = orders.filter(o => o.status === 'entregado');

  if (current) {
    return (
      <DriverOrderDetail
        order={current}
        distance={distances[current.id]}
        onBack={() => setCurrent(null)}
        onStatus={(id, status) => { onStatus(id, status); setCurrent(null); }}
        onCobro={onCobro}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f2142' }}>
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-2 text-blue-300 hover:text-white">
            <Icon name="arrowLeft" size={20} className="text-blue-300" />
            <span className="text-sm font-medium">Salir</span>
          </button>
          <div className="text-right">
            <p className="text-white font-bold text-sm">MODO REPARTIDOR</p>
            <p className="text-blue-300 text-xs">{DataService.formatDate(date)}</p>
          </div>
        </div>

        {/* GPS status bar */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs font-medium ${
          gpsStatus === 'active' ? 'bg-emerald-500 bg-opacity-20 text-emerald-300' :
          gpsStatus === 'error'  ? 'bg-red-500 bg-opacity-20 text-red-300' :
                                   'bg-white bg-opacity-10 text-blue-300'
        }`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            gpsStatus === 'active' ? 'bg-emerald-400 animate-pulse' :
            gpsStatus === 'error'  ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
          }`} />
          <span>{
            gpsStatus === 'active' ? `GPS activo · ±${gpsPos?.accuracy} m` :
            gpsStatus === 'error'  ? 'GPS no disponible — activá la ubicación' :
                                     'Buscando señal GPS...'
          }</span>
        </div>

        {/* Progress */}
        <div className="bg-white bg-opacity-10 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold">{delivered} de {orders.length} entregados</span>
            <span className="text-blue-300 text-sm">{orders.length > 0 ? Math.round((delivered/orders.length)*100) : 0}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5">
            <div className="h-2.5 rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${orders.length > 0 ? (delivered/orders.length)*100 : 0}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pendientes', val: pending, color: 'text-amber-400' },
            { label: 'Entregados', val: delivered, color: 'text-emerald-400' },
            { label: 'A cobrar', val: DataService.formatCurrency(pendingOrders.reduce((s,o)=>s+o.total,0)), color: 'text-blue-300' },
          ].map((s, i) => (
            <div key={i} className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-gray-50 rounded-t-3xl min-h-screen px-4 pt-6">
        {pendingOrders.length > 0 && (
          <>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              Pendientes ({pendingOrders.length})
              {gpsStatus === 'active' && <span className="ml-2 text-xs text-blue-500 font-normal normal-case">· ordenados por distancia</span>}
            </h3>
            <div className="space-y-3 mb-6">
              {pendingOrders.map(o => <DriverCard key={o.id} order={o} distance={distances[o.id]} onTap={() => setCurrent(o)} />)}
            </div>
          </>
        )}
        {deliveredOrders.length > 0 && (
          <>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Entregados ({deliveredOrders.length})
            </h3>
            <div className="space-y-2 pb-8">
              {deliveredOrders.map(o => <DriverCard key={o.id} order={o} onTap={() => setCurrent(o)} dim />)}
            </div>
          </>
        )}
        {orders.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400">No hay entregas para hoy</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DriverCard({ order, onTap, dim = false, distance }) {
  const nearby = GeoService.isNearby(distance);
  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-opacity ${dim ? 'opacity-50' : ''} ${nearby ? 'border-2 border-emerald-400' : 'border border-gray-100'}`}>
      <button onClick={onTap} className="w-full text-left p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {order.zone?.name && <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: order.zone.color || '#6B7280' }}>{order.zone.name}</span>}
              {dim && <span className="text-xs text-emerald-600 font-medium">✓ Entregado</span>}
              {nearby && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">📍 ¡Estás cerca!</span>}
            </div>
            <p className="font-semibold text-slate-900 text-base">{order.client?.name || `#${order.clientId}`}</p>
            <p className="text-sm text-slate-500 truncate">{order.client?.address || '—'}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">{(order.items||[]).map(i=>`${i.quantity}x ${i.productName}`).join(', ')}</p>
            {distance !== undefined && (
              <p className={`text-xs font-semibold mt-1 ${nearby ? 'text-emerald-600' : 'text-blue-500'}`}>
                📍 {GeoService.formatDistance(distance)}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-slate-900">{DataService.formatCurrency(order.total)}</p>
            <Icon name="chevRight" size={18} className="text-slate-400 ml-auto mt-1" />
          </div>
        </div>
      </button>
      {nearby && order.client?.phone && (
        <div className="px-4 pb-4">
          <a href={WhatsAppService.comingSoon(order.client)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold">
            <Icon name="messageCircle" size={16} />Avisar que llego
          </a>
        </div>
      )}
    </div>
  );
}

function DriverOrderDetail({ order, distance, onBack, onStatus, onCobro }) {
  const invoice = DataService.getInvoices().find(i => i.orderId === order.id);
  const paid = invoice && invoice.paymentStatus === 'pagado';
  const nearby = GeoService.isNearby(distance);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100">
          <Icon name="arrowLeft" size={20} className="text-slate-700" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-slate-900">{order.client?.name}</p>
          <p className="text-xs text-slate-500">
            {order.zone?.name || '—'}
            {distance !== undefined && <span className={`ml-2 font-semibold ${nearby ? 'text-emerald-600' : 'text-blue-500'}`}>· 📍 {GeoService.formatDistance(distance)}</span>}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="p-4 space-y-4">
        {/* Address + map */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Dirección</p>
          <p className="text-base font-medium text-slate-900">{order.client?.address || 'Sin dirección'}</p>
          {order.client?.address && (
            <a href={WhatsAppService.openMaps(order.client.address, order.client.city)} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-blue-600 text-sm font-medium">
              <Icon name="navigation" size={16} />Abrir en Maps
            </a>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Productos</p>
          {(order.items||[]).map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                <p className="text-xs text-slate-400">Cant: {item.quantity} × {DataService.formatCurrency(item.price)}</p>
              </div>
              <p className="font-bold text-slate-900">{DataService.formatCurrency(item.subtotal)}</p>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-gray-200">
            <p className="font-bold text-slate-900">TOTAL</p>
            <p className="text-xl font-bold text-slate-900">{DataService.formatCurrency(order.total)}</p>
          </div>
        </div>

        {/* Proximity alert */}
        {nearby && order.client?.phone && (
          <a href={WhatsAppService.comingSoon(order.client)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-sm">
            <Icon name="messageCircle" size={24} />Avisar que llego · {GeoService.formatDistance(distance)}
          </a>
        )}

        {/* Contact */}
        {order.client?.phone && (
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${order.client.phone}`} className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl py-4 text-slate-700 font-semibold shadow-sm hover:bg-gray-50">
              <Icon name="phone" size={22} />Llamar
            </a>
            <a href={WhatsAppService.deliveryNotice(order.client, order)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 rounded-2xl py-4 text-white font-semibold shadow-sm hover:bg-green-600">
              <Icon name="messageCircle" size={22} />WhatsApp
            </a>
          </div>
        )}

        {/* Action buttons */}
        {order.status === 'pendiente' && (
          <div className="space-y-3">
            <button onClick={() => onStatus(order.id, 'entregado')}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-sm flex items-center justify-center gap-3">
              <Icon name="checkCircle" size={24} />Marcar como entregado
            </button>
            <button onClick={() => onStatus(order.id, 'cancelado')}
              className="w-full py-3 bg-white border border-red-200 text-red-500 font-semibold rounded-2xl hover:bg-red-50">
              No entregado
            </button>
          </div>
        )}

        {order.status === 'entregado' && !paid && (
          <button onClick={() => { onCobro(order); onBack(); }}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-sm flex items-center justify-center gap-3">
            <Icon name="wallet" size={24} />Registrar cobro
          </button>
        )}

        {paid && (
          <div className="w-full py-4 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-2xl flex items-center justify-center gap-2">
            <Icon name="checkCircle" size={20} />Pago registrado
          </div>
        )}
      </div>
    </div>
  );
}

function CobroModal({ order, onClose }) {
  const [method, setMethod] = React.useState('efectivo');
  const [notes, setNotes] = React.useState('');
  const config = DataService.getConfig();

  if (!order) return null;

  const submit = (e) => {
    e.preventDefault();
    const existing = DataService.getInvoices().find(i => i.orderId === order.id);
    if (existing) {
      DataService.updateInvoice(existing.id, { paymentStatus: 'pagado', paymentMethod: method, notes });
    } else {
      const inv = DataService.createInvoice({ orderId: order.id, clientId: order.clientId, total: order.total, paymentMethod: method, notes, items: order.items });
      DataService.updateInvoice(inv.id, { paymentStatus: 'pagado' });
    }
    onClose();
  };

  const mpLink = method === 'mercadopago' ? `https://www.mercadopago.com.ar/tools/create` : null;

  return (
    <Modal isOpen={!!order} onClose={onClose} title="Registrar cobro" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-sm text-slate-600">{order.client?.name || `#${order.clientId}`}</p>
          <p className="text-xl font-bold text-slate-900">{DataService.formatCurrency(order.total)}</p>
        </div>
        <FormField label="Forma de pago">
          <div className="grid grid-cols-3 gap-2">
            {['efectivo', 'transferencia', 'mercadopago'].map(m => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-colors ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-600 hover:border-gray-300'}`}>
                {m === 'efectivo' ? '💵 Efectivo' : m === 'transferencia' ? '🏦 Transfer.' : '💳 MP'}
              </button>
            ))}
          </div>
        </FormField>
        {method === 'mercadopago' && config.mpPublicKey && (
          <a href={`https://link.mercadopago.com.ar/${config.mpPublicKey}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Icon name="share2" size={14} />Generar link de pago MP
          </a>
        )}
        <FormField label="Notas (opcional)">
          <input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls()} placeholder="Ej: pagó con $2000, vuelto $500" />
        </FormField>
        <div className="flex gap-3 pt-2">
          <Btn type="button" onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancelar</Btn>
          <Btn type="submit" variant="success" className="flex-1 justify-center" icon="check">Confirmar cobro</Btn>
        </div>
      </form>
    </Modal>
  );
}
