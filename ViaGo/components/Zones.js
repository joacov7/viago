// NATIVA - Zones management module

function Zones() {
  const [zones, setZones] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  const reload = async () => {
    const [z, c] = await Promise.all([DataService.getZones(), DataService.getClients()]);
    setZones(z); setClients(c);
  };
  React.useEffect(() => { reload(); }, []);

  const handleSave = async (data) => {
    if (editing) await DataService.updateZone(editing.id, data);
    else await DataService.createZone(data);
    reload(); setShowModal(false); setEditing(null);
  };
  const handleDelete = async (z) => {
    const count = clients.filter(c => c.zoneId === z.id).length;
    if (count > 0 && !window.confirm(`Esta zona tiene ${count} clientes asignados. ¿Eliminarla de todas formas?`)) return;
    await DataService.deleteZone(z.id); reload();
  };

  return (
    <div>
      <PageHeader
        title="Zonas de reparto"
        subtitle={`${zones.length} zonas configuradas`}
        action={<Btn onClick={() => { setEditing(null); setShowModal(true); }} icon="plus" variant="primary">Nueva zona</Btn>}
      />

      {zones.length === 0 ? (
        <EmptyState icon="mapPin" title="Sin zonas" description="Creá zonas para organizar el reparto por sectores" action={<Btn onClick={() => setShowModal(true)} icon="plus" variant="primary">Nueva zona</Btn>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(z => {
            const zClients = clients.filter(c => c.zoneId === z.id);
            return (
              <div key={z.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Color header */}
                <div className="h-2 w-full" style={{ background: z.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: z.color }}>
                        <Icon name="mapPin" size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{z.name}</h3>
                        <p className="text-xs text-slate-400">{zClients.length} cliente{zClients.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(z); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-slate-600">
                        <Icon name="edit" size={15} />
                      </button>
                      <button onClick={() => handleDelete(z)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Delivery days */}
                  {z.deliveryDays && z.deliveryDays.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Días de reparto</p>
                      <div className="flex flex-wrap gap-1.5">
                        {z.deliveryDays.map(d => (
                          <span key={d} className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ background: z.color + '20', color: z.color }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clients list preview */}
                  {zClients.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Clientes asignados</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {zClients.slice(0, 6).map(c => (
                          <div key={c.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 font-medium truncate">{c.name}</span>
                            <span className="text-blue-600 font-mono ml-2 flex-shrink-0">{c.code}</span>
                          </div>
                        ))}
                        {zClients.length > 6 && (
                          <p className="text-xs text-slate-400">+{zClients.length - 6} más</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ZoneFormModal isOpen={showModal} zone={editing} onClose={() => { setShowModal(false); setEditing(null); }} onSave={handleSave} />
    </div>
  );
}

function ZoneFormModal({ isOpen, zone, onClose, onSave }) {
  const [form, setForm] = React.useState({});
  const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const presetColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4', '#84CC16'];

  React.useEffect(() => {
    setForm(zone ? { ...zone } : { name: '', color: '#3B82F6', deliveryDays: [] });
  }, [zone, isOpen]);

  const toggleDay = (d) => setForm(f => ({
    ...f, deliveryDays: f.deliveryDays.includes(d) ? f.deliveryDays.filter(x => x !== d) : [...f.deliveryDays, d]
  }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('El nombre de zona es obligatorio'); return; }
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={zone ? `Editar zona: ${zone.name}` : 'Nueva zona'} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Nombre de zona" required>
          <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls()} placeholder="Ej: Centro, Barrio Norte..." required />
        </FormField>

        <FormField label="Color identificador">
          <div className="flex flex-wrap gap-2 mb-2">
            {presetColors.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Personalizar:</span>
            <input type="color" value={form.color || '#3B82F6'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-10 h-8 rounded cursor-pointer border border-gray-200" />
            <span className="text-xs font-mono text-slate-500">{form.color}</span>
          </div>
        </FormField>

        <FormField label="Días de reparto">
          <div className="flex flex-wrap gap-2">
            {days.map(d => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border-2 ${(form.deliveryDays||[]).includes(d) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-600 hover:border-gray-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </FormField>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon={zone ? 'check' : 'plus'}>{zone ? 'Guardar' : 'Crear zona'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
