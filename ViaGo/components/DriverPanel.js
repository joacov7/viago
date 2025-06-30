function DriverPanel({ shipments, onUpdateShipment }) {
  try {
    const [driverName, setDriverName] = React.useState('Juan Pérez');
    const [selectedShipment, setSelectedShipment] = React.useState(null);
    const [deliveryPhoto, setDeliveryPhoto] = React.useState(null);

    const assignedShipments = shipments.filter(s => 
      s.objectData.status === 'Asignado' || s.objectData.status === 'En tránsito'
    );

    const handleStatusUpdate = async (shipmentId, newStatus) => {
      try {
        await onUpdateShipment(shipmentId, { status: newStatus });
        setSelectedShipment(null);
        alert(`Estado actualizado a: ${newStatus}`);
      } catch (error) {
        alert('Error al actualizar estado: ' + error.message);
      }
    };

    const handlePhotoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setDeliveryPhoto(e.target.result);
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="max-w-4xl mx-auto" data-name="driver-panel" data-file="components/DriverPanel.js">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Panel de Conductor</h2>
          <div className="flex items-center bg-green-100 px-4 py-2 rounded-lg">
            <div className="icon-user-check text-xl text-green-600 mr-2"></div>
            <span className="font-medium text-green-900">{driverName}</span>
          </div>
        </div>

        {assignedShipments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="icon-clipboard-list text-3xl text-gray-400"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay envíos asignados</h3>
            <p className="text-gray-600">Espera nuevas asignaciones de envío</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedShipments.map(shipment => (
              <div key={shipment.objectId} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{shipment.objectData.cargo_type}</h3>
                    <p className="text-sm text-gray-500">ID: {shipment.objectId.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`status-badge ${
                    shipment.objectData.status === 'En tránsito' ? 'status-transit' : 'status-assigned'
                  }`}>
                    {shipment.objectData.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
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

                  <div className="flex items-center">
                    <div className="icon-user text-lg text-blue-600 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Cliente</p>
                      <p className="text-sm text-gray-600">{shipment.objectData.customer_name}</p>
                    </div>
                    <a
                      href={`tel:${shipment.objectData.customer_phone}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <div className="icon-phone text-lg"></div>
                    </a>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {shipment.objectData.status === 'Asignado' && (
                    <button
                      onClick={() => handleStatusUpdate(shipment.objectId, 'En tránsito')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      Iniciar Viaje
                    </button>
                  )}
                  
                  {shipment.objectData.status === 'En tránsito' && (
                    <button
                      onClick={() => setSelectedShipment(shipment)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                      Marcar Entregado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedShipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Entrega</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de confirmación
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {deliveryPhoto && (
                  <img src={deliveryPhoto} alt="Confirmación" className="mt-2 w-full h-32 object-cover rounded-lg" />
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedShipment.objectId, 'Entregado')}
                  className="flex-1 btn-primary"
                >
                  Confirmar Entrega
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('DriverPanel component error:', error);
    return null;
  }
}