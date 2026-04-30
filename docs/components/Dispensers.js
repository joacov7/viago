// NATIVA - Comodatos de dispenser

const DISP_TYPES = { frio: '🥶 Frío', calor: '🔥 Calor', mixto: '❄️🔥 Mixto' };
const DISP_STATUS = {
  deposito:   { label: 'En depósito',   bg: 'bg-blue-100',   text: 'text-blue-700' },
  comodato:   { label: 'En comodato',   bg: 'bg-green-100',  text: 'text-green-700' },
  reparacion: { label: 'En reparación', bg: 'bg-amber-100',  text: 'text-amber-700' },
  baja:       { label: 'Dado de baja',  bg: 'bg-gray-100',   text: 'text-gray-500' },
};

function Dispensers() {
  const [dispensers, setDispensers] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [filter, setFilter] = React.useState('todos');
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const confirm = useConfirm();

  const reload = async () => {
    const [ds, cs] = await Promise.all([DataService.getDispensers(), DataService.getClients(true)]);
    setDispensers(ds);
    setClients(cs);
  };
  React.useEffect(() => { reload(); }, []);

  const counts = {
    todos: dispensers.length,
    comodato: dispensers.filter(d => d.status === 'comodato').length,
    deposito: dispensers.filter(d => d.status === 'deposito').length,
    reparacion: dispensers.filter(d => d.status === 'reparacion').length,
  };

  const filtered = filter === 'todos' ? dispensers : dispensers.filter(d => d.status === 'filter');
  const shown = dispensers.filter(d => filter === 'todos' || d.status === filter);

  const openNew  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (d) => { setEditing(d); setShowModal(true); setDetail(null); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este dispenser?')) return;
    await DataService.deleteDispenser(id);
    reload();
    setDetail(null);
  };

  if (detail) {
    const client = clients.find(c => c.id === detail.clientId);
    const st = DISP_STATUS[detail.status] || DISP_STATUS.deposito;
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setDetail(null)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            <Icon name="chevLeft" size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{detail.serialNumber}</h2>
            <p className="text-sm text-slate-500">{detail.model} · {DISP_TYPES[detail.type] || detail.type}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Estado</p>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${st.bg} ${st.text}`}>{st.label}</span>
            {detail.deliveryDate && <p className="text-xs text-slate-400 mt-2">Entregado: {DataService.formatDate(detail.deliveryDate)}</p>}
            {detail.deposit > 0 && <p className="text-xs text-slate-400 mt-1">Depósito garantía: {DataService.formatCurrency(detail.deposit)}</p>}
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cliente asignado</p>
            {client ? (
              <div>
                <p className="font-semibold text-slate-900">{client.name}</p>
                <p className="text-xs text-slate-400 mt-1">{client.address}</p>
                {client.phone && <p className="text-xs text-slate-400">{client.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin cliente asignado</p>
            )}
          </div>
        </div>

        {detail.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm text-amber-800">{detail.notes}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Btn onClick={() => openEdit(detail)} icon="edit" variant="secondary">Editar</Btn>
          <Btn onClick={() => handleDelete(detail.id)} icon="trash" variant="danger">Eliminar</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Comodatos"
        subtitle="Dispensers entregados en préstamo"
        action={<Btn onClick={openNew} icon="plus" variant="primary">Nuevo dispenser</Btn>}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',        value: counts.todos,     color: 'text-slate-900' },
          { label: 'En comodato',  value: counts.comodato,  color: 'text-green-700' },
          { label: 'En depósito',  value: counts.deposito,  color: 'text-blue-700'  },
          { label: 'Reparación',   value: counts.reparacion,color: 'text-amber-700' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[['todos','Todos'],['comodato','En comodato'],['deposito','En depósito'],['reparacion','Reparación']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon="package" title="Sin dispensers registrados"
          description="Registrá tus equipos para llevar el control de comodatos."
          action={<Btn onClick={openNew} icon="plus" variant="primary">Agregar dispenser</Btn>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map(d => {
            const st = DISP_STATUS[d.status] || DISP_STATUS.deposito;
            const client = clients.find(c => c.id === d.clientId);
            return (
              <div key={d.id} onClick={() => setDetail(d)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{d.serialNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{d.model || '—'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>{DISP_TYPES[d.type] || d.type}</span>
                </div>
                {client && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-slate-500 truncate">👤 {client.name}</p>
                    {d.deliveryDate && <p className="text-xs text-slate-400">desde {DataService.formatDate(d.deliveryDate)}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DispenserModal
          dispenser={editing}
          clients={clients}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={() => { setShowModal(false); setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function DispenserModal({ dispenser, clients, onClose, onSave }) {
  const [form, setForm] = React.useState(() => dispenser ? { ...dispenser } : {
    serialNumber: '', model: '', type: 'mixto', status: 'deposito',
    clientId: '', deliveryDate: '', deposit: '', notes: '',
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.serialNumber.trim()) return;
    setSaving(true);
    const data = { ...form, clientId: form.clientId ? parseInt(form.clientId) : null, deposit: parseFloat(form.deposit) || 0 };
    try {
      if (dispenser) await DataService.updateDispenser(dispenser.id, data);
      else await DataService.createDispenser(data);
      onSave();
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title={dispenser ? 'Editar dispenser' : 'Nuevo dispenser'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="N° de serie" required>
            <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)}
              className={inputCls()} placeholder="SN-001" required />
          </FormField>
          <FormField label="Modelo">
            <input value={form.model || ''} onChange={e => set('model', e.target.value)}
              className={inputCls()} placeholder="FrioCal X200" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo">
            <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls()}>
              <option value="frio">🥶 Frío</option>
              <option value="calor">🔥 Calor</option>
              <option value="mixto">❄️🔥 Mixto</option>
            </select>
          </FormField>
          <FormField label="Estado">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls()}>
              <option value="deposito">En depósito</option>
              <option value="comodato">En comodato</option>
              <option value="reparacion">En reparación</option>
              <option value="baja">Dado de baja</option>
            </select>
          </FormField>
        </div>
        <FormField label="Cliente asignado">
          <select value={form.clientId || ''} onChange={e => set('clientId', e.target.value)} className={inputCls()}>
            <option value="">Sin asignar</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Fecha de entrega">
            <input type="date" value={form.deliveryDate || ''} onChange={e => set('deliveryDate', e.target.value)} className={inputCls()} />
          </FormField>
          <FormField label="Depósito garantía ($)">
            <input type="number" value={form.deposit || ''} onChange={e => set('deposit', e.target.value)}
              className={inputCls()} min="0" placeholder="0" />
          </FormField>
        </div>
        <FormField label="Notas">
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
            className={inputCls('resize-none')} rows={2} placeholder="Observaciones..." />
        </FormField>
        <div className="flex gap-3 pt-2">
          <Btn onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancelar</Btn>
          <Btn type="submit" variant="primary" disabled={saving} className="flex-1 justify-center">
            {saving ? 'Guardando...' : dispenser ? 'Guardar cambios' : 'Agregar dispenser'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
