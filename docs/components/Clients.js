// NATIVA - Clients CRM module

function Clients({ onNavigate, navParams }) {
  const [clients, setClients] = React.useState([]);
  const [zones, setZones] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [filterZone, setFilterZone] = React.useState('');
  const [filterType, setFilterType] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [detail, setDetail] = React.useState(null);

  const reload = async () => {
    const [c, z] = await Promise.all([DataService.getClients(), DataService.getZones()]);
    setClients(c); setZones(z);
  };
  React.useEffect(() => {
    reload();
    if (navParams && navParams.clientId) {
      DataService.getClient(navParams.clientId).then(c => { if (c) setDetail(c); });
    }
  }, []);

  const filtered = clients.filter(c => {
    const q = query.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.address || '').toLowerCase().includes(q);
    return matchQ && (!filterZone || c.zoneId == filterZone) && (!filterType || c.type === filterType);
  });

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setShowModal(true); };
  const openDetail = (c) => setDetail(c);

  const handleSave = async (data) => {
    try {
      if (editing) await DataService.updateClient(editing.id, data);
      else await DataService.createClient(data);
      await reload();
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };
  const handleDelete = async (c) => {
    if (window.confirm(`¿Desactivar a ${c.name}? Sus pedidos quedarán en el historial.`)) {
      await DataService.deleteClient(c.id); reload();
    }
  };

  if (detail) {
    return <ClientDetail client={detail} zones={zones} onBack={() => { setDetail(null); reload(); }} onEdit={(c) => { setDetail(null); openEdit(c); }} onNavigate={onNavigate} />;
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes activos`}
        action={<Btn onClick={openNew} icon="plus" variant="primary">Nuevo cliente</Btn>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, código, teléfono..."
            className={inputCls('pl-9')}
          />
        </div>
        <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className={inputCls('sm:w-44')}>
          <option value="">Todas las zonas</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={inputCls('sm:w-36')}>
          <option value="">Todos los tipos</option>
          <option value="hogar">Hogar</option>
          <option value="comercio">Comercio</option>
        </select>
      </div>

      {/* Results count */}
      {(query || filterZone || filterType) && (
        <p className="text-sm text-slate-500 mb-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="users"
          title="No hay clientes"
          description={query ? 'Intentá con otro término de búsqueda' : 'Agregá el primer cliente para comenzar'}
          action={!query && <Btn onClick={openNew} icon="plus" variant="primary">Nuevo cliente</Btn>}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Código', 'Nombre', 'Zona', 'Tipo', 'Frecuencia', 'Día', 'Puntos', 'Teléfono', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide bg-gray-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => {
                  const zone = zones.find(z => z.id === c.zoneId);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{c.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(c)} className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors text-left">{c.name}</button>
                        {c.address && <p className="text-xs text-slate-400 truncate max-w-[180px]">{c.address}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {zone ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: zone.color }}>{zone.name}</span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.type} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.frequency} /></td>
                      <td className="px-4 py-3"><span className="text-xs text-slate-600 capitalize">{c.deliveryDay || '—'}</span></td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-amber-600">{c.points || 0} pts</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="text-xs text-slate-600 hover:text-blue-600">{c.phone}</a>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {c.phone && (
                            <a href={WhatsAppService.generic(c)} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="WhatsApp">
                              <Icon name="messageCircle" size={15} />
                            </a>
                          )}
                          <button onClick={() => openDetail(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Ver detalle">
                            <Icon name="eye" size={15} />
                          </button>
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-500 transition-colors" title="Editar">
                            <Icon name="edit" size={15} />
                          </button>
                          <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Desactivar">
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map(c => {
              const zone = zones.find(z => z.id === c.zoneId);
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{c.code}</span>
                        <StatusBadge status={c.type} />
                      </div>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      {c.address && <p className="text-xs text-slate-400 mt-0.5">{c.address}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-semibold text-amber-600">{c.points || 0} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {zone && <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: zone.color }}>{zone.name}</span>}
                    <StatusBadge status={c.frequency} />
                    {c.deliveryDay && <span className="text-xs text-slate-500 capitalize">{c.deliveryDay}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {c.phone && <a href={`tel:${c.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-slate-600 text-sm font-medium"><Icon name="phone" size={14}/>Llamar</a>}
                    {c.phone && <a href={WhatsAppService.generic(c)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium"><Icon name="messageCircle" size={14}/>WhatsApp</a>}
                    <button onClick={() => openDetail(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium"><Icon name="eye" size={14}/>Ver</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={showModal}
        client={editing}
        zones={zones}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

function ClientFormModal({ isOpen, client, zones, onClose, onSave }) {
  const [form, setForm] = React.useState({});
  React.useEffect(() => {
    setForm(client ? { ...client } : { name: '', address: '', city: '', phone: '', email: '', zoneId: '', type: 'hogar', frequency: 'semanal', deliveryDay: '', notes: '', referralCode: '' });
  }, [client, isOpen]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const handleReferral = async () => {
    const ref = await DataService.getClientByReferral(form.referralCode);
    if (ref) { alert(`Código válido. Referido por: ${ref.name} (${ref.code})`); set('referredBy', ref.id); }
    else alert('Código de referido no encontrado');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('El nombre es obligatorio'); return; }
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? `Editar: ${client.name}` : 'Nuevo cliente'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nombre completo" required>
            <input value={form.name || ''} onChange={e => set('name', e.target.value)} className={inputCls()} placeholder="Juan García" required />
          </FormField>
          <FormField label="Teléfono">
            <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} className={inputCls()} placeholder="1123456789" />
          </FormField>
          <FormField label="Dirección" >
            <input value={form.address || ''} onChange={e => set('address', e.target.value)} className={inputCls()} placeholder="Av. San Martín 123" />
          </FormField>
          <FormField label="Ciudad / Localidad" hint="Dejá vacío para usar la ciudad de configuración">
            <input value={form.city || ''} onChange={e => set('city', e.target.value)} className={inputCls()} placeholder="Ej: Villa María, Córdoba..." />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} className={inputCls()} placeholder="juan@mail.com" />
          </FormField>
          <FormField label="Zona">
            <select value={form.zoneId || ''} onChange={e => set('zoneId', e.target.value)} className={inputCls()}>
              <option value="">Sin zona asignada</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </FormField>
          <FormField label="Día de reparto">
            <select value={form.deliveryDay || ''} onChange={e => set('deliveryDay', e.target.value)} className={inputCls()}>
              <option value="">Sin día asignado</option>
              {days.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
            </select>
          </FormField>
          <FormField label="Tipo de cliente">
            <select value={form.type || 'hogar'} onChange={e => set('type', e.target.value)} className={inputCls()}>
              <option value="hogar">Hogar</option>
              <option value="comercio">Comercio</option>
            </select>
          </FormField>
          <FormField label="Frecuencia">
            <select value={form.frequency || 'semanal'} onChange={e => set('frequency', e.target.value)} className={inputCls()}>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="ocasional">Ocasional</option>
            </select>
          </FormField>
        </div>

        {!client && (
          <FormField label="Código de referido (opcional)" hint="Ingresá el código si el cliente fue referido por otro">
            <div className="flex gap-2">
              <input value={form.referralCode || ''} onChange={e => set('referralCode', e.target.value)} className={inputCls('flex-1')} placeholder="001-REF" />
              {form.referralCode && <button type="button" onClick={handleReferral} className="px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100">Verificar</button>}
            </div>
          </FormField>
        )}

        <FormField label="Notas internas">
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className={inputCls('resize-none')} rows="2" placeholder="Información adicional del cliente..." />
        </FormField>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon={client ? 'check' : 'plus'}>{client ? 'Guardar cambios' : 'Crear cliente'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function ClientDetail({ client, zones, onBack, onEdit, onNavigate }) {
  const [orders, setOrders] = React.useState([]);
  const [invoices, setInvoices] = React.useState([]);
  const [pointsHistory, setPointsHistory] = React.useState([]);
  const [referrals, setReferrals] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('pedidos');

  React.useEffect(() => {
    (async () => {
      const [allOrders, allClients, allInvoices, history] = await Promise.all([
        DataService.getClientOrders(client.id),
        DataService.getClients(true),
        DataService.getClientInvoices(client.id),
        DataService.getPointsHistory(client.id),
      ]);
      setOrders(allOrders);
      setInvoices(allInvoices);
      setPointsHistory(history);
      setReferrals(allClients.filter(c => c.referredBy === client.id));
    })();
  }, [client.id]);

  const [config, setConfig] = React.useState({ pointsForReward: 100 });
  React.useEffect(() => { DataService.getConfig().then(setConfig); }, []);
  const zone = zones.find(z => z.id === client.zoneId);
  const totalSpent = invoices.filter(i => i.paymentStatus === 'pagado').reduce((s, i) => s + i.total, 0);
  const pointsNeeded = config.pointsForReward;

  const tabs = [
    { id: 'pedidos', label: `Pedidos (${orders.length})` },
    { id: 'facturas', label: `Facturas (${invoices.length})` },
    { id: 'puntos', label: `Puntos (${pointsHistory.length})` },
    { id: 'referidos', label: `Referidos (${referrals.length})` },
  ];

  return (
    <div>
      {/* Back */}
      <div className="mb-5">
        <Btn onClick={onBack} variant="ghost" icon="arrowLeft" size="sm">Volver a clientes</Btn>
      </div>

      {/* Client card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ background: zone ? zone.color : '#2563EB' }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
                <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{client.code}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={client.type} />
                <StatusBadge status={client.frequency} />
                {zone && <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: zone.color }}>{zone.name}</span>}
                {client.deliveryDay && <span className="text-xs text-slate-500 capitalize">{client.deliveryDay}</span>}
              </div>
              {client.address && <p className="text-sm text-slate-500 mt-2"><Icon name="mapPin" size={12} className="inline mr-1"/>{client.address}{client.city ? `, ${client.city}` : ''}</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            {client.phone && <a href={WhatsAppService.generic(client)} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors" title="WhatsApp"><Icon name="messageCircle" size={18} /></a>}
            {client.phone && <a href={`tel:${client.phone}`} className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-600 transition-colors" title="Llamar"><Icon name="phone" size={18} /></a>}
            <button onClick={() => onEdit(client)} className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-600 transition-colors" title="Editar"><Icon name="edit" size={18} /></button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Pedidos totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{DataService.formatCurrency(totalSpent)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total gastado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{client.points || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Puntos ({pointsNeeded} = premio)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-600">{referrals.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Referidos</p>
          </div>
        </div>

        {/* Referral code */}
        <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
          <Icon name="share2" size={14} className="text-blue-500 flex-shrink-0" />
          <span className="text-xs text-blue-700">Código de referido: </span>
          <code className="text-xs font-bold text-blue-800">{client.referralCode}</code>
          <button onClick={() => { navigator.clipboard.writeText(client.referralCode); }} className="ml-auto p-1 hover:bg-blue-100 rounded text-blue-500" title="Copiar">
            <Icon name="copy" size={12} />
          </button>
        </div>

        {/* Portal access */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-3">Acceso del cliente al portal</p>
          <ClientAccessBtn client={client} />
        </div>
      </div>

      <BalanceCard client={client} />

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === t.id ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'pedidos' && (
            orders.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Sin pedidos registrados</p> :
            <div className="space-y-3">
              {orders.slice().reverse().map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{DataService.formatDate(o.deliveryDate)}</p>
                    <p className="text-xs text-slate-400">{(o.items || []).map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{DataService.formatCurrency(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'facturas' && (
            invoices.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Sin facturas registradas</p> :
            <div className="space-y-3">
              {invoices.slice().reverse().map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{inv.number}</p>
                    <p className="text-xs text-slate-400">{DataService.formatDateTime(inv.createdAt)}</p>
                    <StatusBadge status={inv.paymentMethod} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{DataService.formatCurrency(inv.total)}</p>
                    <StatusBadge status={inv.paymentStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'puntos' && (
            <div>
              <div className="mb-4 p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium text-amber-800">Saldo actual</span>
                <span className="text-xl font-bold text-amber-600">{client.points || 0} pts</span>
              </div>
              {pointsHistory.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Sin historial de puntos</p> :
              <div className="space-y-2">
                {pointsHistory.slice().reverse().map(h => (
                  <div key={h.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <span className="text-slate-700">{h.description}</span>
                      <p className="text-xs text-slate-400">{DataService.formatDateTime(h.createdAt)}</p>
                    </div>
                    <span className={`font-bold ${h.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {h.points > 0 ? '+' : ''}{h.points}
                    </span>
                  </div>
                ))}
              </div>}
            </div>
          )}

          {activeTab === 'referidos' && (
            referrals.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Sin referidos registrados</p> :
            <div className="space-y-3">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-blue-600 font-mono">{r.code}</p>
                  </div>
                  <p className="text-xs text-slate-400">{DataService.formatDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BalanceCard({ client }) {
  const [balance, setBalance] = React.useState(client.balance || 0);
  const [movements, setMovements] = React.useState([]);
  const [mode, setMode] = React.useState(null);
  const [amount, setAmount] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    DataService.getClientBalanceMovements(client.id).then(setMovements).catch(() => {});
  }, [client.id]);

  const adjust = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { alert('Ingresá un monto válido'); return; }
    setSaving(true);
    try {
      const newBal = await DataService.adjustClientBalance(client.id, mode === 'charge' ? amt : -amt, desc || (mode === 'charge' ? 'Cargo manual' : 'Pago recibido'));
      setBalance(newBal);
      const newAmt = mode === 'charge' ? amt : -amt;
      setMovements(m => [{ amount: newAmt, description: desc || (mode === 'charge' ? 'Cargo manual' : 'Pago recibido'), createdAt: new Date().toISOString() }, ...m]);
      setMode(null); setAmount(''); setDesc('');
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Cuenta corriente</p>
          <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {DataService.formatCurrency(Math.abs(balance))}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{balance > 0 ? 'Debe' : balance < 0 ? 'A favor del cliente' : 'Sin saldo pendiente'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode(mode === 'charge' ? null : 'charge')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">+ Cargo</button>
          <button onClick={() => setMode(mode === 'payment' ? null : 'payment')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">− Pago</button>
        </div>
      </div>

      {mode && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 mb-3">
          <p className="text-xs font-semibold text-slate-700 mb-2">{mode === 'charge' ? 'Registrar cargo' : 'Registrar pago'}</p>
          <div className="flex gap-2 mb-2">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monto $"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setMode(null); setAmount(''); setDesc(''); }} className="flex-1 py-2 text-xs rounded-lg bg-gray-200 text-slate-600 hover:bg-gray-300">Cancelar</button>
            <button onClick={adjust} disabled={saving} className={`flex-1 py-2 text-xs rounded-lg font-medium text-white disabled:opacity-50 ${mode === 'charge' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {saving ? 'Guardando...' : mode === 'charge' ? 'Cargar deuda' : 'Registrar pago'}
            </button>
          </div>
        </div>
      )}

      {movements.length > 0 && (
        <div className="space-y-1 border-t border-gray-100 pt-3">
          {movements.slice(0, 4).map((m, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-500 truncate">{m.description}</span>
              <span className={`font-semibold flex-shrink-0 ml-3 ${m.amount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {m.amount > 0 ? '+' : ''}{DataService.formatCurrency(m.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientAccessBtn({ client }) {
  const [loading, setLoading] = React.useState(false);
  const [token, setToken] = React.useState(client.accessToken || null);

  const getToken = async () => {
    if (token) return token;
    const t = await DataService.regenerateClientToken(client.id);
    setToken(t);
    return t;
  };

  const sendAccess = async () => {
    if (!client.phone) { alert('El cliente no tiene teléfono registrado'); return; }
    setLoading(true);
    const t = await getToken();
    const url = DataService.clientPortalUrl(t);
    const msg = `¡Hola ${client.name}! 👋\n\nAcá tenés tu acceso al portal de clientes de *NATIVA* 💧\n\nPodés ver tus pedidos, facturas y puntos desde este link:\n${url}\n\n¡Guardalo para usarlo cuando quieras!`;
    const wa = `https://wa.me/${(client.phone).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank');
    setLoading(false);
  };

  const copyLink = async () => {
    setLoading(true);
    const t = await getToken();
    const url = DataService.clientPortalUrl(t);
    navigator.clipboard.writeText(url);
    alert('Link copiado al portapapeles');
    setLoading(false);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={sendAccess} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
        <Icon name="messageCircle" size={16} />
        {loading ? 'Generando...' : 'Enviar por WhatsApp'}
      </button>
      <button onClick={copyLink} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors disabled:opacity-50">
        <Icon name="copy" size={16} />
        Copiar link
      </button>
    </div>
  );
}
