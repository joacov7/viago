// NATIVA - Billing / Facturación module

function Billing({ navParams }) {
  const [invoices, setInvoices] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [filterStatus, setFilterStatus] = React.useState('');
  const [filterMethod, setFilterMethod] = React.useState('');
  const [filterMonth, setFilterMonth] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [showPayModal, setShowPayModal] = React.useState(null);

  const [config, setConfig] = React.useState({ paymentMethods: ['efectivo', 'transferencia', 'mercadopago'] });

  const reload = async () => {
    const [allInvoices, allClients] = await Promise.all([
      DataService.getInvoices(), DataService.getClients(true),
    ]);
    setInvoices(allInvoices.map(inv => ({ ...inv, client: allClients.find(c => c.id === inv.clientId) || {} })));
    setClients(allClients);
  };

  React.useEffect(() => {
    reload();
    DataService.getConfig().then(setConfig);
    if (navParams && (navParams.orderId || navParams.clientId)) {
      setShowModal(true);
    }
    if (navParams && navParams.invoiceId) {
      (async () => {
        const inv = await DataService.getInvoice(navParams.invoiceId);
        if (inv) { const client = await DataService.getClient(inv.clientId); setDetail({ ...inv, client: client || {} }); }
      })();
    }
  }, []);

  const filtered = invoices.filter(inv =>
    (!filterStatus || inv.paymentStatus === filterStatus) &&
    (!filterMethod || inv.paymentMethod === filterMethod) &&
    (!filterMonth || (inv.createdAt || '').startsWith(filterMonth))
  );

  const totalPaid = filtered.filter(i => i.paymentStatus === 'pagado').reduce((s, i) => s + i.total, 0);
  const totalPending = filtered.filter(i => i.paymentStatus === 'pendiente').reduce((s, i) => s + i.total, 0);

  const handleMarkPaid = async (id, method) => {
    await DataService.updateInvoice(id, { paymentStatus: 'pagado', paymentMethod: method });
    reload();
    setShowPayModal(null);
  };

  if (detail) {
    return (
      <InvoiceDetail
        invoice={detail}
        config={config}
        onBack={() => { setDetail(null); reload(); }}
        onPay={(inv) => setShowPayModal(inv)}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Facturación"
        subtitle={`${invoices.length} comprobantes`}
        action={<Btn onClick={() => setShowModal(true)} icon="plus" variant="primary">Nueva factura</Btn>}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-semibold uppercase mb-1">Cobrado (filtro)</p>
          <p className="text-2xl font-bold text-emerald-700">{DataService.formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-xs text-amber-600 font-semibold uppercase mb-1">Pendiente de cobro</p>
          <p className="text-2xl font-bold text-amber-700">{DataService.formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Total facturado</p>
          <p className="text-2xl font-bold text-blue-700">{DataService.formatCurrency(totalPaid + totalPending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls('w-40')}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
        </select>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={inputCls('w-44')}>
          <option value="">Todos los medios</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="mercadopago">MercadoPago</option>
        </select>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={inputCls('w-44')} />
        {(filterStatus || filterMethod || filterMonth) && (
          <Btn onClick={() => { setFilterStatus(''); setFilterMethod(''); setFilterMonth(''); }} variant="ghost" size="md">Limpiar</Btn>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="fileText" title="Sin comprobantes" description="Las facturas aparecerán aquí una vez generadas" action={<Btn onClick={() => setShowModal(true)} icon="plus" variant="primary">Nueva factura</Btn>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <InvoiceCard key={inv.id} invoice={inv} onDetail={() => setDetail(inv)} onPay={() => setShowPayModal(inv)} />
          ))}
        </div>
      )}

      <InvoiceFormModal
        isOpen={showModal}
        clients={clients}
        navParams={navParams}
        onClose={() => setShowModal(false)}
        onSave={async (data) => { await DataService.createInvoice(data); reload(); setShowModal(false); }}
      />

      <PayModal invoice={showPayModal} onClose={() => { setShowPayModal(null); reload(); }} onConfirm={handleMarkPaid} />
    </div>
  );
}

function InvoiceCard({ invoice, onDetail, onPay }) {
  const [config, setConfig] = React.useState({});
  React.useEffect(() => { DataService.getConfig().then(setConfig); }, []);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon name="fileText" size={18} className="text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold text-blue-600">{invoice.number}</span>
          <StatusBadge status={invoice.paymentStatus} />
          <StatusBadge status={invoice.paymentMethod} />
        </div>
        <p className="text-sm font-medium text-slate-900 truncate">{invoice.client?.name || `Cliente #${invoice.clientId}`}</p>
        <p className="text-xs text-slate-400">{DataService.formatDateTime(invoice.createdAt)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-slate-900 text-base">{DataService.formatCurrency(invoice.total)}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <button onClick={onDetail} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Ver detalle"><Icon name="eye" size={14} /></button>
          <button onClick={() => PDFService.printInvoice(invoice, invoice.client, config)} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400" title="Imprimir"><Icon name="printer" size={14} /></button>
          {invoice.paymentStatus === 'pendiente' && (
            <button onClick={onPay} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500" title="Registrar pago"><Icon name="wallet" size={14} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

function InvoiceDetail({ invoice, config, onBack, onPay }) {
  return (
    <div>
      <Btn onClick={onBack} variant="ghost" icon="arrowLeft" size="sm" className="mb-5">Volver a facturación</Btn>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Icon name="droplets" size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">{config.companyName}</h2>
                <p className="text-sm text-slate-500">{config.tagline}</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{invoice.number}</p>
            <p className="text-sm text-slate-500">{DataService.formatDateTime(invoice.createdAt)}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={invoice.paymentStatus} />
          </div>
        </div>

        {/* Client info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Cliente</p>
          <p className="font-bold text-slate-900">{invoice.client?.name}</p>
          <p className="text-sm text-slate-500">{invoice.client?.code} · {invoice.client?.address}</p>
          {invoice.client?.phone && <p className="text-sm text-slate-500">{invoice.client.phone}</p>}
        </div>

        {/* Items table */}
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
              {(invoice.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-sm text-slate-800">{item.productName}</td>
                  <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right">{DataService.formatCurrency(item.price)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{DataService.formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan="3" className="px-4 py-3 font-bold text-right">TOTAL</td>
                <td className="px-4 py-3 text-lg font-bold text-right">{DataService.formatCurrency(invoice.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Forma de pago</p>
            <p className="font-semibold text-slate-900 mt-0.5 capitalize">{invoice.paymentMethod}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-semibold">Estado</p>
            <div className="mt-0.5"><StatusBadge status={invoice.paymentStatus} /></div>
            {invoice.paidAt && <p className="text-xs text-slate-400 mt-1">{DataService.formatDateTime(invoice.paidAt)}</p>}
          </div>
        </div>

        {/* WhatsApp payment reminder */}
        {invoice.paymentStatus === 'pendiente' && invoice.client?.phone && (
          <div className="mb-4">
            <a href={WhatsAppService.paymentRequest(invoice.client, invoice)} target="_blank" rel="noopener noreferrer">
              <Btn variant="secondary" icon="messageCircle" className="w-full justify-center">Enviar recordatorio WA</Btn>
            </a>
          </div>
        )}

        <div className="flex gap-3">
          <Btn onClick={() => PDFService.printInvoice(invoice, invoice.client, config)} variant="secondary" icon="printer" className="flex-1 justify-center">Imprimir</Btn>
          {invoice.paymentStatus === 'pendiente' && (
            <Btn onClick={() => onPay(invoice)} variant="success" icon="wallet" className="flex-1 justify-center">Registrar pago</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function PayModal({ invoice, onClose, onConfirm }) {
  const [method, setMethod] = React.useState('efectivo');
  if (!invoice) return null;
  return (
    <Modal isOpen={!!invoice} onClose={onClose} title="Registrar pago" size="sm">
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-sm text-slate-600">{invoice.client?.name}</p>
          <p className="text-xl font-bold text-slate-900">{DataService.formatCurrency(invoice.total)}</p>
          <p className="text-xs text-blue-600 font-mono">{invoice.number}</p>
        </div>
        <FormField label="Forma de pago">
          <div className="grid grid-cols-3 gap-2">
            {['efectivo', 'transferencia', 'mercadopago'].map(m => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`py-2 px-1 rounded-xl text-xs font-semibold border-2 ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-600'}`}>
                {m === 'efectivo' ? '💵 Efectivo' : m === 'transferencia' ? '🏦 Transfer.' : '💳 MP'}
              </button>
            ))}
          </div>
        </FormField>
        <div className="flex gap-3 pt-2">
          <Btn onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancelar</Btn>
          <Btn onClick={() => onConfirm(invoice.id, method)} variant="success" icon="check" className="flex-1 justify-center">Confirmar</Btn>
        </div>
      </div>
    </Modal>
  );
}

function InvoiceFormModal({ isOpen, clients, navParams, onClose, onSave }) {
  const [clientId, setClientId] = React.useState('');
  const [clientSearch, setClientSearch] = React.useState('');
  const [items, setItems] = React.useState([{ productId: '', quantity: 1, price: 0, subtotal: 0, productName: '' }]);
  const [method, setMethod] = React.useState('efectivo');
  const [notes, setNotes] = React.useState('');
  const [products, setProducts] = React.useState([]);
  React.useEffect(() => { DataService.getProducts().then(setProducts); }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    if (navParams) {
      if (navParams.clientId) setClientId(navParams.clientId);
      if (navParams.items) setItems(navParams.items);
    } else {
      setClientId(''); setClientSearch(''); setItems([{ productId: '', quantity: 1, price: 0, subtotal: 0, productName: '' }]);
    }
    setMethod('efectivo'); setNotes('');
  }, [isOpen]);

  const filteredClients = clients.filter(c => { const q = clientSearch.toLowerCase(); return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q); }).slice(0, 20);
  const selectedClient = clients.find(c => c.id == clientId);
  const addItem = () => setItems(it => [...it, { productId: '', quantity: 1, price: 0, subtotal: 0, productName: '' }]);
  const removeItem = (i) => setItems(it => it.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => setItems(it => it.map((item, idx) => {
    if (idx !== i) return item;
    const u = { ...item, [field]: value };
    if (field === 'productId') { const p = products.find(p => p.id == value); if (p) { u.price = p.price; u.productName = p.name; u.subtotal = p.price * u.quantity; } }
    if (field === 'quantity' || field === 'price') u.subtotal = (parseFloat(u.price)||0) * (parseInt(u.quantity)||0);
    return u;
  }));
  const total = items.reduce((s, i) => s + (i.subtotal || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    if (!clientId) { alert('Seleccioná un cliente'); return; }
    const valid = items.filter(i => i.productId && i.quantity > 0);
    if (valid.length === 0) { alert('Agregá al menos un producto'); return; }
    onSave({ clientId, items: valid, total, paymentMethod: method, notes });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva factura" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Cliente" required>
          {selectedClient ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <p className="flex-1 text-sm font-semibold text-slate-900">{selectedClient.name} <span className="font-mono text-blue-600 text-xs">{selectedClient.code}</span></p>
              <button type="button" onClick={() => { setClientId(''); setClientSearch(''); }} className="text-blue-500 text-xs">Cambiar</button>
            </div>
          ) : (
            <div>
              <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} className={inputCls()} placeholder="Buscar cliente..." autoFocus />
              {clientSearch && (
                <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto shadow-sm">
                  {filteredClients.map(c => (
                    <button key={c.id} type="button" onClick={() => { setClientId(c.id); setClientSearch(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-medium border-b border-gray-50 last:border-0">
                      {c.name} <span className="text-xs text-blue-600 font-mono ml-2">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </FormField>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Productos <span className="text-red-500">*</span></label>
            <button type="button" onClick={addItem} className="text-xs text-blue-600 font-medium">+ Agregar</button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center p-2 bg-gray-50 rounded-xl">
                <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {DataService.formatCurrency(p.price)}</option>)}
                </select>
                <input type="number" value={item.quantity} min="1" onChange={e => updateItem(i, 'quantity', parseInt(e.target.value)||1)} className="w-14 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-slate-700 w-24 text-right">{DataService.formatCurrency(item.subtotal)}</span>
                {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 p-1"><Icon name="x" size={14}/></button>}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-2 p-3 bg-blue-50 rounded-xl">
            <span className="text-sm font-bold text-blue-800">Total: {DataService.formatCurrency(total)}</span>
          </div>
        </div>

        <FormField label="Forma de pago">
          <div className="grid grid-cols-3 gap-2">
            {['efectivo', 'transferencia', 'mercadopago'].map(m => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`py-2 rounded-xl text-xs font-semibold border-2 ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-600'}`}>
                {m === 'efectivo' ? '💵 Efectivo' : m === 'transferencia' ? '🏦 Transferencia' : '💳 MercadoPago'}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Notas"><textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputCls('resize-none')} rows="2" /></FormField>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon="plus">Generar factura</Btn>
        </div>
      </form>
    </Modal>
  );
}
