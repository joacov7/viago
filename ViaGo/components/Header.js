function Header({ activeTab, setActiveTab }) {
  try {
    const navBtn = (tab, label) => (
      <button
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === tab
            ? tab === 'purificadora'
              ? 'bg-cyan-100 text-cyan-700'
              : 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {label}
      </button>
    );

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

          <nav className="flex space-x-1 ml-8 overflow-x-auto">
            {navBtn('new',          'Nuevo Envío')}
            {navBtn('shipments',    'Mis Envíos')}
            {navBtn('tracking',     'Seguimiento')}
            {navBtn('driver',       'Conductor')}
            {navBtn('reports',      'Reportes')}
            {navBtn('fleet',        'Flota')}
            {navBtn('billing',      'Facturación')}
            {navBtn('zones',        'Zonas')}
            {navBtn('inventory',    'Inventario')}
            {navBtn('purificadora', '💧 Purificadora')}
          </nav>
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}
