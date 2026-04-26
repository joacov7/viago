// NATIVA - Loyalty: points, referrals and promotions

function Loyalty() {
  const [clients, setClients] = React.useState([]);
  const [promotions, setPromotion] = React.useState([]);
  const [pointsHistory, setPointsHistory] = React.useState([]);
  const [config, setConfig] = React.useState({});
  const [zones, setZones] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('puntos');
  const [showPromoModal, setShowPromoModal] = React.useState(false);
  const [showAdjustModal, setShowAdjustModal] = React.useState(null);

  const reload = async () => {
    const [clientList, promos, history, cfg, zoneList] = await Promise.all([
      DataService.getClients(), DataService.getPromotions(),
      DataService.getPointsHistory(), DataService.getConfig(),
      DataService.getZones(),
    ]);
    setClients(clientList.sort((a, b) => (b.points || 0) - (a.points || 0)));
    setPromotion(promos);
    setPointsHistory(history.slice(0, 50));
    setConfig(cfg);
    setZones(zoneList);
  };
  React.useEffect(() => { reload(); }, []);

  const topClients = clients.filter(c => (c.points || 0) > 0).slice(0, 10);
  const referrers = clients.filter(c => clients.some(r => r.referredBy === c.id));

  const tabs = [
    { id: 'puntos', label: `Ranking puntos (${topClients.length})` },
    { id: 'referidos', label: `Referidos (${referrers.length})` },
    { id: 'promociones', label: `Promociones (${promotions.length})` },
    { id: 'historial', label: `Historial (${pointsHistory.length})` },
  ];

  return (
    <div>
      <PageHeader
        title="Fidelización"
        subtitle={`${config.pointsPerOrder} pts por entrega · ${config.pointsForReward} pts = premio`}
      />

      {/* Config summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-amber-600">{config.pointsPerOrder}</div>
          <div className="text-xs text-amber-700 mt-0.5">Puntos por entrega</div>
        </div>
        <div className="bg-violet-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-violet-600">{config.pointsForReward}</div>
          <div className="text-xs text-violet-700 mt-0.5">Pts necesarios para premio</div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-emerald-600">{config.referralBonus}</div>
          <div className="text-xs text-emerald-700 mt-0.5">Pts por referido</div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-blue-600">{clients.reduce((s, c) => s + (c.points || 0), 0)}</div>
          <div className="text-xs text-blue-700 mt-0.5">Puntos totales activos</div>
        </div>
      </div>

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
          {/* PUNTOS TAB */}
          {activeTab === 'puntos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">Clientes con puntos acumulados</p>
                <Btn onClick={() => setShowAdjustModal({})} variant="secondary" size="sm" icon="plus">Ajustar puntos</Btn>
              </div>
              {topClients.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Ningún cliente tiene puntos aún. Los puntos se otorgan automáticamente al entregar pedidos.</p>
              ) : (
                <div className="space-y-3">
                  {topClients.map((c, idx) => {
                    const pct = Math.min((c.points / config.pointsForReward) * 100, 100);
                    return (
                      <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-300'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                            <span className="text-sm font-bold text-amber-600 ml-2">{c.points} pts</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{Math.round(pct)}% del premio ({config.pointsForReward} pts)</p>
                        </div>
                        <button onClick={() => setShowAdjustModal(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-400 hover:text-slate-600 flex-shrink-0">
                          <Icon name="edit" size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REFERIDOS TAB */}
          {activeTab === 'referidos' && (
            <div>
              <p className="text-sm text-slate-500 mb-4">Clientes que han traído nuevos clientes al programa de referidos</p>
              {referrers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aún no hay referidos registrados</p>
              ) : (
                <div className="space-y-4">
                  {referrers.map(c => {
                    const refs = clients.filter(r => r.referredBy === c.id);
                    return (
                      <div key={c.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">{c.name}</p>
                            <p className="text-xs text-blue-600 font-mono">{c.referralCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-violet-600">{refs.length}</p>
                            <p className="text-xs text-slate-400">referidos</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {refs.map(r => (
                            <div key={r.id} className="flex items-center justify-between text-sm p-2 bg-white rounded-lg border border-gray-100">
                              <span className="text-slate-700 font-medium">{r.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-blue-500">{r.code}</span>
                                <span className="text-xs text-slate-400">{DataService.formatDate(r.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Share button */}
                        {c.phone && (
                          <a href={WhatsAppService.referralShare(c)} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium">
                            <Icon name="share2" size={12} />Compartir código por WhatsApp
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PROMOCIONES TAB */}
          {activeTab === 'promociones' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">Promociones activas y configuradas</p>
                <Btn onClick={() => setShowPromoModal(true)} variant="primary" size="sm" icon="plus">Nueva promoción</Btn>
              </div>
              {promotions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin promociones. Creá una para incentivar ventas.</p>
              ) : (
                <div className="space-y-3">
                  {promotions.map(p => {
                    const typeLabels = { primera_compra: '🎁 Primera compra', volumen: '📦 Volumen', zona: '📍 Por zona', referido: '👥 Referido' };
                    const discountLabels = { porcentaje: `${p.discountValue}% de descuento`, producto_gratis: `${p.discountValue} producto gratis`, descuento_fijo: `$${p.discountValue} de descuento` };
                    const zone = p.zoneId ? zones.find(z => z.id === p.zoneId) : null;
                    return (
                      <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border ${p.active ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900">{p.name}</p>
                            {p.active ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Activa</span> : <span className="text-xs text-slate-400">Inactiva</span>}
                          </div>
                          <p className="text-xs text-slate-600">{typeLabels[p.type] || p.type} · {discountLabels[p.discountType] || ''}</p>
                          {p.minQuantity > 0 && <p className="text-xs text-slate-400">Mínimo: {p.minQuantity} unidades</p>}
                          {zone && <p className="text-xs text-slate-400">Zona: {zone.name}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={async () => { await DataService.updatePromotion(p.id, { active: !p.active }); reload(); }}
                            className={`p-1.5 rounded-lg transition-colors ${p.active ? 'hover:bg-red-50 text-emerald-500 hover:text-red-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}>
                            <Icon name={p.active ? 'xCircle' : 'checkCircle'} size={16} />
                          </button>
                          <button onClick={async () => { if(window.confirm('¿Eliminar esta promoción?')) { await DataService.deletePromotion(p.id); reload(); } }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* HISTORIAL TAB */}
          {activeTab === 'historial' && (
            <div>
              <p className="text-sm text-slate-500 mb-4">Últimas 50 transacciones de puntos</p>
              {pointsHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin historial</p>
              ) : (
                <div className="space-y-2">
                  {pointsHistory.map(h => {
                    const client = clients.find(c => c.id === h.clientId);
                    const actionColors = { earned: 'text-emerald-600', redeemed: 'text-red-500', referral: 'text-violet-600' };
                    return (
                      <div key={h.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{client?.name || `#${h.clientId}`}</p>
                          <p className="text-xs text-slate-400">{h.description} · {DataService.formatDateTime(h.createdAt)}</p>
                        </div>
                        <span className={`text-sm font-bold ml-4 flex-shrink-0 ${actionColors[h.action] || 'text-slate-600'}`}>
                          {h.points > 0 ? '+' : ''}{h.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PromoFormModal isOpen={showPromoModal} onClose={() => setShowPromoModal(false)} onSave={async (data) => { await DataService.createPromotion(data); reload(); setShowPromoModal(false); }} zones={zones} />
      <PointsAdjustModal client={showAdjustModal} clients={clients} onClose={() => { setShowAdjustModal(null); reload(); }} />
    </div>
  );
}

function PromoFormModal({ isOpen, onClose, onSave, zones }) {
  const [form, setForm] = React.useState({ name: '', type: 'primera_compra', discountType: 'porcentaje', discountValue: 10, minQuantity: 0, zoneId: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => { e.preventDefault(); if (!form.name.trim()) return; onSave(form); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva promoción" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Nombre" required><input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls()} placeholder="Ej: Primera compra -10%" required /></FormField>
        <FormField label="Tipo">
          <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls()}>
            <option value="primera_compra">Primera compra</option>
            <option value="volumen">Por volumen</option>
            <option value="zona">Por zona</option>
            <option value="referido">Referido</option>
          </select>
        </FormField>
        {form.type === 'zona' && (
          <FormField label="Zona">
            <select value={form.zoneId} onChange={e => set('zoneId', e.target.value)} className={inputCls()}>
              <option value="">Seleccionar zona</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </FormField>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo de descuento">
            <select value={form.discountType} onChange={e => set('discountType', e.target.value)} className={inputCls()}>
              <option value="porcentaje">Porcentaje</option>
              <option value="producto_gratis">Producto gratis</option>
              <option value="descuento_fijo">Monto fijo</option>
            </select>
          </FormField>
          <FormField label="Valor">
            <input type="number" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} className={inputCls()} min="0" />
          </FormField>
        </div>
        {form.type === 'volumen' && (
          <FormField label="Cantidad mínima"><input type="number" value={form.minQuantity} onChange={e => set('minQuantity', e.target.value)} className={inputCls()} min="1" /></FormField>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant="primary" icon="plus">Crear promoción</Btn>
        </div>
      </form>
    </Modal>
  );
}

function PointsAdjustModal({ client, clients, onClose }) {
  const [selectedId, setSelectedId] = React.useState('');
  const [amount, setAmount] = React.useState(10);
  const [action, setAction] = React.useState('add');
  const [desc, setDesc] = React.useState('');

  React.useEffect(() => {
    if (client && client.id) setSelectedId(client.id);
    else setSelectedId('');
    setAmount(10); setAction('add'); setDesc('');
  }, [client]);

  if (!client) return null;
  const selectedClient = clients.find(c => c.id == selectedId);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    const pts = parseInt(amount);
    if (action === 'add') await DataService.addPoints(selectedId, pts, 'earned', desc || 'Ajuste manual');
    else { const ok = await DataService.redeemPoints(selectedId, pts, desc || 'Canje manual'); if (!ok) { alert('Puntos insuficientes'); return; } }
    onClose();
  };

  return (
    <Modal isOpen={!!client} onClose={onClose} title="Ajustar puntos" size="sm">
      <form onSubmit={submit} className="space-y-4">
        {!client.id && (
          <FormField label="Cliente">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls()}>
              <option value="">Seleccionar cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.points || 0} pts)</option>)}
            </select>
          </FormField>
        )}
        {selectedClient && (
          <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">{selectedClient.name}</p>
            <p className="font-bold text-amber-600">{selectedClient.points || 0} pts actuales</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Operación">
            <select value={action} onChange={e => setAction(e.target.value)} className={inputCls()}>
              <option value="add">Sumar puntos</option>
              <option value="redeem">Canjear puntos</option>
            </select>
          </FormField>
          <FormField label="Cantidad">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls()} min="1" />
          </FormField>
        </div>
        <FormField label="Descripción"><input value={desc} onChange={e => setDesc(e.target.value)} className={inputCls()} placeholder="Ej: Premio, ajuste, canje bidón..." /></FormField>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Btn type="button" onClick={onClose} variant="secondary">Cancelar</Btn>
          <Btn type="submit" variant={action === 'add' ? 'success' : 'danger'} icon={action === 'add' ? 'plus' : 'minus'}>{action === 'add' ? 'Sumar' : 'Canjear'}</Btn>
        </div>
      </form>
    </Modal>
  );
}
