// NATIVA - Repartidor PWA app

const PIN_KEY = 'nativa_driver_pin_ok';
const PIN_DATE_KEY = 'nativa_driver_pin_date';

function DriverApp() {
  const [pinOk, setPinOk] = React.useState(false);
  const [config, setConfig] = React.useState(null);

  React.useEffect(() => {
    DataService.getConfig().then(cfg => {
      setConfig(cfg);
      const today = new Date().toISOString().slice(0, 10);
      if (sessionStorage.getItem(PIN_KEY) === 'true' && sessionStorage.getItem(PIN_DATE_KEY) === today) {
        setPinOk(true);
      }
    }).catch(() => setConfig({}));
  }, []);

  const handlePinOk = () => {
    const today = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem(PIN_KEY, 'true');
    sessionStorage.setItem(PIN_DATE_KEY, today);
    setPinOk(true);
  };

  if (!config) return <Splash />;
  if (!pinOk) return <PinScreen config={config} onSuccess={handlePinOk} />;
  return <DeliveryApp config={config} />;
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#1e3a8a'}}>
      <div className="text-center text-white">
        <div className="text-6xl mb-4">💧</div>
        <p className="text-xl font-bold">NATIVA</p>
        <p className="text-blue-300 text-sm mt-1">Cargando...</p>
      </div>
    </div>
  );
}

