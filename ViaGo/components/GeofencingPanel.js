function GeofencingPanel({ shipments }) {
  try {
    const [zones, setZones] = React.useState([
      {
        id: '1',
        name: 'Centro de Distribución Norte',
        type: 'warehouse',
        lat: 4.7587,
        lng: -74.0547,
        radius: 500,
        active: true
      },
      {
        id: '2',
        name: 'Zona Comercial Centro',
        type: 'delivery',
        lat: 4.7110,
        lng: -74.0721,
        radius: 1000,
        active: true
      }
    ]);
    const [alerts, setAlerts] = React.useState([]);
    const [showForm, setShowForm] = React.useState(false);

    React.useEffect(() => {
      const interval = setInterval(() => {
        const newAlerts = [];
        zones.forEach(zone => {
          if (Math.random() > 0.7) {
            newAlerts.push({
              id: Date.now() + Math.random(),
              zoneId: zone.id,
              zoneName: zone.name,
              event: Math.random() > 0.5 ? 'entrada' : 'salida',
              driverName: 'Juan Pérez',
              timestamp: new Date().toISOString()
            });
          }
        });
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
        }
      }, 8000);

      return () => clearInterval(interval);
    }, [zones]);

    const addZone = (zoneData) => {
      const newZone = {
        ...zoneData,
        id: Date.now().toString()
      };
      setZones([...zones, newZone]);
      setShowForm(false);
    };

    return (
      <div className="max-w-6xl mx-auto" data-name="geofencing-panel" data-file="components/GeofencingPanel.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Zonas</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <div className="icon-map-pin text-lg mr-2"></div>
            Nueva Zona
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zonas Activas</h3>
            <div className="space-y-3">
              {zones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${zone.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{zone.name}</p>
                      <p className="text-sm text-gray-600">Radio: {zone.radius}m</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    zone.type === 'warehouse' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {zone.type === 'warehouse' ? 'Almacén' : 'Entrega'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Recientes</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay alertas recientes</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="icon-alert-circle text-yellow-600 text-lg mr-3 mt-0.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.driverName} - {alert.event} en {alert.zoneName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(alert.timestamp).toLocaleTimeString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Zona</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addZone({
                  name: formData.get('name'),
                  type: formData.get('type'),
                  lat: parseFloat(formData.get('lat')),
                  lng: parseFloat(formData.get('lng')),
                  radius: parseInt(formData.get('radius')),
                  active: true
                });
              }}>
                <div className="space-y-4">
                  <input name="name" placeholder="Nombre de la zona" className="w-full px-3 py-2 border rounded-lg" required />
                  <select name="type" className="w-full px-3 py-2 border rounded-lg" required>
                    <option value="warehouse">Almacén</option>
                    <option value="delivery">Zona de Entrega</option>
                  </select>
                  <input name="lat" type="number" step="any" placeholder="Latitud" className="w-full px-3 py-2 border rounded-lg" required />
                  <input name="lng" type="number" step="any" placeholder="Longitud" className="w-full px-3 py-2 border rounded-lg" required />
                  <input name="radius" type="number" placeholder="Radio (metros)" className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div className="flex space-x-3 mt-6">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">Cancelar</button>
                  <button type="submit" className="flex-1 btn-primary">Crear</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('GeofencingPanel component error:', error);
    return null;
  }
}