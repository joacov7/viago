// NATIVA - Sidebar navigation component

function Sidebar({ activeModule, onNavigate, isOpen, onClose }) {
  const config = DataService.getConfig();

  const navItems = [
    { id: 'dashboard',  icon: 'dashboard',    label: 'Dashboard' },
    { id: 'clients',    icon: 'users',        label: 'Clientes' },
    { id: 'orders',     icon: 'package',      label: 'Pedidos' },
    { id: 'delivery',   icon: 'truck',        label: 'Reparto' },
    { id: 'zones',      icon: 'mapPin',       label: 'Zonas' },
    { id: 'billing',    icon: 'fileText',     label: 'Facturación' },
    { id: 'loyalty',    icon: 'star',         label: 'Fidelización' },
    { id: 'products',   icon: 'shoppingBag',  label: 'Productos' },
    { id: 'config',     icon: 'settings',     label: 'Configuración' },
  ];

  const handleNav = (id) => { onNavigate(id); onClose(); };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full w-64 z-30 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        style={{ background: 'linear-gradient(180deg, #0f2142 0%, #0d1b35 100%)' }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white border-opacity-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <Icon name="droplets" size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight truncate">{config.companyName}</h1>
            <p className="text-blue-300 text-xs leading-tight truncate opacity-80">{config.tagline}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(item => {
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left
                  transition-all duration-150 group
                  ${active
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white hover:bg-opacity-5'
                  }
                `}
                style={active ? { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' } : {}}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}
                />
                <span className="text-sm">{item.label}</span>
                {item.id === 'delivery' && (
                  <span className="ml-auto">
                    <TodayBadge />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom version tag */}
        <div className="px-5 py-4 border-t border-white border-opacity-10">
          <p className="text-slate-500 text-xs">NATIVA · MVP v1.0</p>
        </div>
      </aside>
    </>
  );
}

function TodayBadge() {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    DataService.getTodayOrders().then(orders => setCount(orders.filter(o => o.status === 'pendiente').length));
  }, []);
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white bg-red-500">
      {count > 9 ? '9+' : count}
    </span>
  );
}

// Reusable top-bar header for each module
function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// Reusable Modal component
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-screen overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-slate-400 hover:text-slate-600">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Reusable status badge
function StatusBadge({ status }) {
  const map = {
    pendiente:    { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Pendiente' },
    entregado:    { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Entregado' },
    cancelado:    { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Cancelado' },
    pagado:       { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Pagado' },
    hogar:        { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Hogar' },
    comercio:     { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Comercio' },
    semanal:      { bg: 'bg-sky-100',    text: 'text-sky-800',    label: 'Semanal' },
    quincenal:    { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Quincenal' },
    ocasional:    { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Ocasional' },
    efectivo:     { bg: 'bg-green-50',   text: 'text-green-700',  label: 'Efectivo' },
    transferencia:{ bg: 'bg-blue-50',    text: 'text-blue-700',   label: 'Transferencia' },
    mercadopago:  { bg: 'bg-cyan-50',    text: 'text-cyan-700',   label: 'MercadoPago' },
  };
  const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

// Reusable form field
function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function inputCls(extra = '') {
  return `w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${extra}`;
}

// Reusable btn
function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', type = 'button', icon }) {
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 shadow-sm',
    danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    ghost:     'text-slate-600 hover:bg-gray-100',
    success:   'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
}

// Empty state helper
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon name={icon} size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

// Confirm dialog
function useConfirm() {
  return (message) => window.confirm(message);
}
