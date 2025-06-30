function FleetManagement() {
  try {
    const [vehicles, setVehicles] = React.useState([
      {
        id: '1',
        plate: 'ABC-123',
        type: 'Camión',
        capacity: '5000 kg',
        driver: 'Juan Pérez',
        status: 'Disponible',
        lastMaintenance: '2024-01-15'
      },
      {
        id: '2',
        plate: 'XYZ-789',
        type: 'Camioneta',
        capacity: '1500 kg',
        driver: 'María García',
        status: 'En servicio',
        lastMaintenance: '2024-02-20'
      }
    ]);
    const [showForm, setShowForm] = React.useState(false);
    const [newVehicle, setNewVehicle] = React.useState({
      plate: '',
      type: 'Camión',
      capacity: '',
      driver: '',
      status: 'Disponible'
    });

    const handleAddVehicle = () => {
      const vehicle = {
        ...newVehicle,
        id: Date.now().toString(),
        lastMaintenance: new Date().toISOString().split('T')[0]
      };
      setVehicles([...vehicles, vehicle]);
      setNewVehicle({
        plate: '',
        type: 'Camión',
        capacity: '',
        driver: '',
        status: 'Disponible'
      });
      setShowForm(false);
    };

    const getStatusColor = (status) => {
      const colors = {
        'Disponible': 'bg-green-100 text-green-800',
        'En servicio': 'bg-blue-100 text-blue-800',
        'Mantenimiento': 'bg-yellow-100 text-yellow-800',
        'Fuera de servicio': 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getMaintenanceStatus = (lastMaintenance) => {
      const date = new Date(lastMaintenance);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 90) return { status: 'Urgente', color: 'text-red-600' };
      if (diffDays > 60) return { status: 'Próximo', color: 'text-yellow-600' };
      return { status: 'Al día', color: 'text-green-600' };
    };

    return (
      <div className="max-w-6xl mx-auto" data-name="fleet-management" data-file="components/FleetManagement.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Flota</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <div className="icon-plus text-lg mr-2"></div>
            Agregar Vehículo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <div className="icon-truck text-xl text-blue-600"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.plate}</h3>
                    <p className="text-sm text-gray-500">{vehicle.type}</p>
                  </div>
                </div>
                <span className={`status-badge ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacidad:</span>
                  <span className="font-medium">{vehicle.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conductor:</span>
                  <span className="font-medium">{vehicle.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Último mantenimiento:</span>
                  <span className="font-medium">{vehicle.lastMaintenance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado mantenimiento:</span>
                  <span className={`font-medium ${getMaintenanceStatus(vehicle.lastMaintenance).color}`}>
                    {getMaintenanceStatus(vehicle.lastMaintenance).status}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg">
                  Editar
                </button>
                <button className="flex-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded-lg">
                  Mantenimiento
                </button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Vehículo</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={newVehicle.plate}
                    onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="ABC-123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newVehicle.type}
                    onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Camión">Camión</option>
                    <option value="Camioneta">Camioneta</option>
                    <option value="Furgón">Furgón</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad
                  </label>
                  <input
                    type="text"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="5000 kg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conductor
                  </label>
                  <input
                    type="text"
                    value={newVehicle.driver}
                    onChange={(e) => setNewVehicle({...newVehicle, driver: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nombre del conductor"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddVehicle}
                  className="flex-1 btn-primary"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('FleetManagement component error:', error);
    return null;
  }
}