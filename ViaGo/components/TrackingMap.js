function TrackingMap({ shipments }) {
  try {
    const [selectedShipment, setSelectedShipment] = React.useState(null);
    const [driverLocation, setDriverLocation] = React.useState({});

    const activeShipments = shipments.filter(s => 
      s.objectData.status === 'En tránsito' || s.objectData.status === 'Asignado'
    );

    const simulateDriverLocation = (shipmentId) => {
      const locations = [
        { lat: 4.7110, lng: -74.0721, name: "Bogotá Centro" },
        { lat: 4.6097, lng: -74.0817, name: "Zona Sur" },
        { lat: 4.7587, lng: -74.0547, name: "Zona Norte" },
        { lat: 4.6486, lng: -74.0571, name: "Zona Occidental" }
      ];
      return locations[Math.floor(Math.random() * locations.length)];
    };

    React.useEffect(() => {
      const interval = setInterval(() => {
        const newLocations = {};
        activeShipments.forEach(shipment => {
          newLocations[shipment.objectId] = simulateDriverLocation(shipment.objectId);
        });
        setDriverLocation(newLocations);
      }, 5000);

      return () => clearInterval(interval);
    }, [activeShipments]);

    return (
      <div className="max-w-6xl mx-auto" data-name="tracking-map" data-file="components/TrackingMap.js">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Seguimiento en Tiempo Real</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card h-96 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="icon-map text-4xl text-gray-400 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Mapa de Seguimiento</h3>
                <p className="text-gray-500">Vista simulada del mapa con ubicaciones en tiempo real</p>
                {selectedShipment && driverLocation[selectedShipment.objectId] && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Conductor en: {driverLocation[selectedShipment.objectId].name}
                    </p>
                    <p className="text-xs text-blue-600">
                      Lat: {driverLocation[selectedShipment.objectId].lat}, 
                      Lng: {driverLocation[selectedShipment.objectId].lng}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Envíos Activos</h3>
            {activeShipments.length === 0 ? (
              <div className="text-center py-8">
                <div className="icon-truck text-2xl text-gray-400 mb-2"></div>
                <p className="text-gray-500">No hay envíos en tránsito</p>
              </div>
            ) : (
              activeShipments.map(shipment => (
                <div
                  key={shipment.objectId}
                  onClick={() => setSelectedShipment(shipment)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedShipment?.objectId === shipment.objectId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {shipment.objectData.cargo_type}
                    </span>
                    <span className={`status-badge ${
                      shipment.objectData.status === 'En tránsito' ? 'status-transit' : 'status-assigned'
                    }`}>
                      {shipment.objectData.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Cliente: {shipment.objectData.customer_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {shipment.objectId.slice(-8).toUpperCase()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TrackingMap component error:', error);
    return null;
  }
}