function PinScreen({ config, onSuccess }) {
  const [pin, setPin] = React.useState('');
  const [shake, setShake] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      const stored = String(config.driverPin || '0000');
      if (next === stored) {
        onSuccess();
      } else {
        setTimeout(() => { setPin(''); setError(true); setShake(false); }, 500);
        setShake(true);
      }
    }
  };

  const handleDel = () => { setPin(p => p.slice(0, -1)); setError(false); };

  const digits = [1,2,3,4,5,6,7,8,9,'',0,'⌫'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{background:'#0f172a'}}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{background:'#2563eb'}}>
        <span className="text-4xl">💧</span>
      </div>
      <h1 className="text-white text-2xl font-bold mb-1">{config.companyName || 'NATIVA'}</h1>
      <p className="text-slate-400 text-sm mb-10">Ingresá tu PIN de acceso</p>

      <div className={`flex gap-5 mb-4 transition-all ${shake ? 'translate-x-2' : ''}`}>
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-5 h-5 rounded-full transition-all duration-200 ${
            pin.length > i ? (error ? 'bg-red-500' : 'bg-blue-500') : 'bg-slate-700'
          }`} />
        ))}
      </div>
      {error && <p className="text-red-400 text-sm mb-4">PIN incorrecto, intentá de nuevo</p>}
      {!error && <div className="h-6 mb-4" />}

      <div className="grid grid-cols-3 gap-4 w-72">
        {digits.map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handleDel() : d !== '' ? handleDigit(String(d)) : null}
            disabled={d === ''}
            className={`py-5 rounded-2xl text-xl font-bold transition-all active:scale-90 ${
              d === '' ? 'invisible' :
              d === '⌫' ? 'text-slate-300' :
              'text-white'
            }`}
            style={{ background: d === '' ? 'transparent' : d === '⌫' ? '#334155' : '#1e293b' }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function DeliveryApp({ config }) {
  const [deliveries, setDeliveries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState(null);
  const [showSummary, setShowSummary] = React.useState(false);
  const [online, setOnline] = React.useState(navigator.onLine);
  const [routeOrder, setRouteOrder] = React.useState(null);
  const [optimizing, setOptimizing] = React.useState(false);
  const [optimizeMsg, setOptimizeMsg] = React.useState('');
  const [sharing, setSharing] = React.useState(false);
  const [lastReceipt, setLastReceipt] = React.useState(null);
  const watchIdRef = React.useRef(null);

  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const startSharing = () => {
    if (!navigator.geolocation) { alert('GPS no disponible en este dispositivo.'); return; }
    setSharing(true);
    const send = pos => {
      DataService.upsertDriverLocation(
        pos.coords.latitude, pos.coords.longitude, config.companyName || 'Repartidor'
      ).catch(() => {});
    };
    watchIdRef.current = navigator.geolocation.watchPosition(send, () => {}, {
      enableHighAccuracy: true, maximumAge: 15000, timeout: 15000,
    });
  };

  const stopSharing = () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setSharing(false);
  };

  React.useEffect(() => () => stopSharing(), []);

  const load = async () => {
    setLoading(true);
    try {
      const [orders, clients, zones] = await Promise.all([
        DataService.getTodayOrders(),
        DataService.getClients(true),
        DataService.getZones(),
      ]);
      const enriched = orders.map(o => ({
        ...o,
        client: clients.find(c => c.id === o.clientId) || {},
        zone: zones.find(z => z.id === (clients.find(c => c.id === o.clientId) || {}).zoneId) || {},
      }));
      setDeliveries(enriched);
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('nativa_driver_cache', JSON.stringify(enriched));
      localStorage.setItem('nativa_driver_cache_date', today);
    } catch {
      const today = new Date().toISOString().slice(0, 10);
      const cached = localStorage.getItem('nativa_driver_cache');
      const cacheDate = localStorage.getItem('nativa_driver_cache_date');
      if (cached && cacheDate === today) setDeliveries(JSON.parse(cached));
    }
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const optimizeRoute = async () => {
    setOptimizing(true);
    setOptimizeMsg('Obteniendo tu ubicación...');
    try {
      // Get driver GPS position
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const startLat = pos.coords.latitude;
      const startLng = pos.coords.longitude;

      const pending = deliveries.filter(d => d.status === 'pendiente');
      setOptimizeMsg(`Geocodificando ${pending.length} direcciones...`);

      // Geocode all pending delivery addresses
      const coordsMap = {};
      for (let i = 0; i < pending.length; i++) {
        const o = pending[i];
        const addr = o.client?.address;
        if (!addr) continue;
        setOptimizeMsg(`Geocodificando ${i + 1}/${pending.length}...`);
        const coords = await GeoService.geocode(addr);
        if (coords) coordsMap[o.id] = coords;
      }

      setOptimizeMsg('Calculando ruta óptima...');
      const sorted = GeoService.zoneAwareSort(startLat, startLng, pending, coordsMap);
      const ids = sorted.map(o => o.id);
      setRouteOrder(ids);

      const geocoded = Object.keys(coordsMap).length;
      setOptimizeMsg(`Ruta optimizada por zonas: ${geocoded}/${pending.length} paradas con GPS`);
      setTimeout(() => setOptimizeMsg(''), 3000);
    } catch (e) {
      setOptimizeMsg('');
      if (e.code === 1) alert('Permití el acceso a la ubicación para optimizar la ruta.');
      else alert('No se pudo optimizar la ruta: ' + e.message);
    }
    setOptimizing(false);
  };

  const handleDeliver = async (order, method, amount, deliveredItems, envasesRecuperados = 0, envasesEntregados = 0) => {
    const finalItems = deliveredItems || order.items || [];
    const finalTotal = parseFloat(amount) || order.total;
    await DataService.updateOrder(order.id, {
      status: 'entregado', items: finalItems, total: finalTotal,
      envasesEntregados, envasesRecuperados,
    });
    await DataService.createInvoice({
      clientId: order.clientId,
      orderId: order.id,
      items: finalItems,
      total: finalTotal,
      paymentMethod: method,
      paymentStatus: 'pagado',
    });
    if (envasesEntregados > 0 || envasesRecuperados > 0) {
      await DataService.updateClientEnvases(order.clientId, envasesEntregados, envasesRecuperados).catch(() => {});
    }
    setDeliveries(ds => ds.map(d => d.id === order.id ? { ...d, status: 'entregado' } : d));
    if (order.client?.phone) {
      setLastReceipt({ client: order.client, items: finalItems, total: finalTotal, date: DataService.today() });
    }
    // Advance to next pending in route
    if (routeOrder) {
      const remaining = routeOrder.filter(id => id !== order.id);
      const nextId = remaining[0];
      const nextOrder = deliveries.find(d => d.id === nextId);
      setActive(nextOrder || null);
    } else {
      setActive(null);
    }
  };

  const allDeliveries = deliveries;
  const pending = allDeliveries.filter(d => d.status === 'pendiente');
  const delivered = allDeliveries.filter(d => d.status === 'entregado');
  const totalCollected = delivered.reduce((s, d) => s + (d.total || 0), 0);

  // Sort pending by route order if optimized
  const pendingSorted = routeOrder
    ? [...pending].sort((a, b) => {
        const ai = routeOrder.indexOf(a.id);
        const bi = routeOrder.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    : pending;

  if (loading) return <Splash />;
  if (showSummary) return <DaySummary deliveries={allDeliveries} config={config} onClose={() => setShowSummary(false)} />;
  if (active) return (
    <DeliveryDetail
      order={active}
      config={config}
      onBack={() => setActive(null)}
      onDeliver={handleDeliver}
    />
  );

  const dateStr = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#0f172a'}}>
      {/* Header */}
      <div className="safe-top px-5 pb-5" style={{background:'#2563eb'}}>
        {!online && (
          <div className="bg-amber-500 text-white text-xs text-center py-1.5 rounded-xl mb-3 font-semibold">
            Sin conexión — datos del caché
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm capitalize">{dateStr}</p>
            <h1 className="text-white text-2xl font-bold">Mis entregas</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={sharing ? stopSharing : startSharing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{background: sharing ? '#dc2626' : 'rgba(255,255,255,0.2)', color: 'white'}}>
              <span className={`w-2 h-2 rounded-full ${sharing ? 'bg-white animate-pulse' : 'bg-white opacity-50'}`} />
              {sharing ? 'GPS ON' : 'GPS'}
            </button>
            <button onClick={() => setShowSummary(true)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
              style={{background:'rgba(255,255,255,0.2)'}}>
              📊
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Pendientes', value: pending.length },
            { label: 'Entregados', value: delivered.length },
            { label: 'Cobrado', value: DataService.formatCurrency(totalCollected), small: true },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{background:'rgba(255,255,255,0.15)'}}>
              <p className={`font-bold text-white ${s.small ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
              <p className="text-blue-200 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Route optimize button */}
        {pending.length > 1 && (
          <button
            onClick={optimizeRoute}
            disabled={optimizing}
            className="w-full rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            style={{background: routeOrder ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.2)', color: 'white', border: routeOrder ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.3)'}}>
            {optimizing ? (
              <>
                <span className="animate-spin">⟳</span>
                {optimizeMsg || 'Optimizando...'}
              </>
            ) : routeOrder ? (
              <><span>✓</span> Ruta optimizada — toca para recalcular</>
            ) : (
              <><span>🗺️</span> Optimizar ruta</>
            )}
          </button>
        )}
        {optimizeMsg && !optimizing && (
          <p className="text-center text-xs mt-2" style={{color:'rgba(255,255,255,0.7)'}}>{optimizeMsg}</p>
        )}
      </div>

      {/* WA receipt banner */}
      {lastReceipt && (
        <div className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-3" style={{background:'#14532d', border:'1px solid #166534'}}>
          <span className="text-2xl">✅</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{lastReceipt.client.name}</p>
            <p className="text-xs" style={{color:'#86efac'}}>{DataService.formatCurrency(lastReceipt.total)} cobrado</p>
          </div>
          <a href={`https://wa.me/${(lastReceipt.client.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(PDFService.textReceipt({items:lastReceipt.items,total:lastReceipt.total,deliveryDate:lastReceipt.date}, lastReceipt.client, config))}`}
            target="_blank" rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0"
            style={{background:'#16a34a'}}>
            💬 Comprobante
          </a>
          <button onClick={() => setLastReceipt(null)} className="text-xl" style={{color:'#4ade80'}}>×</button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 safe-bottom">
        {allDeliveries.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-white font-semibold text-lg">Sin entregas para hoy</p>
            <p className="text-slate-500 text-sm mt-1">El dueño aún no cargó pedidos</p>
          </div>
        )}

        {pendingSorted.length > 0 && (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pendientes</p>
              {routeOrder && <p className="text-xs font-semibold" style={{color:'#34d399'}}>Por zonas ✓</p>}
            </div>
            {(() => {
              const items = [];
              let lastZone = null;
              pendingSorted.forEach((o, idx) => {
                const zName = o.zone?.name || null;
                if (routeOrder && zName && zName !== lastZone) {
                  items.push(
                    <div key={`z-${zName}`} className="flex items-center gap-2 px-1 pt-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: o.zone?.color || '#6b7280'}} />
                      <p className="text-xs font-bold uppercase tracking-widest" style={{color: o.zone?.color || '#94a3b8'}}>{zName}</p>
                      <div className="flex-1 h-px" style={{background: o.zone?.color ? o.zone.color + '40' : '#334155'}} />
                    </div>
                  );
                  lastZone = zName;
                }
                items.push(
                  <DeliveryCard key={o.id} order={o} stopNumber={routeOrder ? idx + 1 : null} onTap={() => setActive(o)} />
                );
              });
              return items;
            })()}
          </>
        )}

        {delivered.length > 0 && (
          <>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 pt-3">Entregados</p>
            {delivered.map(o => (
              <DeliveryCard key={o.id} order={o} stopNumber={null} onTap={() => setActive(o)} />
            ))}
          </>
        )}

        {pending.length === 0 && delivered.length > 0 && (
          <div className="text-center py-8">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-white font-bold text-lg">¡Listo! Todas entregadas</p>
            <button onClick={() => setShowSummary(true)}
              className="mt-5 px-8 py-3 rounded-2xl text-white font-semibold text-sm"
              style={{background:'#2563eb'}}>
              Ver resumen del día
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryCard({ order, onTap, stopNumber }) {
  const done = order.status === 'entregado';
  return (
    <button onClick={onTap} className="w-full text-left rounded-2xl p-4 active:scale-98 transition-all"
      style={{background:'#1e293b', border: done ? '1px solid #334155' : '1px solid #3b82f6', opacity: done ? 0.6 : 1}}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{background: done ? '#064e3b' : '#1e3a8a'}}>
          {done ? <span className="text-2xl">✅</span> : stopNumber ? (
            <span className="text-white font-bold text-lg">{stopNumber}</span>
          ) : <span className="text-2xl">📦</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="font-bold text-white truncate">{order.client?.name || `Cliente #${order.clientId}`}</p>
            {order.zone?.name && (
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium flex-shrink-0"
                style={{background: order.zone.color || '#475569'}}>
                {order.zone.name}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm truncate">{order.client?.address || 'Sin dirección'}</p>
          {(order.items || []).length > 0 && (
            <p className="text-slate-600 text-xs mt-1 truncate">
              {order.items.map(i => `${i.quantity}× ${i.productName}`).join(' · ')}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="font-bold text-white">{DataService.formatCurrency(order.total)}</p>
          <p className="text-slate-600 text-lg mt-1">›</p>
        </div>
      </div>
    </button>
  );
}

function DeliveryDetail({ order, config, onBack, onDeliver }) {
  const [showPay, setShowPay] = React.useState(false);
  const done = order.status === 'entregado';
  const city = (config.city || '').trim();
  const addr = order.client?.address || '';
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(city ? `${addr}, ${city}` : addr)}`;
  const waAviso = order.client?.phone
    ? `https://wa.me/${(order.client.phone).replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${(order.client.name||'').split(' ')[0]}! Ya voy para tu domicilio con tu pedido de agua 💧`)}`
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#0f172a'}}>
      {/* Header */}
      <div className="safe-top px-4 pb-4 flex items-center gap-3" style={{background:'#1e293b'}}>
        <button onClick={onBack} className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl text-white"
          style={{background:'#334155'}}>
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">{order.client?.name}</p>
          <p className="text-slate-400 text-xs">{order.client?.code}</p>
        </div>
        {done && (
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:'#064e3b', color:'#34d399'}}>
            Entregado
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Address card */}
        <div className="rounded-2xl p-4" style={{background:'#1e293b'}}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Dirección</p>
          <p className="text-white font-semibold text-base">{addr || 'Sin dirección registrada'}</p>
          {order.client?.city && <p className="text-slate-400 text-sm mt-0.5">{order.client.city}</p>}
          {order.client?.phone && (
            <p className="text-slate-400 text-sm mt-2">📞 {order.client.phone}</p>
          )}
        </div>

        {/* Navigate */}
        {addr && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 rounded-2xl py-4 text-white font-bold text-base active:opacity-80 transition-opacity"
            style={{background:'#2563eb'}}>
            <span className="text-2xl">🗺️</span> Navegar con Maps
          </a>
        )}

        {/* WhatsApp notify */}
        {waAviso && (
          <a href={waAviso} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 rounded-2xl py-4 text-white font-bold text-base active:opacity-80 transition-opacity"
            style={{background:'#16a34a'}}>
            <span className="text-2xl">💬</span> Avisar por WhatsApp
          </a>
        )}

        {/* Items */}
        <div className="rounded-2xl p-4" style={{background:'#1e293b'}}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Pedido</p>
          {(order.items || []).length === 0 ? (
            <p className="text-slate-500 text-sm">Sin productos cargados</p>
          ) : (order.items || []).map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0" style={{borderColor:'#334155'}}>
              <span className="text-white text-sm">{item.productName}</span>
              <span className="text-slate-300 font-semibold">{item.quantity}×</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 mt-1">
            <span className="text-white font-bold">Total</span>
            <span className="font-bold text-lg" style={{color:'#60a5fa'}}>{DataService.formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-2xl p-4 border" style={{background:'#451a03', borderColor:'#92400e'}}>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color:'#fbbf24'}}>Nota</p>
            <p className="text-sm" style={{color:'#fde68a'}}>{order.notes}</p>
          </div>
        )}
      </div>

      {/* Bottom action */}
      {!done && (
        <div className="p-4 safe-bottom space-y-3">
          <button onClick={() => setShowPay(true)}
            className="w-full rounded-2xl py-5 text-white font-bold text-xl active:opacity-80 transition-opacity"
            style={{background:'#16a34a'}}>
            ✓ Entregar y cobrar
          </button>
          {order.client?.phone && (
            <a href={`https://wa.me/${order.client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(
              `Hola ${(order.client.name||'').split(' ')[0]}! 🚚 Pasamos por tu domicilio para entregar tu agua pero no encontramos a nadie. ¿Coordinamos una nueva entrega?`
            )}`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-white font-bold text-base active:opacity-80 transition-opacity"
              style={{background:'#b45309'}}>
              😔 No había nadie — avisar por WA
            </a>
          )}
        </div>
      )}

      {showPay && (
        <PayCollectModal order={order} onClose={() => setShowPay(false)} onConfirm={onDeliver} />
      )}
    </div>
  );
}

function PayCollectModal({ order, onClose, onConfirm }) {
  const [method, setMethod] = React.useState('efectivo');
  const [items, setItems] = React.useState(
    (order.items || []).length > 0
      ? order.items.map(i => ({ ...i }))
      : []
  );
  const [envasesRec, setEnvasesRec] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const updateQty = (idx, qty) => {
    setItems(its => its.map((it, i) => i === idx ? { ...it, quantity: Math.max(0, qty), subtotal: it.price * Math.max(0, qty) } : it));
  };

  const total = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  const totalEntregados = items.reduce((s, i) => s + (i.quantity || 0), 0);

  const confirm = async () => {
    setLoading(true);
    try {
      const delivered = items.filter(i => i.quantity > 0);
      await onConfirm(order, method, total, delivered, envasesRec, totalEntregados);
    } catch (e) {
      alert('Error al guardar: ' + e.message);
      setLoading(false);
    }
  };

  const methods = [
    { id: 'efectivo', label: 'Efectivo', emoji: '💵' },
    { id: 'transferencia', label: 'Transfer.', emoji: '🏦' },
    { id: 'mercadopago', label: 'MP', emoji: '💳' },
  ];

  return (
    <div className="fixed inset-0 flex items-end z-50" style={{background:'rgba(0,0,0,0.8)'}} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-6 max-h-screen overflow-y-auto" style={{background:'#1e293b'}} onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{background:'#475569'}} />
        <h3 className="text-white font-bold text-xl mb-1">Registrar entrega</h3>
        <p className="text-slate-400 text-sm mb-5">{order.client?.name}</p>

        {/* Editable items */}
        {items.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Qué se entregó</p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:'#0f172a'}}>
                  <p className="flex-1 text-white text-sm font-medium">{item.productName}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(i, (item.quantity || 0) - 1)}
                      className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center"
                      style={{background:'#334155'}}>−</button>
                    <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(i, (item.quantity || 0) + 1)}
                      className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center"
                      style={{background:'#334155'}}>+</button>
                  </div>
                  <span className="text-sm font-semibold w-16 text-right" style={{color:'#60a5fa'}}>
                    {item.quantity > 0 ? DataService.formatCurrency(item.price * item.quantity) : <span style={{color:'#475569'}}>—</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 px-1">
              <span className="text-slate-400 text-sm">Total a cobrar</span>
              <span className="text-white font-bold text-xl">{DataService.formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Envases */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">🫙 Envases</p>
          <div className="rounded-2xl p-4" style={{background:'#0f172a'}}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{borderColor:'#1e293b'}}>
              <span className="text-slate-300 text-sm">Entregados ahora</span>
              <span className="font-bold text-lg" style={{color:'#60a5fa'}}>{totalEntregados}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-medium">Vacíos recuperados</p>
                <p className="text-xs mt-0.5" style={{color:'#64748b'}}>Bidones vacíos que te devuelve</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEnvasesRec(r => Math.max(0, r - 1))}
                  className="w-10 h-10 rounded-xl text-white font-bold text-xl flex items-center justify-center"
                  style={{background:'#334155'}}>−</button>
                <span className="text-white font-bold text-2xl w-8 text-center">{envasesRec}</span>
                <button onClick={() => setEnvasesRec(r => r + 1)}
                  className="w-10 h-10 rounded-xl text-white font-bold text-xl flex items-center justify-center"
                  style={{background:'#334155'}}>+</button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{borderColor:'#1e293b'}}>
              <span className="text-xs" style={{color:'#64748b'}}>Saldo neto cliente hoy</span>
              <span className="text-sm font-bold" style={{color: totalEntregados - envasesRec > 0 ? '#fbbf24' : '#34d399'}}>
                {totalEntregados - envasesRec > 0 ? '+' : ''}{totalEntregados - envasesRec} envase{totalEntregados - envasesRec !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Forma de pago</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {methods.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className="py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all active:scale-95 font-bold"
              style={{background: method === m.id ? '#2563eb' : '#334155', color: method === m.id ? 'white' : '#94a3b8'}}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs">{m.label}</span>
            </button>
          ))}
        </div>

        <button onClick={confirm} disabled={loading || total === 0}
          className="w-full rounded-2xl py-5 text-white font-bold text-lg mb-3 disabled:opacity-50 active:opacity-80 transition-opacity"
          style={{background:'#16a34a'}}>
          {loading ? 'Guardando...' : `✓ Confirmar — ${DataService.formatCurrency(total)}`}
        </button>
        <button onClick={onClose} className="w-full py-3 text-sm" style={{color:'#64748b'}}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function DaySummary({ deliveries, config, onClose }) {
  const delivered = deliveries.filter(d => d.status === 'entregado');
  const pending = deliveries.filter(d => d.status === 'pendiente');
  const total = delivered.reduce((s, d) => s + (d.total || 0), 0);
  const totalEnvasesEnt = delivered.reduce((s, d) => s + (d.envasesEntregados || 0), 0);
  const totalEnvasesRec = delivered.reduce((s, d) => s + (d.envasesRecuperados || 0), 0);

  const byMethod = delivered.reduce((acc, d) => {
    const m = d.paymentMethod || 'efectivo';
    acc[m] = (acc[m] || 0) + (d.total || 0);
    return acc;
  }, {});

  const methodLabels = { efectivo: '💵 Efectivo', transferencia: '🏦 Transferencia', mercadopago: '💳 MercadoPago' };

  const logout = () => {
    sessionStorage.removeItem(PIN_KEY);
    sessionStorage.removeItem(PIN_DATE_KEY);
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-5" style={{background:'#0f172a'}}>
      <div className="flex items-center gap-3 pt-10 mb-8">
        <button onClick={onClose} className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl text-white"
          style={{background:'#1e293b'}}>
          ‹
        </button>
        <h1 className="text-white text-xl font-bold">Resumen del día</h1>
      </div>

      {/* Total */}
      <div className="rounded-3xl p-6 text-center mb-5" style={{background:'#2563eb'}}>
        <p className="text-blue-200 text-sm mb-1">Total cobrado</p>
        <p className="text-white text-4xl font-bold">{DataService.formatCurrency(total)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-2xl p-4 text-center" style={{background:'#1e293b'}}>
          <p className="font-bold text-3xl" style={{color:'#34d399'}}>{delivered.length}</p>
          <p className="text-slate-400 text-sm mt-1">Entregados</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{background:'#1e293b'}}>
          <p className="font-bold text-3xl" style={{color:'#fbbf24'}}>{pending.length}</p>
          <p className="text-slate-400 text-sm mt-1">Pendientes</p>
        </div>
      </div>

      {/* Envases */}
      {(totalEnvasesEnt > 0 || totalEnvasesRec > 0) && (
        <div className="rounded-2xl p-4 mb-5" style={{background:'#1e293b'}}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">🫙 Envases del día</p>
          <div className="flex justify-between items-center py-2.5 border-b" style={{borderColor:'#334155'}}>
            <span className="text-slate-300 text-sm">Entregados</span>
            <span className="font-bold text-lg" style={{color:'#60a5fa'}}>+{totalEnvasesEnt}</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b" style={{borderColor:'#334155'}}>
            <span className="text-slate-300 text-sm">Recuperados</span>
            <span className="font-bold text-lg" style={{color:'#34d399'}}>−{totalEnvasesRec}</span>
          </div>
          <div className="flex justify-between items-center pt-2.5">
            <span className="text-white text-sm font-semibold">Neto en calle</span>
            <span className="font-bold text-lg" style={{color: totalEnvasesEnt - totalEnvasesRec > 0 ? '#fbbf24' : '#34d399'}}>
              {totalEnvasesEnt - totalEnvasesRec > 0 ? '+' : ''}{totalEnvasesEnt - totalEnvasesRec}
            </span>
          </div>
        </div>
      )}

      {/* By method */}
      {Object.keys(byMethod).length > 0 && (
        <div className="rounded-2xl p-4 mb-5" style={{background:'#1e293b'}}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Por forma de pago</p>
          {Object.entries(byMethod).map(([m, amt]) => (
            <div key={m} className="flex justify-between items-center py-2.5 border-b last:border-0" style={{borderColor:'#334155'}}>
              <span className="text-slate-300 text-sm">{methodLabels[m] || m}</span>
              <span className="text-white font-bold">{DataService.formatCurrency(amt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Delivered list */}
      {delivered.length > 0 && (
        <div className="rounded-2xl p-4 mb-5" style={{background:'#1e293b'}}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Entregas realizadas</p>
          {delivered.map(d => (
            <div key={d.id} className="flex justify-between items-center py-2.5 border-b last:border-0" style={{borderColor:'#334155'}}>
              <p className="text-white text-sm font-medium truncate flex-1">{d.client?.name}</p>
              <p className="text-sm font-bold ml-3 flex-shrink-0" style={{color:'#34d399'}}>
                {DataService.formatCurrency(d.total)}
              </p>
            </div>
          ))}
        </div>
      )}

      <button onClick={logout}
        className="w-full py-4 rounded-2xl text-sm font-medium mt-2"
        style={{background:'#1e293b', color:'#64748b'}}>
        🔒 Cerrar sesión
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DriverApp />);
