// NATIVA - Costs / Gastos module

const CATEGORIES = [
  { id: 'insumos',   label: 'Insumos',           emoji: '📦', icon: 'package',     color: 'blue'   },
  { id: 'logistica', label: 'Logística',          emoji: '🚚', icon: 'truck',       color: 'violet' },
  { id: 'maquinas',  label: 'Máquinas',           emoji: '⚙️',  icon: 'settings',    color: 'amber'  },
  { id: 'operativos',label: 'Operativos',         emoji: '🏢', icon: 'building',    color: 'emerald'},
];

const CATEGORY_ITEMS = {
  insumos:    ['Bidón', 'Tapa', 'Etiqueta', 'Precinto', 'Bolsa'],
  logistica:  ['Combustible', 'Peaje', 'Mantenimiento camioneta', 'Neumáticos', 'Seguro'],
  maquinas:   ['Mantenimiento máquina', 'Filtros', 'Repuestos', 'Energía eléctrica'],
  operativos: ['Sueldo', 'Alquiler depósito', 'Servicios'],
};

const UNIT_OPTIONS = [
  { value: 'total',    label: 'Monto total'  },
  { value: 'per_unit', label: 'Por unidad'   },
  { value: 'per_km',   label: 'Por km'       },
];

const CATEGORY_COLOR_MAP = {
  blue:    { card: 'bg-blue-50 border-blue-100',    icon: 'bg-blue-100 text-blue-600',    badge: 'bg-blue-100 text-blue-700',    total: 'text-blue-700'    },
  violet:  { card: 'bg-violet-50 border-violet-100',icon: 'bg-violet-100 text-violet-600',badge: 'bg-violet-100 text-violet-700',total: 'text-violet-700'  },
  amber:   { card: 'bg-amber-50 border-amber-100',  icon: 'bg-amber-100 text-amber-600',  badge: 'bg-amber-100 text-amber-700',  total: 'text-amber-700'   },
  emerald: { card: 'bg-emerald-50 border-emerald-100',icon:'bg-emerald-100 text-emerald-600',badge:'bg-emerald-100 text-emerald-700',total:'text-emerald-700'},
};

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${names[parseInt(m,10)-1]} ${y}`;
}

function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function currentMonth() {
  const today = DataService.today ? DataService.today() : new Date().toISOString().slice(0,10);
  return today.slice(0,7);
}

function Costs() {
  const [month, setMonth] = React.useState(currentMonth);
  const [costs, setCosts] = React.useState([]);
  const [revenue, setRevenue] = React.useState(0);
  const [bottlesDelivered, setBottlesDelivered] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [openCategories, setOpenCategories] = React.useState({ insumos: true, logistica: true, maquinas: true, operativos: true });

  const reload = async (m) => {
    const targetMonth = m || month;
    setLoading(true);
    try {
      const data = await DataService.getCosts(targetMonth);
      setCosts(data || []);

      // Load revenue for the month
      if (typeof DataService.getMonthRevenue === 'function') {
        const rev = await DataService.getMonthRevenue(targetMonth);
        setRevenue(rev || 0);
      } else {
        // DataService.getMonthRevenue not yet implemented — default to 0
        setRevenue(0);
      }

      // Load bottles delivered for the month
      if (typeof DataService.getMonthBottlesDelivered === 'function') {
        const btl = await DataService.getMonthBottlesDelivered(targetMonth);
        setBottlesDelivered(btl || 0);
      } else {
        // DataService.getMonthBottlesDelivered not yet implemented — default to 0
        setBottlesDelivered(0);
      }
    } catch (err) {
      console.error('Error loading costs:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { reload(month); }, [month]);

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
  };

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (cost) => { setEditing(cost); setShowModal(true); };

  const handleSave = async (data) => {
    try {
      if (editing) {
        await DataService.updateCost(editing.id, data);
      } else {
        await DataService.createCost(data);
      }
      setShowModal(false);
      setEditing(null);
      await reload(month);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (cost) => {
    if (!window.confirm(`¿Eliminar "${cost.name}"?`)) return;
    try {
      await DataService.deleteCost(cost.id);
      await reload(month);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Summary calculations
  const totalCosts = costs.reduce((s, c) => s + (c.total || c.amount || 0), 0);
  const margin = revenue - totalCosts;
  const marginPct = revenue > 0 ? ((margin / revenue) * 100).toFixed(1) : null;
  const costPerBottle = bottlesDelivered > 0 ? totalCosts / bottlesDelivered : null;

  const costsByCategory = (catId) => costs.filter(c => c.category === catId);
  const categoryTotal = (catId) => costsByCategory(catId).reduce((s, c) => s + (c.total || c.amount || 0), 0);

  const isCurrentMonth = month === currentMonth();

  return (
    <div>
      <PageHeader
        title="Gastos"
        subtitle={`${costs.length} registros · ${monthLabel(month)}`}
        action={<Btn onClick={openNew} icon="plus" variant="primary">Nuevo gasto</Btn>}
      />

      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => handleMonthChange(prevMonth(month))}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 transition-colors"
          title="Mes anterior"
        >
          <Icon name="chevLeft" size={16} />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm min-w-40 justify-center">
          <Icon name="calendar" size={15} className="text-blue-500" />
          <span className="font-semibold text-slate-800 text-sm">{monthLabel(month)}</span>
        </div>
        <button
          onClick={() => handleMonthChange(nextMonth(month))}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 transition-colors"
          title="Mes siguiente"
          disabled={isCurrentMonth}
        >
          <Icon name="chevRight" size={16} className={isCurrentMonth ? 'opacity-30' : ''} />
        </button>
        {!isCurrentMonth && (
          <button
            onClick={() => handleMonthChange(currentMonth())}
            className="text-xs text-blue-600 font-medium px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Mes actual
          </button>
        )}
        <input
          type="month"
          value={month}
          onChange={e => e.target.value && handleMonthChange(e.target.value)}
          className={inputCls('ml-auto w-44')}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total costos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
              <Icon name="trendingDown" size={16} className="text-rose-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 leading-none">{DataService.formatCurrency(totalCosts)}</p>
          <p className="text-sm text-slate-500 mt-1">Total costos</p>
        </div>

        {/* Ingresos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Icon name="dollarSign" size={16} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 leading-none">{DataService.formatCurrency(revenue)}</p>
          <p className="text-sm text-slate-500 mt-1">Ingresos del mes</p>
          <p className="text-xs text-slate-400">Pagado</p>
        </div>

        {/* Margen $ */}
        <div className={`rounded-2xl p-4 shadow-sm border ${margin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${margin >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <Icon name={margin >= 0 ? 'trendingUp' : 'trendingDown'} size={16} className={margin >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            </div>
          </div>
          <p className={`text-xl font-bold leading-none ${margin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {DataService.formatCurrency(margin)}
          </p>
          <p className="text-sm text-slate-600 mt-1">Margen ($)</p>
        </div>

        {/* Margen % */}
        <div className={`rounded-2xl p-4 shadow-sm border ${margin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${margin >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <Icon name="percent" size={16} className={margin >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            </div>
          </div>
          <p className={`text-xl font-bold leading-none ${margin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {marginPct !== null ? `${marginPct}%` : '—'}
          </p>
          <p className="text-sm text-slate-600 mt-1">Margen (%)</p>
        </div>

        {/* Costo por bidón */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Icon name="droplets" size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 leading-none">
            {costPerBottle !== null ? DataService.formatCurrency(costPerBottle) : '—'}
          </p>
          <p className="text-sm text-slate-500 mt-1">Costo / bidón</p>
          {bottlesDelivered > 0 && (
            <p className="text-xs text-slate-400">{bottlesDelivered} bidones</p>
          )}
        </div>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && costs.length === 0 && (
        <EmptyState
          icon="dollarSign"
          title="Sin gastos registrados"
          description={`Aún no hay gastos cargados para ${monthLabel(month)}. Registrá los costos operativos del mes.`}
          action={<Btn onClick={openNew} icon="plus" variant="primary">Agregar primer gasto</Btn>}
        />
      )}

      {/* Cost list grouped by category */}
      {!loading && costs.length > 0 && (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const items = costsByCategory(cat.id);
            const total = categoryTotal(cat.id);
            const isOpen = openCategories[cat.id];
            const colors = CATEGORY_COLOR_MAP[cat.color];

            return (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                    <Icon name={cat.icon} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{cat.emoji} {cat.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`font-bold text-base ${colors.total}`}>{DataService.formatCurrency(total)}</span>
                    <Icon name={isOpen ? 'chevDown' : 'chevRight'} size={16} className="text-slate-400" />
                  </div>
                </button>

                {/* Category items */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    {items.length === 0 ? (
                      <div className="px-5 py-4 text-center">
                        <p className="text-sm text-slate-400">No hay gastos en esta categoría</p>
                        <button
                          onClick={() => { setEditing({ _defaultCategory: cat.id }); setShowModal(true); }}
                          className="text-xs text-blue-600 font-medium mt-1 hover:text-blue-700"
                        >
                          + Agregar gasto
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {items.map(cost => (
                          <CostRow
                            key={cost.id}
                            cost={cost}
                            onEdit={() => openEdit(cost)}
                            onDelete={() => handleDelete(cost)}
                          />
                        ))}
                      </div>
                    )}

                    {items.length > 0 && (
                      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                        <button
                          onClick={() => { setEditing({ _defaultCategory: cat.id }); setShowModal(true); }}
                          className="text-xs text-blue-600 font-medium hover:text-blue-700"
                        >
                          + Agregar gasto en {cat.label}
                        </button>
                        <span className={`text-sm font-bold ${colors.total}`}>
                          Subtotal: {DataService.formatCurrency(total)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand total footer */}
          <div className="bg-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                <Icon name="calculator" size={16} className="text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Total gastos del mes</p>
                <p className="text-white font-bold text-xl">{DataService.formatCurrency(totalCosts)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs font-semibold uppercase">Margen neto</p>
              <p className={`font-bold text-xl ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {DataService.formatCurrency(margin)}
                {marginPct !== null && (
                  <span className="text-sm font-medium ml-1 opacity-80">({marginPct}%)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <CostFormModal
        isOpen={showModal}
        editing={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
        month={month}
      />
    </div>
  );
}

function CostRow({ cost, onEdit, onDelete }) {
  const cat = CATEGORIES.find(c => c.id === cost.category) || CATEGORIES[0];
  const colors = CATEGORY_COLOR_MAP[cat.color];
  const itemTotal = cost.total || cost.amount || 0;

  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
        <Icon name={cat.icon} size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{cost.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {cost.date && (
            <span className="text-xs text-slate-400">{cost.date}</span>
          )}
          {cost.quantity > 1 && (
            <span className="text-xs text-slate-400">× {cost.quantity} ({UNIT_OPTIONS.find(u => u.value === cost.unit)?.label || cost.unit})</span>
          )}
          {cost.notes && (
            <span className="text-xs text-slate-400 truncate max-w-xs italic">{cost.notes}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-semibold text-slate-900 text-sm">{DataService.formatCurrency(itemTotal)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
            title="Editar"
          >
            <Icon name="pencil" size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
            title="Eliminar"
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CostFormModal({ isOpen, editing, onClose, onSave, month }) {
  const isEdit = editing && editing.id;

  const [category, setCategory] = React.useState('insumos');
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [unit, setUnit] = React.useState('total');
  const [date, setDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const today = DataService.today ? DataService.today() : new Date().toISOString().slice(0,10);

  React.useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setCategory(editing.category || 'insumos');
      setName(editing.name || '');
      setAmount(editing.amount != null ? String(editing.amount) : '');
      setQuantity(editing.quantity || 1);
      setUnit(editing.unit || 'total');
      setDate(editing.date || today);
      setNotes(editing.notes || '');
    } else {
      setCategory((editing && editing._defaultCategory) || 'insumos');
      setName('');
      setAmount('');
      setQuantity(1);
      setUnit('total');
      setDate(today);
      setNotes('');
    }
  }, [isOpen]);

  const suggestions = CATEGORY_ITEMS[category] || [];
  const computedTotal = (parseFloat(amount) || 0) * (parseInt(quantity, 10) || 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { alert('Ingresá un nombre para el gasto'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { alert('Ingresá un monto válido'); return; }
    setSaving(true);
    try {
      await onSave({
        category,
        name: name.trim(),
        amount: parseFloat(amount),
        quantity: parseInt(quantity, 10) || 1,
        unit,
        total: computedTotal,
        date: date || today,
        notes: notes.trim(),
        month,
      });
    } finally {
      setSaving(false);
    }
  };

  const catInfo = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar gasto' : 'Nuevo gasto'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Category selector */}
        <FormField label="Categoría" required>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => {
              const colors = CATEGORY_COLOR_MAP[cat.color];
              const selected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategory(cat.id); setName(''); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors text-left ${
                    selected
                      ? `border-current ${colors.badge}`
                      : 'border-gray-200 text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Name with datalist suggestions */}
        <FormField label="Nombre del gasto" required>
          <input
            id="cost-name-input"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls()}
            placeholder={`Ej: ${suggestions[0] || 'Nombre'}`}
            list="cost-name-suggestions"
            required
          />
          <datalist id="cost-name-suggestions">
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </FormField>

        {/* Amount + quantity */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Monto unitario ($)" required>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inputCls()}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </FormField>
          <FormField label="Cantidad">
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value,10) || 1))}
              className={inputCls()}
              min="1"
              step="1"
            />
          </FormField>
        </div>

        {/* Unit type */}
        <FormField label="Tipo de unidad">
          <select value={unit} onChange={e => setUnit(e.target.value)} className={inputCls()}>
            {UNIT_OPTIONS.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </FormField>

        {/* Total preview */}
        {quantity > 1 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-sm text-blue-700 font-medium">
              {quantity} × {DataService.formatCurrency(parseFloat(amount) || 0)}
            </span>
            <span className="text-base font-bold text-blue-900">
              Total: {DataService.formatCurrency(computedTotal)}
            </span>
          </div>
        )}

        {/* Date */}
        <FormField label="Fecha">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputCls()}
          />
        </FormField>

        {/* Notes */}
        <FormField label="Notas (opcional)">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={inputCls('resize-none')}
            rows="2"
            placeholder="Detalle adicional..."
          />
        </FormField>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon={isEdit ? 'check' : 'plus'} disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar gasto'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
