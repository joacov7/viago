// NATIVA - Mantenimiento de máquinas: alertas por litros, historial

const MAINT_TYPES = {
  preventivo: { label: 'Preventivo', bg: 'bg-blue-100', text: 'text-blue-700' },
  correctivo:  { label: 'Correctivo', bg: 'bg-red-100',  text: 'text-red-700' },
  limpieza:    { label: 'Limpieza',   bg: 'bg-teal-100', text: 'text-teal-700' },
};

function getMachineStatus(machine) {
  const liters = (machine.currentLiters || 0) - (machine.litersAtLastMaintenance || 0);
  const interval = machine.maintenanceIntervalLiters || 5000;
  const pct = interval > 0 ? liters / interval : 0;
  if (pct >= 1.1) return 'overdue';
  if (pct >= 0.85) return 'warning';
  return 'ok';
}

function getLitersSince(machine) {
  return Math.max(0, (machine.currentLiters || 0) - (machine.litersAtLastMaintenance || 0));
}

const statusConfig = {
  ok:      { label: 'OK',            bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  warning: { label: 'Próximo',       bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  overdue: { label: 'Vencido',       bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
};

function Machines() {
  const [machines, setMachines] = React.useState([]);
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [showMaintModal, setShowMaintModal] = React.useState(null);
  const [showLitersModal, setShowLitersModal] = React.useState(null);
  const [showLogsFor, setShowLogsFor] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const confirm = useConfirm();

  const reload = async () => {
    setLoading(true);
    const [ms, ls] = await Promise.all([DataService.getMachines(), DataService.getMaintenanceLogs()]);
    setMachines(ms);
    setLogs(ls);
    setLoading(false);
  };
  React.useEffect(() => { reload(); }, []);

  const handleDelete = async (machine) => {
    if (!await confirm(`¿Eliminar la máquina "${machine.name}"? Se borrará también su historial.`)) return;
    await DataService.deleteMachine(machine.id);
    reload();
  };

  const machineLogs = (machineId) => logs.filter(l => l.machineId === machineId).sort((a, b) => b.date.localeCompare(a.date));

  const statusGroups = {
    overdue: machines.filter(m => getMachineStatus(m) === 'overdue'),
    warning: machines.filter(m => getMachineStatus(m) === 'warning'),
    ok:      machines.filter(m => getMachineStatus(m) === 'ok'),
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Máquinas</h2>
          <p className="text-sm text-slate-500 mt-0.5">Mantenimiento por litros procesados</p>
        </div>
        <Btn onClick={() => { setEditing(null); setShowModal(true); }} variant="primary" icon="plus">
          Nueva máquina
        </Btn>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En funcionamiento', value: machines.length, icon: 'settings', bg: 'bg-blue-100', color: 'text-blue-600' },
          { label: 'Mantenimiento próximo', value: statusGroups.warning.length + statusGroups.overdue.length, icon: 'alertCircle', bg: 'bg-amber-100', color: 'text-amber-600' },
          { label: 'Vencidas', value: statusGroups.overdue.length, icon: 'alertCircle', bg: 'bg-red-100', color: 'text-red-600' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} mb-3`}>
              <Icon name={c.icon} size={20} className={c.color} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Machines list */}
      {machines.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="settings" size={28} className="text-gray-400" />
          </div>
          <p className="text-slate-500 font-medium">No hay máquinas registradas</p>
          <p className="text-sm text-slate-400 mt-1">Agregá tu primer máquina para llevar el mantenimiento</p>
          <Btn onClick={() => { setEditing(null); setShowModal(true); }} variant="secondary" size="sm" className="mt-4" icon="plus">
            Agregar máquina
          </Btn>
        </div>
      ) : (
        <div className="space-y-4">
          {['overdue', 'warning', 'ok'].map(statusKey => (
            statusGroups[statusKey].length > 0 && (
              <div key={statusKey}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[statusKey].dot}`} />
                  <span className="text-sm font-semibold text-slate-700">
                    {statusConfig[statusKey].label} ({statusGroups[statusKey].length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {statusGroups[statusKey].map(machine => (
                    <MachineCard
                      key={machine.id}
                      machine={machine}
                      logs={machineLogs(machine.id)}
                      onEdit={() => { setEditing(machine); setShowModal(true); }}
                      onDelete={() => handleDelete(machine)}
                      onLogMaint={() => setShowMaintModal(machine)}
                      onAddLiters={() => setShowLitersModal(machine)}
                      onViewLogs={() => setShowLogsFor(showLogsFor === machine.id ? null : machine.id)}
                      showLogs={showLogsFor === machine.id}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {showModal && (
        <MachineModal
          machine={editing}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            if (editing) await DataService.updateMachine(editing.id, data);
            else await DataService.createMachine(data);
            setShowModal(false);
            reload();
          }}
        />
      )}

      {showMaintModal && (
        <LogMaintenanceModal
          machine={showMaintModal}
          onClose={() => setShowMaintModal(null)}
          onSave={async (data) => {
            await DataService.logMaintenance({ ...data, machineId: showMaintModal.id });
            setShowMaintModal(null);
            reload();
          }}
        />
      )}

      {showLitersModal && (
        <AddLitersModal
          machine={showLitersModal}
          onClose={() => setShowLitersModal(null)}
          onSave={async (liters) => {
            await DataService.addMachineLiters(showLitersModal.id, liters);
            setShowLitersModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function MachineCard({ machine, logs, onEdit, onDelete, onLogMaint, onAddLiters, onViewLogs, showLogs }) {
  const status = getMachineStatus(machine);
  const sc = statusConfig[status];
  const litersSince = getLitersSince(machine);
  const interval = machine.maintenanceIntervalLiters || 5000;
  const pct = Math.min(100, interval > 0 ? Math.round((litersSince / interval) * 100) : 0);
  const barColor = status === 'overdue' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
  const lastLog = logs[0];

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${status === 'overdue' ? 'border-red-200' : status === 'warning' ? 'border-amber-200' : 'border-gray-100'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
            </div>
            <h3 className="font-semibold text-slate-900 mt-1.5 truncate">{machine.name}</h3>
            {machine.model && <p className="text-xs text-slate-400">{machine.model}</p>}
            {machine.serial && <p className="text-xs text-slate-400">S/N: {machine.serial}</p>}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-slate-600">
              <Icon name="edit" size={14} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>

        {/* Liters progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Litros desde último mantenimiento</span>
            <span className="text-xs font-semibold text-slate-700">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-slate-400">{litersSince.toLocaleString('es-AR')} L procesados</span>
            <span className="text-xs text-slate-400">Meta: {interval.toLocaleString('es-AR')} L</span>
          </div>
        </div>

        {/* Last maintenance */}
        {lastLog && (
          <div className="text-xs text-slate-400 mb-3">
            Último mantenimiento: {DataService.formatDate(lastLog.date)}
            {lastLog.type && ` · ${MAINT_TYPES[lastLog.type]?.label || lastLog.type}`}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Icon name="droplets" size={12} className="text-blue-400" />
          <span>{(machine.currentLiters || 0).toLocaleString('es-AR')} L totales</span>
          {machine.capacityLitersPerHour && (
            <>
              <span className="text-gray-300">·</span>
              <span>{machine.capacityLitersPerHour} L/h</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Btn onClick={onAddLiters} variant="secondary" size="sm" icon="plus" className="flex-1 justify-center">
            Litros
          </Btn>
          <Btn onClick={onLogMaint} variant={status !== 'ok' ? 'primary' : 'secondary'} size="sm" icon="settings" className="flex-1 justify-center">
            Mantenimiento
          </Btn>
        </div>

        {logs.length > 0 && (
          <button onClick={onViewLogs} className="mt-2 w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
            {showLogs ? 'Ocultar historial' : `Ver historial (${logs.length})`}
          </button>
        )}
      </div>

      {/* Logs expanded */}
      {showLogs && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {logs.slice(0, 8).map(log => {
            const tc = MAINT_TYPES[log.type] || { label: log.type, bg: 'bg-gray-100', text: 'text-gray-600' };
            return (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${tc.bg} ${tc.text}`}>
                  {tc.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">{DataService.formatDate(log.date)}{log.technician ? ` · ${log.technician}` : ''}</p>
                  {log.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{log.notes}</p>}
                  {log.litersAtMaintenance != null && (
                    <p className="text-xs text-slate-400">{(log.litersAtMaintenance || 0).toLocaleString('es-AR')} L al mantenimiento</p>
                  )}
                </div>
                {log.cost > 0 && (
                  <span className="text-xs font-semibold text-slate-700 flex-shrink-0">{DataService.formatCurrency(log.cost)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MachineModal({ machine, onClose, onSave }) {
  const [form, setForm] = React.useState({
    name: machine?.name || '',
    serial: machine?.serial || '',
    model: machine?.model || '',
    capacityLitersPerHour: machine?.capacityLitersPerHour || '',
    installationDate: machine?.installationDate || DataService.today(),
    currentLiters: machine?.currentLiters || 0,
    maintenanceIntervalLiters: machine?.maintenanceIntervalLiters || 5000,
    litersAtLastMaintenance: machine?.litersAtLastMaintenance || 0,
    lastMaintenanceDate: machine?.lastMaintenanceDate || '',
    notes: machine?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        currentLiters: Number(form.currentLiters) || 0,
        maintenanceIntervalLiters: Number(form.maintenanceIntervalLiters) || 5000,
        capacityLitersPerHour: form.capacityLitersPerHour ? Number(form.capacityLitersPerHour) : null,
        litersAtLastMaintenance: Number(form.litersAtLastMaintenance) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} title={machine ? 'Editar máquina' : 'Nueva máquina'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="Ej: Llenadora principal"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
            <input value={form.model} onChange={e => set('model', e.target.value)}
              placeholder="Ej: Nativa Pro 2000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">N° de serie</label>
            <input value={form.serial} onChange={e => set('serial', e.target.value)}
              placeholder="SN-XXXX"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad (L/hora)</label>
            <input value={form.capacityLitersPerHour} onChange={e => set('capacityLitersPerHour', e.target.value)}
              type="number" min="0" placeholder="Ej: 500"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha instalación</label>
            <input value={form.installationDate} onChange={e => set('installationDate', e.target.value)}
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Alerta de mantenimiento</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Intervalo (litros)</label>
              <input value={form.maintenanceIntervalLiters} onChange={e => set('maintenanceIntervalLiters', e.target.value)}
                type="number" min="100" placeholder="5000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Litros totales actuales</label>
              <input value={form.currentLiters} onChange={e => set('currentLiters', e.target.value)}
                type="number" min="0" placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Litros al último mant.</label>
              <input value={form.litersAtLastMaintenance} onChange={e => set('litersAtLastMaintenance', e.target.value)}
                type="number" min="0" placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha último mant.</label>
              <input value={form.lastMaintenanceDate} onChange={e => set('lastMaintenanceDate', e.target.value)}
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <p className="text-xs text-blue-600">⚡ Alerta al 85% · Vencida al 100% del intervalo</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            placeholder="Observaciones, ubicación, proveedor de servicio..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <Btn type="button" onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancelar</Btn>
          <Btn type="submit" variant="primary" className="flex-1 justify-center" disabled={saving}>
            {saving ? 'Guardando...' : machine ? 'Guardar cambios' : 'Crear máquina'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function LogMaintenanceModal({ machine, onClose, onSave }) {
  const [form, setForm] = React.useState({
    date: DataService.today(),
    type: 'preventivo',
    technician: '',
    notes: '',
    cost: '',
    resetLiters: true,
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        date: form.date,
        type: form.type,
        technician: form.technician || null,
        notes: form.notes || null,
        cost: form.cost ? Number(form.cost) : 0,
        litersAtMaintenance: machine.currentLiters || 0,
        resetLiters: form.resetLiters,
      });
    } finally {
      setSaving(false);
    }
  };

  const litersSince = getLitersSince(machine);

  return (
    <Modal isOpen={true} title={`Registrar mantenimiento · ${machine.name}`} onClose={onClose} size="md">
      <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center gap-3">
        <Icon name="droplets" size={18} className="text-blue-500" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{litersSince.toLocaleString('es-AR')} L desde el último mantenimiento</p>
          <p className="text-xs text-slate-400">{(machine.currentLiters || 0).toLocaleString('es-AR')} L totales · intervalo cada {(machine.maintenanceIntervalLiters || 5000).toLocaleString('es-AR')} L</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
            <input value={form.date} onChange={e => set('date', e.target.value)} required type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(MAINT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Técnico</label>
            <input value={form.technician} onChange={e => set('technician', e.target.value)}
              placeholder="Nombre del técnico"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Costo</label>
            <input value={form.cost} onChange={e => set('cost', e.target.value)} type="number" min="0"
              placeholder="$ 0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            placeholder="¿Qué se hizo? Repuestos, observaciones..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.resetLiters} onChange={e => set('resetLiters', e.target.checked)}
            className="w-4 h-4 rounded text-blue-600" />
          <span className="text-sm text-slate-700">Reiniciar contador de litros desde este mantenimiento</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Btn type="button" onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancelar</Btn>
          <Btn type="submit" variant="primary" className="flex-1 justify-center" disabled={saving}>
            {saving ? 'Guardando...' : 'Registrar'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function AddLitersModal({ machine, onClose, onSave }) {
  const [liters, setLiters] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = Number(liters);
    if (!n || n <= 0) return;
    setSaving(true);
    try {
      await onSave(n);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} title={`Agregar litros · ${machine.name}`} onClose={onClose} size="sm">
      <p className="text-sm text-slate-500 mb-4">
        Litros actuales: <strong className="text-slate-900">{(machine.currentLiters || 0).toLocaleString('es-AR')}</strong>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Litros a agregar</label>
          <input
            value={liters}
            onChange={e => setLiters(e.target.value)}
            type="number" min="1" required autoFocus
            placeholder="Ej: 500"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {liters && Number(liters) > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Nuevo total: {((machine.currentLiters || 0) + Number(liters)).toLocaleString('es-AR')} L
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Btn type="button" onClick={onClose} variant="secondary" className="flex-1 justify-center">Cancelar</Btn>
          <Btn type="submit" variant="primary" className="flex-1 justify-center" disabled={saving}>
            {saving ? 'Guardando...' : 'Agregar'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
