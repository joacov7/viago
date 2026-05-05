// NATIVA - Orders management module

function Orders({ onNavigate, navParams }) {
  const [orders, setOrders] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [zones, setZones] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [filterStatus, setFilterStatus] = React.useState('');
  const [filterDate, setFilterDate] = React.useState('');
  const [filterZone, setFilterZone] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [showAgenda, setShowAgenda] = React.useState(false);
  const [detail, setDetail] = React.useState(null);

  const reload = async () => {
    const [allOrders, allClients, allZones, allProducts] = await Promise.all([
      DataService.getOrders(), DataService.getClients(true),
      DataService.getZones(), DataService.getProducts(),
    ]);
    setOrders(allOrders);
    setClients(allClients);
    setZones(allZones);
    setProducts(allProducts);
  };
  React.useEffect(() => {
    reload();
    if (navParams && navParams.openNew) setShowModal(true);
  }, []);

  const enriched = orders.map(o => {
    const client = clients.find(c => c.id === o.clientId) || {};
    const zone = zones.find(z => z.id === client.zoneId) || {};
    return { ...o, client, zone };
  });

  const filtered = enriched.filter(o => {
    const q = query.toLowerCase();
    const matchQ = !q || (o.client.name || '').toLowerCase().includes(q) || (o.client.code || '').toLowerCase().includes(q);
    return matchQ
      && (!filterStatus || o.status === filterStatus)
      && (!filterDate || o.deliveryDate === filterDate)
      && (!filterZone || o.zone.id == filterZone);
  });

  const handleStatus = async (id, status) => {
    await DataService.updateOrder(id, { status });
    await reload();
    if (detail && detail.id === id) DataService.getOrder(id).then(o => setDetail(o));
  };

  const handleDelete = async (o) => {
    if (window.confirm('¿Cancelar este pedido?')) { await DataService.deleteOrder(o.id); reload(); }
  };

  const tabCounts = {
    '': enriched.length,
    pendiente: enriched.filter(o => o.status === 'pendiente').length,
    entregado: enriched.filter(o => o.status === 'entregado').length,
    cancelado: enriched.filter(o => o.status === 'cancelado').length,
  };

  if (detail) {
    const client = clients.find(c => c.id === detail.clientId) || {};
    const zone = zones.find(z => z.id === client.zoneId) || {};
    return <OrderDetail order={detail} client={client} zone={zone} products={products} onBack={() => { setDetail(null); reload(); }} onStatus={handleStatus} onNavigate={onNavigate} />;
  }

  return (
    <div>
      <PageHeader
        title="Pedidos"
        subtitle={`${orders.length} pedidos en total`}
        action={
          <div className="flex gap-2">
            <Btn onClick={() => setShowAgenda(true)} variant="secondary" icon="calendar">Agenda del mes</Btn>
            <Btn onClick={() => setShowModal(true)} icon="plus" variant="primary">Nuevo pedido</Btn>
          </div>
        }
      />

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {[['', 'Todos'], ['pendiente', 'Pendiente'], ['entregado', 'Entregado'], ['cancelado', 'Cancelado']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {lbl} <span className={`ml-1 text-xs ${filterStatus === val ? 'text-blue-600' : 'text-slate-400'}`}>({tabCounts[val] || 0})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente..." className={inputCls('pl-9')} />
        </div>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={inputCls('sm:w-44')} />
        <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className={inputCls('sm:w-40')}>
          <option value="">Todas las zonas</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        {(query || filterDate || filterZone) && (
          <Btn onClick={() => { setQuery(''); setFilterDate(''); setFilterZone(''); }} variant="ghost" size="md">Limpiar</Btn>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="package" title="No hay pedidos" description="Creá el primer pedido para comenzar" action={<Btn onClick={() => setShowModal(true)} icon="plus" variant="primary">Nuevo pedido</Btn>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus} onDelete={handleDelete} onDetail={() => setDetail(o)} onNavigate={onNavigate} />)}
        </div>
      )}

      <OrderFormModal
        isOpen={showModal}
        clients={clients}
        zones={zones}
        products={products}
        onClose={() => setShowModal(false)}
        onSave={async (data) => { await DataService.createOrder(data); reload(); setShowModal(false); }}
        preClientId={navParams && navParams.clientId}
      />
      <AgendaModal isOpen={showAgenda} clients={clients} products={products} onClose={() => setShowAgenda(false)} onCreated={() => { reload(); setShowAgenda(false); }} />
    </div>
  );
}

