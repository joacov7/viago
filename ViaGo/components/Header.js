function Header({ activeTab, setActiveTab }) {
  try {
    return (
      <header className="bg-white shadow-sm border-b" data-name="header" data-file="components/Header.js">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <div className="icon-truck text-xl text-white"></div>
                </div>
                <h1 className="ml-3 text-xl font-bold text-gray-900">CargoExpress</h1>
              </div>
            </div>
            
            <nav className="flex space-x-8 ml-8">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'new' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Nuevo Envío
              </button>
              <button
                onClick={() => setActiveTab('shipments')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'shipments' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mis Envíos
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'tracking' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Seguimiento
              </button>
              <button
                onClick={() => setActiveTab('driver')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'driver' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Conductor
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reportes
              </button>
              <button
                onClick={() => setActiveTab('fleet')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'fleet' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Flota
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'billing' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Facturación
              </button>
              <button
                onClick={() => setActiveTab('zones')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'zones' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Zonas
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'inventory' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inventario
              </button>
            </nav>
          </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}