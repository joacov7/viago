function RouteOptimizer({ shipments }) {
  try {
    const [routes, setRoutes] = React.useState([]);
    const [optimizing, setOptimizing] = React.useState(false);

    const pendingShipments = shipments.filter(s => s.objectData.status === 'Pendiente');

    const optimizeRoutes = async () => {
      setOptimizing(true);
      
      setTimeout(() => {
        const optimizedRoutes = [
          {
            id: 'route-1',
            driver: 'Juan Pérez',
            shipments: pendingShipments.slice(0, 3),
            totalDistance: '45 km',
            estimatedTime: '3.5 horas',
            efficiency: 95
          },
          {
            id: 'route-2',
            driver: 'María García',
            shipments: pendingShipments.slice(3, 6),
            totalDistance: '38 km',
            estimatedTime: '2.8 horas',
            efficiency: 92
          }
        ];
        
        setRoutes(optimizedRoutes);
        setOptimizing(false);
      }, 3000);
    };

    const assignRoute = async (route) => {
      try {
        for (const shipment of route.shipments) {
          await ShipmentService.updateShipment(shipment.objectId, {
            status: 'Asignado',
            driver_id: route.driver
          });
        }
        alert(`Ruta asignada a ${route.driver}`);
      } catch (error) {
        alert('Error al asignar ruta: ' + error.message);
      }
    };

    return (
      <div className="max-w-6xl mx-auto" data-name="route-optimizer" data-file="components/RouteOptimizer.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Optimización de Rutas</h2>
          <button
            onClick={optimizeRoutes}
            disabled={optimizing || pendingShipments.length === 0}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            {optimizing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <div className="icon-route text-lg mr-2"></div>
            )}
            {optimizing ? 'Optimizando...' : 'Optimizar Rutas'}
          </button>
        </div>

        {pendingShipments.length === 0 && (
          <div className="text-center py-12">
            <div className="icon-map text-4xl text-gray-400 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay envíos pendientes</h3>
            <p className="text-gray-600">Crea nuevos envíos para optimizar rutas</p>
          </div>
        )}

        {routes.length > 0 && (
          <div className="space-y-6">
            {routes.map(route => (
              <div key={route.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ruta para {route.driver}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {route.shipments.length} envíos • {route.totalDistance} • {route.estimatedTime}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <p className="text-sm text-gray-600">Eficiencia</p>
                      <p className="text-lg font-bold text-green-600">{route.efficiency}%</p>
                    </div>
                    <button
                      onClick={() => assignRoute(route)}
                      className="btn-primary text-sm"
                    >
                      Asignar Ruta
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {route.shipments.map((shipment, index) => (
                    <div key={shipment.objectId} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {shipment.objectData.customer_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shipment.objectData.pickup_address} → {shipment.objectData.delivery_address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{shipment.objectData.cargo_type}</p>
                        <p className="text-sm text-gray-600">{shipment.objectData.weight} kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('RouteOptimizer component error:', error);
    return null;
  }
}