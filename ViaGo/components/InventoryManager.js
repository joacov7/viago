function InventoryManager() {
  try {
    const [inventory, setInventory] = React.useState([]);
    const [warehouses, setWarehouses] = React.useState([
      { id: '1', name: 'Almacén Norte', location: 'Zona Norte', capacity: 1000 },
      { id: '2', name: 'Almacén Sur', location: 'Zona Sur', capacity: 800 }
    ]);
    const [loading, setLoading] = React.useState(false);

    const loadInventory = async () => {
      setLoading(true);
      try {
        const result = await trickleListObjects('inventory', 50, true);
        setInventory(result.items || []);
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    const addInventoryItem = async (itemData) => {
      try {
        await trickleCreateObject('inventory', itemData);
        loadInventory();
      } catch (error) {
        alert('Error al agregar item: ' + error.message);
      }
    };

    React.useEffect(() => {
      loadInventory();
    }, []);

    const getStatusColor = (stock) => {
      if (stock <= 10) return 'bg-red-100 text-red-800';
      if (stock <= 50) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    };

    return (
      <div className="max-w-6xl mx-auto" data-name="inventory-manager" data-file="components/InventoryManager.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h2>
          <button
            onClick={() => addInventoryItem({
              name: `Producto ${Date.now()}`,
              category: 'Electrónicos',
              stock: Math.floor(Math.random() * 100) + 20,
              warehouse_id: warehouses[0].id,
              location: warehouses[0].name,
              status: 'Disponible'
            })}
            className="btn-primary flex items-center"
          >
            <div className="icon-plus text-lg mr-2"></div>
            Agregar Item
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {warehouses.map(warehouse => (
            <div key={warehouse.id} className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <div className="icon-warehouse text-xl text-blue-600"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                  <p className="text-sm text-gray-600">{warehouse.location}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacidad:</span>
                  <span className="font-medium">{warehouse.capacity} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ocupado:</span>
                  <span className="font-medium">
                    {inventory.filter(item => item.objectData.warehouse_id === warehouse.id).length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventario Actual</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando inventario...</p>
            </div>
          ) : inventory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay items en inventario</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Producto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Categoría</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Stock</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ubicación</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.objectId} className="border-t">
                      <td className="px-4 py-2 text-sm font-medium">{item.objectData.name}</td>
                      <td className="px-4 py-2 text-sm">{item.objectData.category}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.objectData.stock)}`}>
                          {item.objectData.stock}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{item.objectData.location}</td>
                      <td className="px-4 py-2">
                        <span className="status-badge status-delivered">{item.objectData.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('InventoryManager component error:', error);
    return null;
  }
}