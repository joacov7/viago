// NATIVA - Configuration / Settings module

function Config({ onConfigChange }) {
  const [config, setConfig] = React.useState({});
  const [activeTab, setActiveTab] = React.useState('empresa');
  const [saved, setSaved] = React.useState(false);

  const [stats, setStats] = React.useState({ clients: 0, orders: 0 });
  React.useEffect(() => {
    (async () => {
      const [cfg, prods, clients, orders] = await Promise.all([
        DataService.getConfig(), DataService.getProducts(),
        DataService.getClients(), DataService.getOrders(),
      ]);
      setConfig({ ...cfg, _products: prods });
      setStats({ clients: clients.length, orders: orders.length });
    })();
  }, []);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const saveConfig = async () => {
    try {
      await DataService.saveConfig(config);
      if (onConfigChange) onConfigChange(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
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
                      {(config._products || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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

                {/* REFERIDOS */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Sistema de referidos</h4>
                      <p className="text-xs text-slate-400 mt-0.5">El cliente refiere un amigo; al primer pago ambos reciben crédito en cuenta corriente.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!config.referralsEnabled}
                        onChange={e => set('referralsEnabled', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">{config.referralsEnabled ? 'Activo' : 'Inactivo'}</span>
                    </label>
                  </div>
                  {config.referralsEnabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Premio al referidor ($)" hint="Crédito en cuenta corriente que recibe quien trajo el cliente">
                          <input type="number" value={config.referralReferrerReward || 500}
                            onChange={e => set('referralReferrerReward', parseFloat(e.target.value))}
                            className={inputCls()} min="0" step="50" />
                        </FormField>
                        <FormField label="Descuento al referido (%)" hint="% del total de su primera factura que se acredita en su cuenta">
                          <input type="number" value={config.referralReferredDiscount || 10}
                            onChange={e => set('referralReferredDiscount', parseFloat(e.target.value))}
                            className={inputCls()} min="0" max="100" />
                        </FormField>
                      </div>
                      <FormField label="Texto del banner en la app del cliente" hint="Frase motivacional que aparece en la sección Referidos">
                        <input type="text" value={config.referralMessage || ''}
                          onChange={e => set('referralMessage', e.target.value)}
                          className={inputCls()} placeholder="Referí a un amigo y ambos ganan crédito en su cuenta." />
                      </FormField>
                      <FormField label="Mensaje de WhatsApp" hint="Plantilla editable que el cliente puede personalizar antes de compartir. Usá {codigo}, {empresa}, {telefono}, {nombre}.">
                        <textarea rows={5} value={config.referralShareMessage || ''}
                          onChange={e => set('referralShareMessage', e.target.value)}
                          className={inputCls('resize-none leading-relaxed')}
                          placeholder={`Hola! Te recomiendo el agua de {empresa} 💧\nMe tienen re bien surtido. Llamalos al {telefono} y mencioná mi código *{codigo}* para que los dos ganemos crédito 🎁`} />
                        <p className="text-xs text-slate-400 mt-1">Variables: <code>{'{link}'}</code> · <code>{'{empresa}'}</code> · <code>{'{telefono}'}</code> · <code>{'{codigo}'}</code> · <code>{'{nombre}'}</code></p>
                      </FormField>
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-sm text-green-800">
                        <strong>Ejemplo:</strong> Juan refiere a María. María paga su primera factura de $3.000.
                        María recibe <strong>${((config.referralReferredDiscount || 10) / 100 * 3000).toFixed(0)} de crédito</strong>.
                        Juan recibe <strong>${config.referralReferrerReward || 500} de crédito</strong> en su cuenta corriente.
                      </div>
                    </div>
                  )}
                </div>

                {/* TIENDA & CANJE */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Tienda & Canje</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Permite al cliente comprar productos con dinero, puntos o una combinación de ambos.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!config.storeEnabled}
                        onChange={e => set('storeEnabled', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">{config.storeEnabled ? 'Activo' : 'Inactivo'}</span>
                    </label>
                  </div>
                  {config.storeEnabled && (
                    <div className="space-y-4">
                      <FormField label="Conversión de puntos ($ por punto)" hint="Cuántos pesos vale 1 punto. Ej: 1 = $1 por punto, 0.5 = $0,50 por punto">
                        <input type="number" value={config.pointsConversionRate || 1}
                          onChange={e => set('pointsConversionRate', parseFloat(e.target.value) || 1)}
                          className={inputCls()} min="0.01" step="0.25" />
                      </FormField>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-800">
                        <strong>Ejemplo:</strong> Con tasa {config.pointsConversionRate || 1} — un cliente con 200 puntos puede descontar <strong>${((config.pointsConversionRate || 1) * 200).toFixed(0)}</strong> de su compra,
                        o canjear un producto de ${(200 * (config.pointsConversionRate || 1)).toFixed(0)} enteramente con puntos.
                      </div>
                    </div>
                  )}
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
                  <FormField label="Access Token MP" hint="Tu Access Token de producción de MercadoPago (empieza con APP_USR-...). Guardalo en Configuración para generar links de pago automáticos.">
                    <input type="password" value={config.mpAccessToken || ''} onChange={e => set('mpAccessToken', e.target.value)} className={inputCls()} placeholder="APP_USR-..." />
                  </FormField>
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 font-medium mb-1">¿Dónde conseguirlo?</p>
                    <p className="text-xs text-blue-600">Entrá a mercadopago.com.ar → Tu negocio → Configuración → Credenciales → <strong>Access Token de producción</strong></p>
                  </div>
                </div>
              </div>
            )}

            {/* AVANZADO */}
            {activeTab === 'avanzado' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-slate-900 text-base pb-3 border-b border-gray-100">Configuración avanzada</h3>

                {/* Driver PIN */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-1">App del repartidor</p>
                  <p className="text-sm text-slate-500 mb-4">PIN de 4 dígitos para acceder a la app instalable del repartidor.</p>
                  <div className="flex items-end gap-4 mb-4">
                    <FormField label="PIN (4 dígitos)" className="mb-0">
                      <input
                        type="password"
                        inputMode="numeric"
                        value={config.driverPin || ''}
                        onChange={e => set('driverPin', e.target.value.replace(/\D/g,'').slice(0,4))}
                        className={inputCls('w-32')}
                        placeholder="0000"
                        maxLength="4"
                      />
                    </FormField>
                  </div>
                  {(() => {
                    const driverUrl = window.location.href.split('?')[0].replace(/index\.html$/, '').replace(/\/$/, '') + '/repartidor.html';
                    const waNum = (config.whatsappNumber || config.phone || '').replace(/\D/g, '');
                    const waText = encodeURIComponent(`Acá está tu app de reparto 📦\n${driverUrl}\n\nPIN: ${config.driverPin || '0000'}`);
                    return (
                      <div className="flex flex-wrap gap-3">
                        <a href={driverUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors">
                          <Icon name="truck" size={15} />Abrir app del repartidor
                        </a>
                        <a href={`https://wa.me/${waNum}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors">
                          <Icon name="messageCircle" size={15} />Enviar link al repartidor
                        </a>
                        <button onClick={() => navigator.clipboard.writeText(driverUrl)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-600 text-sm font-medium transition-colors">
                          <Icon name="copy" size={15} />Copiar link
                        </button>
                      </div>
                    );
                  })()}
                </div>

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
                      if (window.confirm('⚠️ ¿Estás SEGURO? Esto eliminará TODOS los datos. Esta acción NO se puede deshacer.')) {
                        alert('Para reiniciar los datos, eliminá las tablas desde el panel de Supabase y volvé a crear el esquema.');
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
                    onClick={async () => {
                      const [clients, orders, zones, products, invoices, cfg] = await Promise.all([
                        DataService.getClients(true), DataService.getOrders(),
                        DataService.getZones(), DataService.getProducts(true),
                        DataService.getInvoices(), DataService.getConfig(),
                      ]);
                      const data = { clients, orders, zones, products, invoices, config: cfg, exportedAt: new Date().toISOString() };
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
                    <p>Versión: 2.0 — Supabase</p>
                    <p>Almacenamiento: Supabase (PostgreSQL)</p>
                    <p>Clientes: {stats.clients} · Pedidos: {stats.orders}</p>
                    <p className="text-xs text-slate-400 mt-2">Sistema conectado a base de datos en la nube.</p>
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
  const [products, setProducts] = React.useState([]);
  React.useEffect(() => { DataService.getProducts(true).then(setProducts); }, []);
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
