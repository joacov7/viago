function Header({ activeTab, setActiveTab }) {
  try {
    const navBtn = (tab, label) => (
      <button
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
          activeTab === tab
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {label}
      </button>
    );

    return (
      <header className="bg-white shadow-sm border-b" data-name="header" data-file="components/Header.js">
        <div className="flex items-center h-16">

          {/* Enlace de vuelta al inicio */}
          <a
            href="index.html"
            className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-sm mr-4 transition-colors flex-shrink-0"
          >
            <span className="icon-chevron-left text-xs"></span>
            ViaGo
          </a>
          <div className="h-5 w-px bg-gray-200 mr-4 flex-shrink-0"></div>

          <div className="flex items-center flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="icon-truck text-sm text-white"></span>
            </div>
            <h1 className="ml-2 text-base font-bold text-gray-900">CargoExpress</h1>
          </div>

          <nav className="flex space-x-1 ml-6 overflow-x-auto">
            {navBtn('new',       'Nuevo Envío')}
            {navBtn('shipments', 'Mis Envíos')}
            {navBtn('tracking',  'Seguimiento')}
            {navBtn('driver',    'Conductor')}
            {navBtn('reports',   'Reportes')}
            {navBtn('fleet',     'Flota')}
            {navBtn('billing',   'Facturación')}
            {navBtn('zones',     'Zonas')}
            {navBtn('inventory', 'Inventario')}
          </nav>
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}
