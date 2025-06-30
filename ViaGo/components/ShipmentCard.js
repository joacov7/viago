function ShipmentCard({ shipment }) {
  try {
    const getStatusClass = (status) => {
      const statusMap = {
        'Pendiente': 'status-pending',
        'Asignado': 'status-assigned',
        'En tránsito': 'status-transit',
        'Entregado': 'status-delivered',
        'Cancelado': 'status-cancelled'
      };
      return `status-badge ${statusMap[status] || 'status-pending'}`;
    };

    const getStatusIcon = (status) => {
      const iconMap = {
        'Pendiente': 'clock',
        'Asignado': 'user-check',
        'En tránsito': 'truck',
        'Entregado': 'check-circle',
        'Cancelado': 'x-circle'
      };
      return iconMap[status] || 'clock';
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'No especificada';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="card hover:shadow-md transition-shadow" data-name="shipment-card" data-file="components/ShipmentCard.js">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
              <div className="icon-package text-xl text-gray-600"></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {shipment.objectData.cargo_type}
              </h3>
              <p className="text-sm text-gray-500">
                ID: {shipment.objectId.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <span className={getStatusClass(shipment.objectData.status)}>
            {shipment.objectData.status}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start">
            <div className="icon-map-pin text-lg text-green-600 mr-3 mt-0.5"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Recogida</p>
              <p className="text-sm text-gray-600">{shipment.objectData.pickup_address}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="icon-map-pin text-lg text-red-600 mr-3 mt-0.5"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Entrega</p>
              <p className="text-sm text-gray-600">{shipment.objectData.delivery_address}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Peso</p>
              <p className="font-medium">{shipment.objectData.weight} kg</p>
            </div>
            <div>
              <p className="text-gray-500">Precio</p>
              <p className="font-medium text-blue-600">${shipment.objectData.price}</p>
            </div>
            <div>
              <p className="text-gray-500">Cliente</p>
              <p className="font-medium">{shipment.objectData.customer_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Fecha recogida</p>
              <p className="font-medium">{formatDate(shipment.objectData.pickup_date)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <div className={`icon-${getStatusIcon(shipment.objectData.status)} text-lg mr-2`}></div>
            <span>Actualizado {formatDate(shipment.updatedAt)}</span>
          </div>
          
          {shipment.objectData.customer_phone && (
            <a
              href={`tel:${shipment.objectData.customer_phone}`}
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <div className="icon-phone text-lg mr-1"></div>
              Llamar
            </a>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ShipmentCard component error:', error);
    return null;
  }
}