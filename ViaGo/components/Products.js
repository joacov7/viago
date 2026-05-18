// NATIVA - Products management module

function Products() {
  const [products, setProducts] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  const reload = async () => setProducts(await DataService.getProducts(true));
  React.useEffect(() => { reload(); }, []);

  const handleSave = async (data) => {
    if (editing) await DataService.updateProduct(editing.id, data);
    else await DataService.createProduct(data);
    reload(); setShowModal(false); setEditing(null);
  };
  const toggleActive = async (p) => { await DataService.updateProduct(p.id, { active: !p.active }); reload(); };

  const active = products.filter(p => p.active);
  const inactive = products.filter(p => !p.active);

  const typeLabels = { bidon: '💧 Bidón', botella: '🫙 Botella', accesorio: '⚙️ Accesorio' };
  const typeColors = { bidon: 'bg-blue-50 text-blue-700', botella: 'bg-teal-50 text-teal-700', accesorio: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle={`${active.length} activos · ${inactive.length} inactivos`}
        action={<Btn onClick={() => { setEditing(null); setShowModal(true); }} icon="plus" variant="primary">Nuevo producto</Btn>}
      />

      {products.length === 0 ? (
        <EmptyState icon="shoppingBag" title="Sin productos" description="Agregá productos para crear pedidos y facturas" action={<Btn onClick={() => setShowModal(true)} icon="plus" variant="primary">Nuevo producto</Btn>} />
      ) : (
        <>
          {/* Active products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">Productos activos</h3>
              <span className="text-xs text-slate-400">{active.length} productos</span>
            </div>
            {active.length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-400 text-center">Sin productos activos</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Producto', 'Tipo', 'Precio', 'Unidad', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {active.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColors[p.type] || 'bg-gray-100 text-gray-600'}`}>
                          {typeLabels[p.type] || p.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-base font-bold text-slate-900">{DataService.formatCurrency(p.price)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-500">{p.unit}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditing(p); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-slate-600">
                            <Icon name="edit" size={15} />
                          </button>
                          <button onClick={() => toggleActive(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Desactivar">
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Inactive products */}
          {inactive.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-400">Productos inactivos</h3>
                <span className="text-xs text-slate-300">{inactive.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {inactive.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 opacity-50">
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-400">{DataService.formatCurrency(p.price)} · {typeLabels[p.type] || p.type}</p>
                    </div>
                    <button onClick={() => toggleActive(p)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-3 py-1 rounded-lg hover:bg-emerald-50">
                      Reactivar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ProductFormModal isOpen={showModal} product={editing} onClose={() => { setShowModal(false); setEditing(null); }} onSave={handleSave} />
    </div>
  );
}

function ProductFormModal({ isOpen, product, onClose, onSave }) {
  const [form, setForm] = React.useState({});
  React.useEffect(() => {
    setForm(product ? { ...product } : { name: '', type: 'bidon', price: '', unit: 'unidad' });
  }, [product, isOpen]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('El nombre es obligatorio'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { alert('El precio debe ser mayor a 0'); return; }
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? `Editar: ${product.name}` : 'Nuevo producto'} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Nombre del producto" required>
          <input value={form.name || ''} onChange={e => set('name', e.target.value)} className={inputCls()} placeholder="Ej: Bidón 20L" required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo">
            <select value={form.type || 'bidon'} onChange={e => set('type', e.target.value)} className={inputCls()}>
              <option value="bidon">Bidón</option>
              <option value="botella">Botella</option>
              <option value="accesorio">Accesorio</option>
              <option value="limpieza">Limpieza</option>
            </select>
          </FormField>
          <FormField label="Unidad">
            <select value={form.unit || 'unidad'} onChange={e => set('unit', e.target.value)} className={inputCls()}>
              <option value="unidad">Unidad</option>
              <option value="pack">Pack</option>
              <option value="docena">Docena</option>
            </select>
          </FormField>
        </div>
        <FormField label="Precio (ARS)" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
            <input
              type="number" value={form.price || ''} onChange={e => set('price', e.target.value)}
              className={inputCls('pl-7')} placeholder="0" min="0" step="1" required
            />
          </div>
        </FormField>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon={product ? 'check' : 'plus'}>{product ? 'Guardar cambios' : 'Crear producto'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
