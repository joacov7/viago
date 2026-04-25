// NATIVA - Configuration / Settings module

function Config() {
  const [config, setConfig] = React.useState(DataService.getConfig());
  const [activeTab, setActiveTab] = React.useState('empresa');
  const [saved, setSaved] = React.useState(false);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const saveConfig = () => {
    DataService.saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: 'building' },
    { id: 'productos', label: 'Productos', icon: 'shoppingBag' },
    { id: 'fidelizacion', label: 'Fidelización', icon: 'star' },
    { id: 'pagos', label: 'Pagos', icon: 'creditCard' },
    { id: 'avanzado', label: 'Avanzado', icon: 'settings' },
  ];

  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Personalizá NATIVA para tu negocio"
        action={
          <Btn onClick={saveConfig} variant={saved ? 'success' : 'primary'} icon={saved ? 'check' : 'download'}>
            {saved ? '¡Guardado!' : 'Guardar cambios'}
          </Btn>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-gray-50'}`}>
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            {/* EMPRESA */}
            {activeTab === 'empresa' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-slate-900 text-base pb-3 border-b border-gray-100">Información de la empresa</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Nombre de la empresa">
                    <input value={config.companyName || ''} onChange={e => set('companyName', e.target.value)} className={inputCls()} placeholder="NATIVA" />
                  </FormField>
                  <FormField label="Tagline">
                    <input value={config.tagline || ''} onChange={e => set('tagline', e.target.value)} className={inputCls()} placeholder="Agua que llega. Siempre." />
                  </FormField>
                  <FormField label="Teléfono">
                    <input value={config.phone || ''} onChange={e => set('phone', e.target.value)} className={inputCls()} placeholder="+54 9 11 0000-0000" />
                  </FormField>
                  <FormField label="WhatsApp de la empresa" hint="Número para generar links automáticos">
                    <input value={config.whatsappNumber || ''} onChange={e => set('whatsappNumber', e.target.value)} className={inputCls()} placeholder="5491123456789 (sin + ni espacios)" />
                  </FormField>
                  <FormField label="Email">
                    <input type="email" value={config.email || ''} onChange={e => set('email', e.target.value)} className={inputCls()} placeholder="info@nativa.com.ar" />
                  </FormField>
                  <FormField label="Dirección">
                    <input value={config.address || ''} onChange={e => set('address', e.target.value)} className={inputCls()} placeholder="Av. Principal 123, Ciudad" />
                  </FormField>
                </div>

                <FormField label="Ciudad / Localidad" hint="Se agrega automáticamente a todas las direcciones al abrir en Maps y calcular distancias. Ej: Córdoba, Argentina">
                  <input value={config.city || ''} onChange={e => set('city', e.target.value)} className={inputCls()} placeholder="Ej: Córdoba, Argentina" />
                </FormField>
                {config.city && (
                  <div className="p-3 bg-blue-50 rounded-xl flex items-start gap-2">
                    <Icon name="mapPin" size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">Las direcciones se abrirán como: <strong>"Belgrano 526, {config.city}"</strong></p>
                  </div>
                )}

                {/* Brand preview */}
                <div className="mt-4 p-5 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Vista previa del encabezado</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: config.primaryColor || '#2563EB' }}>
                      <Icon name="droplets" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{config.companyName || 'NATIVA'}</p>
                      <p className="text-sm text-slate-500">{config.tagline || 'Agua que llega. Siempre.'}</p>
                    </div>
                  </div>
                </div>

                <FormField label="Color principal de la marca">
                  <div className="flex items-center gap-3">
                    <input type="color" value={config.primaryColor || '#2563EB'} onChange={e => set('primaryColor', e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200" />
                    <span className="font-mono text-sm text-slate-600">{config.primaryColor}</span>
                    <div className="flex gap-2 flex-wrap">
                      {['#2563EB', '#0EA5E9', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'].map(c => (
                        <button key={c} type="button" onClick={() => set('primaryColor', c)}
                          className="w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </FormField>
              </div>
            )}

            {/* PRODUCTOS */}
            {activeTab === 'productos' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-base pb-3 border-b border-gray-100">Gestión de productos</h3>
                <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                  <Icon name="info" size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Administrar productos</p>
                    <p className="text-sm text-blue-600 mt-0.5">Los productos se administran desde la sección "Productos" del menú. Allí podés crear, editar, activar y desactivar productos.</p>
                  </div>
                </div>
                <ProductsQuickList />
              </div>
            )}

            {/* FIDELIZACIÓN */}
            {activeTab === 'fidelizacion' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-slate-900 text-base pb-3 border-b border-gray-100">Sistema de puntos y referidos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Puntos por entrega" hint="Puntos que gana el cliente por cada pedido entregado">
                    <input type="number" value={config.pointsPerOrder || 10} onChange={e => set('pointsPerOrder', parseInt(e.target.value))} className={inputCls()} min="0" />
                  </FormField>
                  <FormField label="Puntos para premio" hint="Cantidad de puntos necesarios para obtener un premio">
                    <input type="number" value={config.pointsForReward || 100} onChange={e => set('pointsForReward', parseInt(e.target.value))} className={inputCls()} min="1" />
                  </FormField>
                  <FormField label="Puntos por referido" hint="Puntos que recibe quien trajo al nuevo cliente">
                    <input type="number" value={config.referralBonus || 50} onChange={e => set('referralBonus', parseInt(e.target.value))} className={inputCls()} min="0" />
                  </FormField>
                  <FormField label="Producto gratuito (premio)" hint="ID del producto que se entrega como premio">
                    <select value={config.freeProductId || ''} onChange={e => set('freeProductId', parseInt(e.target.value))} className={inputCls()}>
                      <option value="">Seleccionar producto</option>
                      {DataService.getProducts().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </FormField>
                </div>

                {/* Preview */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Ejemplo del programa</p>
                  <p className="text-sm text-amber-700">
                    Un cliente que compra regularmente gana <strong>{config.pointsPerOrder} puntos</strong> por entrega.
                    Necesita <strong>{Math.ceil((config.pointsForReward || 100) / (config.pointsPerOrder || 10))} entregas</strong> para obtener un premio.
                    Si refiere un amigo, recibe <strong>{config.referralBonus} puntos extra</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* PAGOS */}
            {activeTab === 'pagos' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-slate-900 text-base pb-3 border-b border-gray-100">Métodos de pago</h3>

                <FormField label="Métodos de pago habilitados">
                  <div className="space-y-2">
                    {['efectivo', 'transferencia', 'mercadopago'].map(m => {
                      const labels = { efectivo: '💵 Efectivo', transferencia: '🏦 Transferencia bancaria', mercadopago: '💳 MercadoPago' };
                      const enabled = (config.paymentMethods || []).includes(m);
                      return (
                        <label key={m} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                          <input type="checkbox" checked={enabled} onChange={e => {
                            const methods = config.paymentMethods || [];
                            set('paymentMethods', e.target.checked ? [...methods, m] : methods.filter(x => x !== m));
                          }} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-sm font-medium text-slate-700">{labels[m]}</span>
                        </label>
                      );
                    })}
                  </div>
                </FormField>

                <div className="border-t border-gray-100 pt-5">
                  <h4 className="font-semibold text-slate-700 mb-3">MercadoPago</h4>
                  <FormField label="Link de cobro MP" hint="Tu link personalizado de MercadoPago para generar pagos (ej: link.mercadopago.com.ar/tu-usuario)">
                    <input value={config.mpPublicKey || ''} onChange={e => set('mpPublicKey', e.target.value)} className={inputCls()} placeholder="tu-usuario-mp" />
                  </FormField>
                  {config.mpPublicKey && (
                    <a href={`https://link.mercadopago.com.ar/${config.mpPublicKey}`} target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <Icon name="share2" size={14} />Probar link de pago
                    </a>
                  )}
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-medium mb-1">🚀 Integración avanzada MP</p>
                    <p className="text-xs text-blue-600">Para una integración completa con la API de MercadoPago (notificaciones automáticas, webhook), podés conectar el backend de NATIVA con las credenciales de tu cuenta MP. Consultá la documentación de MP Checkout Pro.</p>
                  </div>
                </div>
              </div>
            )}

            {/* AVANZADO */}
            {activeTab === 'avanzado' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-slate-900 text-base pb-3 border-b border-gray-100">Configuración avanzada</h3>

                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <Icon name="alertCircle" size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Zona de peligro</p>
                      <p className="text-sm text-red-600 mt-1">Las siguientes acciones son irreversibles. Procedé con extrema precaución.</p>
                    </div>
                  </div>
                </div>

                <div className="border border-red-200 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-1">Reiniciar todos los datos</p>
                  <p className="text-sm text-slate-500 mb-3">Elimina todos los clientes, pedidos, facturas y configuración. Recarga los datos de ejemplo.</p>
                  <Btn
                    onClick={() => {
                      if (window.confirm('⚠️ ¿Estás SEGURO? Esto eliminará TODOS los datos de NATIVA. Esta acción NO se puede deshacer.')) {
                        DataService.resetData();
                        window.location.reload();
                      }
                    }}
                    variant="danger"
                    icon="trash"
                  >
                    Reiniciar todos los datos
                  </Btn>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-1">Exportar datos (JSON)</p>
                  <p className="text-sm text-slate-500 mb-3">Descarga todos tus datos en formato JSON para respaldo.</p>
                  <Btn
                    onClick={() => {
                      const data = {
                        clients: DataService.getClients(true),
                        orders: DataService.getOrders(),
                        zones: DataService.getZones(),
                        products: DataService.getProducts(true),
                        invoices: DataService.getInvoices(),
                        config: DataService.getConfig(),
                        exportedAt: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `nativa-backup-${DataService.today()}.json`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    variant="secondary"
                    icon="download"
                  >
                    Exportar datos
                  </Btn>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-1">Acerca de NATIVA</p>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>Versión: MVP 1.0</p>
                    <p>Almacenamiento: localStorage del navegador</p>
                    <p>Clientes: {DataService.getClients().length} · Pedidos: {DataService.getOrders().length}</p>
                    <p className="text-xs text-slate-400 mt-2">Desarrollado como MVP escalable. Podés migrar a backend Node.js + PostgreSQL para producción.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Save button (bottom) */}
          <div className="mt-4 flex justify-end">
            <Btn onClick={saveConfig} variant={saved ? 'success' : 'primary'} icon={saved ? 'check' : 'download'} size="lg">
              {saved ? '¡Cambios guardados!' : 'Guardar configuración'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsQuickList() {
  const products = DataService.getProducts(true);
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {products.map(p => (
        <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.active ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
          <span className="text-sm font-medium text-slate-800">{p.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">{DataService.formatCurrency(p.price)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {p.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