function OrderCard({ order, onStatus, onDelete, onDetail, onNavigate }) {
  const statusStyle = { pendiente: 'border-l-amber-500', entregado: 'border-l-emerald-500', cancelado: 'border-l-red-400' };
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${statusStyle[order.status] || ''} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">{order.client?.code || '#'+order.clientId}</span>
            <StatusBadge status={order.status} />
            {order.zone?.name && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: order.zone.color || '#6B7280' }}>{order.zone.name}</span>
            )}
          </div>
          <p className="font-semibold text-slate-900 text-sm">{order.client?.name || `Cliente #${order.clientId}`}</p>
          <p className="text-xs text-slate-400">{order.client?.address || '—'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-slate-900">{DataService.formatCurrency(order.total)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{DataService.formatDate(order.deliveryDate)}</p>
        </div>
      </div>

      {/* Items preview */}
      {(order.items || []).length > 0 && (
        <p className="text-xs text-slate-500 mb-3 truncate">
          {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 flex-wrap">
        <button onClick={onDetail} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
          <Icon name="eye" size={13} />Ver detalle
        </button>
        {order.client?.phone && (
          <a href={WhatsAppService.deliveryNotice(order.client, order)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
            <Icon name="messageCircle" size={13} />Avisar
          </a>
        )}
        <div className="ml-auto flex gap-1.5">
          {order.status === 'pendiente' && (
            <>
              <button onClick={() => onStatus(order.id, 'entregado')}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium rounded-lg">
                <Icon name="checkCircle" size={13} />Entregar
              </button>
              <button onClick={() => onDelete(order)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500">
                <Icon name="trash" size={13} />
              </button>
            </>
          )}
          {order.status === 'entregado' && (
            <Btn onClick={() => onNavigate('billing', { orderId: order.id })} variant="secondary" size="sm" icon="fileText">Facturar</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, client, zone, products, onBack, onStatus, onNavigate }) {
  const [invoice, setInvoice] = React.useState(null);
  React.useEffect(() => {
    DataService.getInvoices().then(invs => setInvoice(invs.find(i => i.orderId === order.id) || null));
  }, [order.id]);
  return (
    <div>
      <Btn onClick={onBack} variant="ghost" icon="arrowLeft" size="sm" className="mb-5">Volver a pedidos</Btn>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">Pedido #{order.id}</span>
              <StatusBadge status={order.status} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
            <p className="text-sm text-slate-500">{client.code} · {client.address}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{DataService.formatCurrency(order.total)}</p>
            <p className="text-sm text-slate-500">{DataService.formatDate(order.deliveryDate)}</p>
          </div>
        </div>

        {/* Items */}
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Producto</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Cant.</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Precio</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(order.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-sm text-slate-800">{item.productName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">{DataService.formatCurrency(item.price)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">{DataService.formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan="3" className="px-4 py-3 text-sm font-bold text-slate-900 text-right">TOTAL</td>
                <td className="px-4 py-3 text-base font-bold text-slate-900 text-right">{DataService.formatCurrency(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.notes && (
          <div className="mb-6 p-3 bg-gray-50 rounded-xl text-sm text-slate-600">
            <strong>Nota:</strong> {order.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {client.phone && <a href={WhatsAppService.orderConfirmation(client, order)} target="_blank" rel="noopener noreferrer"><Btn variant="secondary" icon="messageCircle">Confirmar WA</Btn></a>}
          {client.phone && <a href={WhatsAppService.deliveryNotice(client, order)} target="_blank" rel="noopener noreferrer"><Btn variant="secondary" icon="truck">Aviso entrega</Btn></a>}
          <Btn onClick={() => PDFService.printRemito(order, client, DataService.getConfigSync())} variant="secondary" icon="printer">Remito</Btn>
          {client.phone && order.status === 'entregado' && (
            <a href={`https://wa.me/${(client.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(PDFService.textReceipt(order, client, DataService.getConfigSync()))}`} target="_blank" rel="noopener noreferrer">
              <Btn variant="secondary" icon="messageCircle">Comprobante WA</Btn>
            </a>
          )}
          {order.status === 'pendiente' && <Btn onClick={() => { onStatus(order.id, 'entregado'); onBack(); }} variant="success" icon="checkCircle">Marcar entregado</Btn>}
          {order.status === 'entregado' && !invoice && <Btn onClick={() => onNavigate('billing', { orderId: order.id, clientId: client.id, items: order.items, total: order.total })} variant="primary" icon="fileText">Generar factura</Btn>}
          {invoice && <Btn onClick={() => onNavigate('billing', { invoiceId: invoice.id })} variant="secondary" icon="eye">Ver factura {invoice.number}</Btn>}
        </div>
      </div>
    </div>
  );
}

function OrderFormModal({ isOpen, clients, zones, products, onClose, onSave, preClientId }) {
  const [clientId, setClientId] = React.useState('');
  const [deliveryDate, setDeliveryDate] = React.useState(DataService.today());
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [clientSearch, setClientSearch] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setClientId(preClientId || '');
      setDeliveryDate(DataService.today());
      setNotes('');
      setItems([{ productId: '', quantity: 1, price: 0, subtotal: 0, productName: '' }]);
      setClientSearch('');
    }
  }, [isOpen]);

  const filteredClients = clients.filter(c => {
    const q = clientSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  }).slice(0, 20);

  const addItem = () => setItems(it => [...it, { productId: '', quantity: 1, price: 0, subtotal: 0, productName: '' }]);
  const removeItem = (i) => setItems(it => it.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    setItems(it => it.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => p.id == value);
        if (prod) { updated.price = prod.price; updated.productName = prod.name; updated.subtotal = prod.price * updated.quantity; }
      }
      if (field === 'quantity' || field === 'price') {
        updated.subtotal = (parseFloat(updated.price) || 0) * (parseInt(updated.quantity) || 0);
      }
      return updated;
    }));
  };

  const total = items.reduce((s, i) => s + (i.subtotal || 0), 0);
  const selectedClient = clients.find(c => c.id == clientId);

  const submit = (e) => {
    e.preventDefault();
    if (!clientId) { alert('Seleccioná un cliente'); return; }
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) { alert('Agregá al menos un producto'); return; }
    onSave({ clientId, deliveryDate, notes, items: validItems, total });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo pedido" size="lg">
      <form onSubmit={submit} className="space-y-5">
        {/* Client selection */}
        <FormField label="Cliente" required>
          {selectedClient ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{selectedClient.name}</p>
                <p className="text-xs text-slate-500">{selectedClient.code} · {selectedClient.address}</p>
              </div>
              <button type="button" onClick={() => { setClientId(''); setClientSearch(''); }} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Cambiar</button>
            </div>
          ) : (
            <div>
              <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} className={inputCls()} placeholder="Buscar cliente por nombre o código..." autoFocus />
              {clientSearch && (
                <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-sm">
                  {filteredClients.length === 0 ? (
                    <p className="p-3 text-sm text-slate-400">Sin resultados</p>
                  ) : filteredClients.map(c => (
                    <button
                      key={c.id} type="button"
                      onClick={() => { setClientId(c.id); setClientSearch(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm font-medium text-slate-900">{c.name}</span>
                      <span className="ml-2 text-xs text-blue-600 font-mono">{c.code}</span>
                      {c.address && <p className="text-xs text-slate-400">{c.address}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </FormField>

        <FormField label="Fecha de entrega" required>
          <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={inputCls()} required />
        </FormField>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Productos <span className="text-red-500">*</span></label>
            <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <Icon name="plus" size={12} />Agregar producto
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center p-2 bg-gray-50 rounded-xl">
                <select
                  value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {DataService.formatCurrency(p.price)}</option>)}
                </select>
                <input
                  type="number" value={item.quantity} min="1" onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-700 w-24 text-right">{DataService.formatCurrency(item.subtotal)}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-500"><Icon name="x" size={14} /></button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3 p-3 bg-blue-50 rounded-xl">
            <span className="text-sm font-bold text-blue-800">Total: {DataService.formatCurrency(total)}</span>
          </div>
        </div>

        <FormField label="Notas">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputCls('resize-none')} rows="2" placeholder="Notas adicionales del pedido..." />
        </FormField>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon="plus">Crear pedido</Btn>
        </div>
      </form>
    </Modal>
  );
}

function AgendaModal({ isOpen, clients, products, onClose, onCreated }) {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [schedule, setSchedule] = React.useState([]);
  const [existing, setExisting] = React.useState([]);
  const [creating, setCreating] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);

  const DAY_NUM = { domingo:0, lunes:1, martes:2, 'miércoles':3, jueves:4, viernes:5, sábado:6 };
  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const generate = async () => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const pad = n => String(n).padStart(2, '0');
    const existingOrders = await DataService.getOrders();
    const existingSet = new Set(existingOrders.filter(o => o.deliveryDate && o.deliveryDate.startsWith(`${year}-${pad(month)}`)).map(o => `${o.clientId}-${o.deliveryDate}`));
    setExisting(existingSet);

    const sched = [];
    for (const client of clients) {
      if (!client.deliveryDay || !client.active) continue;
      const targetDay = DAY_NUM[client.deliveryDay.toLowerCase()];
      if (targetDay === undefined) continue;
      const dates = [];
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month - 1, d).getDay() === targetDay)
          dates.push(`${year}-${pad(month)}-${pad(d)}`);
      }
      let deliveryDates = [];
      if (client.frequency === 'semanal') deliveryDates = dates;
      else if (client.frequency === 'quincenal') deliveryDates = dates.filter((_,i) => i % 2 === 0);
      else if (client.frequency === 'mensual') deliveryDates = dates.slice(0, 1);
      else if (client.frequency === 'diario') {
        for (let d = 1; d <= daysInMonth; d++) deliveryDates.push(`${year}-${pad(month)}-${pad(d)}`);
      } else deliveryDates = dates;

      for (const date of deliveryDates) {
        const key = `${client.id}-${date}`;
        sched.push({ clientId: client.id, clientName: client.name, date, key, isDuplicate: existingSet.has(key) });
      }
    }
    setSchedule(sched.sort((a, b) => a.date.localeCompare(b.date)));
    setGenerated(true);
  };

  const createAll = async () => {
    const toCreate = schedule.filter(s => !s.isDuplicate);
    if (!toCreate.length) { alert('No hay pedidos nuevos para crear.'); return; }
    setCreating(true);
    try {
      for (const s of toCreate) {
        const clientAbono = (clients.find(c => c.id === s.clientId) || {}).abono || [];
        const items = clientAbono
          .filter(a => a.productId)
          .map(a => ({ productId: a.productId, productName: a.productName, quantity: a.quantity, price: a.price, subtotal: (a.price || 0) * (a.quantity || 1) }));
        const total = items.reduce((sum, i) => sum + i.subtotal, 0);
        await DataService.createOrder({ clientId: s.clientId, deliveryDate: s.date, items, total, status: 'pendiente', notes: 'Generado automáticamente' });
      }
      onCreated();
    } catch (err) { alert('Error: ' + err.message); }
    setCreating(false);
  };

  const newCount = schedule.filter(s => !s.isDuplicate).length;
  const dupCount = schedule.filter(s => s.isDuplicate).length;

  const byDate = schedule.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar agenda del mes" size="lg">
      <div className="space-y-4">
        <div className="flex gap-3">
          <FormField label="Mes" className="flex-1">
            <select value={month} onChange={e => { setMonth(Number(e.target.value)); setGenerated(false); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MONTH_NAMES.map((n, i) => <option key={i} value={i+1}>{n}</option>)}
            </select>
          </FormField>
          <FormField label="Año" className="flex-1">
            <select value={year} onChange={e => { setYear(Number(e.target.value)); setGenerated(false); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </FormField>
          <div className="flex items-end">
            <Btn onClick={generate} variant="secondary" icon="search">Previsualizar</Btn>
          </div>
        </div>

        {generated && (
          <>
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-blue-50 rounded-xl text-center">
                <p className="text-xl font-bold text-blue-700">{newCount}</p>
                <p className="text-xs text-blue-600">pedidos a crear</p>
              </div>
              <div className="flex-1 p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xl font-bold text-slate-400">{dupCount}</p>
                <p className="text-xs text-slate-400">ya existentes</p>
              </div>
              <div className="flex-1 p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xl font-bold text-slate-700">{schedule.length}</p>
                <p className="text-xs text-slate-500">total entregas</p>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3">
              {Object.entries(byDate).map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-slate-500 mb-1 sticky top-0 bg-white py-1">{DataService.formatDate(date)}</p>
                  <div className="space-y-1">
                    {items.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${s.isDuplicate ? 'bg-gray-50 text-slate-400 line-through' : 'bg-blue-50 text-slate-700'}`}>
                        <Icon name={s.isDuplicate ? 'check' : 'package'} size={12} className={s.isDuplicate ? 'text-slate-400' : 'text-blue-600'} />
                        {s.clientName}
                        {s.isDuplicate && <span className="text-xs ml-auto">ya existe</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Btn onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancelar</Btn>
              <Btn onClick={createAll} disabled={creating || newCount === 0} variant="primary" icon="plus" className="flex-1 justify-center">
                {creating ? 'Creando pedidos...' : `Crear ${newCount} pedidos`}
              </Btn>
            </div>
          </>
        )}

        {!generated && (
          <p className="text-sm text-slate-400 text-center py-4">Seleccioná un mes y hacé clic en "Previsualizar" para ver los pedidos que se generarán basados en la frecuencia de cada cliente.</p>
        )}
      </div>
    </Modal>
  );
}
