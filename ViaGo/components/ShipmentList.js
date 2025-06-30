function ShipmentList({ shipments, loading, onRefresh }) {
  try {
    const [filterStatus, setFilterStatus] = React.useState('all');

    const filteredShipments = shipments.filter(shipment => 
      filterStatus === 'all' || shipment.objectData.status === filterStatus
    );

    const getStatusCount = (status) => {
      return shipments.filter(s => s.objectData.status === status).length;
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12" data-name="loading" data-file="components/ShipmentList.js">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando envíos...</span>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto" data-name="shipment-list" data-file="components/ShipmentList.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis Envíos</h2>
          <button
            onClick={onRefresh}
            className="btn-secondary flex items-center"
          >
            <div className="icon-refresh-cw text-lg mr-2"></div>
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({shipments.length})
            </button>
            <button
              onClick={() => setFilterStatus('Pendiente')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'Pendiente'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes ({getStatusCount('Pendiente')})
            </button>
            <button
              onClick={() => setFilterStatus('En tránsito')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'En tránsito'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Tránsito ({getStatusCount('En tránsito')})
            </button>
            <button
              onClick={() => setFilterStatus('Entregado')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'Entregado'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entregados ({getStatusCount('Entregado')})
            </button>
          </div>
        </div>

        {/* Lista de envíos */}
        {filteredShipments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="icon-package text-3xl text-gray-400"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No hay envíos' : `No hay envíos ${filterStatus.toLowerCase()}`}
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? 'Crea tu primer envío para comenzar'
                : 'No se encontraron envíos con este estado'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShipments.map(shipment => (
              <ShipmentCard key={shipment.objectId} shipment={shipment} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('ShipmentList component error:', error);
    return null;
  }
}