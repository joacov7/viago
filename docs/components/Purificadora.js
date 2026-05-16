// NATIVA - Purificadora module (Supabase cloud bridge)
const MEMBRANE_WARN_H = 8760;
const UV_WARN_H       = 9000;

const _PURIF_URL = 'https://ezxfgawujagatrqylyvo.supabase.co';
const _PURIF_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eGZnYXd1amFnYXRycXlseXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODQwMDEsImV4cCI6MjA5MjY2MDAwMX0.KLda0-iEnFWrN90GMzlkpZrC3d_aGVJUjnuhBP3EcuQ';

function Purificadora() {
  const [showSchedule, setShowSchedule] = React.useState(false);
  const [showAlarms,   setShowAlarms]   = React.useState(false);
  const [connStatus,   setConnStatus]   = React.useState('disconnected');
  const [data,         setData]         = React.useState(null);
  const [cmdPending,   setCmdPending]   = React.useState(null);

  // Schedule form
  const [schedEnabled, setSchedEnabled] = React.useState(false);
  const [schedOn,  setSchedOn]  = React.useState('08:00');
  const [schedOff, setSchedOff] = React.useState('18:00');

  const pollRef = React.useRef(null);
  const lastUpd = React.useRef(0);

  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch(
        `${_PURIF_URL}/rest/v1/purif_status?device_id=eq.main`,
        { headers: { apikey: _PURIF_KEY, Authorization: `Bearer ${_PURIF_KEY}` } }
      );
      if (!res.ok) return;
      const rows = await res.json();
      if (rows.length > 0) {
        const raw = rows[0].payload;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        setData(parsed);
        lastUpd.current = Date.now();
      }
    } catch {}
  }, []);

  // Poll status every 2 s
  React.useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  // Update connection badge based on data age
  React.useEffect(() => {
    const tick = setInterval(() => {
      if (lastUpd.current === 0)                          setConnStatus('disconnected');
      else if (Date.now() - lastUpd.current < 8000)       setConnStatus('connected');
      else if (Date.now() - lastUpd.current < 20000)      setConnStatus('slow');
      else                                                 setConnStatus('disconnected');
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Sync schedule form when fresh data arrives
  React.useEffect(() => {
    if (!data?.schedule) return;
    const s = data.schedule;
    setSchedEnabled(s.enabled);
    setSchedOn(String(s.onH).padStart(2,'0') + ':' + String(s.onM).padStart(2,'0'));
    setSchedOff(String(s.offH).padStart(2,'0') + ':' + String(s.offM).padStart(2,'0'));
  }, [data?.schedule?.enabled, data?.schedule?.onH, data?.schedule?.offH]);

  const _postCmd = async (body) => {
    const res = await fetch(`${_PURIF_URL}/rest/v1/purif_commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: _PURIF_KEY,
        Authorization: `Bearer ${_PURIF_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  };

  const sendCmd = async (cmd) => {
    setCmdPending(cmd);
    try {
      await _postCmd({ cmd });
    } catch (e) {
      alert('Error al enviar comando: ' + e.message);
    } finally {
      setCmdPending(null);
    }
  };

  const saveSchedule = async () => {
    const [onH, onM]   = schedOn.split(':').map(Number);
    const [offH, offM] = schedOff.split(':').map(Number);
    try {
      await _postCmd({ cmd: 'set_schedule', params: { enabled: schedEnabled, onH, onM, offH, offM } });
    } catch (e) { alert('Error: ' + e.message); }
    setShowSchedule(false);
  };

  const resetCounter = async (counter) => {
    const label = counter === 'membrane' ? 'membrana' : 'UV';
    if (!confirm(`¿Resetear contador de ${label}?`)) return;
    try {
      await _postCmd({ cmd: counter === 'membrane' ? 'reset_membrane' : 'reset_uv' });
    } catch (e) { alert('Error: ' + e.message); }
  };

  const STATE_CFG = {
    'ESPERA  ': { color: 'bg-slate-100 text-slate-600',   label: 'ESPERA'       },
    'CEBANDO ': { color: 'bg-amber-100 text-amber-700',   label: 'CEBANDO'      },
    'PURIF.  ': { color: 'bg-blue-100 text-blue-700',     label: 'PURIFICANDO'  },
    'LAVADO  ': { color: 'bg-purple-100 text-purple-700', label: 'LAVANDO'      },
    'ALARMA! ': { color: 'bg-red-100 text-red-700',       label: 'ALARMA'       },
    'MANUAL  ': { color: 'bg-orange-100 text-orange-700', label: 'MANUAL'       },
    'STANDBY ': { color: 'bg-slate-100 text-slate-500',   label: 'STANDBY'      },
  };

  const CONN_CFG = {
    connected:    { dot: 'bg-emerald-500',             text: 'text-emerald-600', label: 'En línea'        },
    slow:         { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-600',   label: 'Respuesta lenta' },
    disconnected: { dot: 'bg-red-500',                 text: 'text-red-600',     label: 'Sin conexión'    },
  };

  const connCfg   = CONN_CFG[connStatus];
  const stateCfg  = data ? (STATE_CFG[data.state] || { color: 'bg-slate-100 text-slate-700', label: data.state?.trim() }) : null;
  const relays    = data?.relays;
  const floats    = data?.floats;
  const isAlarm   = data?.state?.trim() === 'ALARMA!';
  const isManual  = data?.state?.trim() === 'MANUAL';
  const isStandby = data?.state?.trim() === 'STANDBY';
  const isPurif   = ['PURIF.', 'CEBANDO'].includes(data?.state?.trim());
  const memHours  = data ? (data.memSec || 0) / 3600 : 0;
  const uvHours   = data ? (data.uvSec  || 0) / 3600 : 0;

  return (
    <div>
      <PageHeader
        title="Purificadora"
        subtitle="Control ESP32 — Ósmosis inversa en tiempo real"
        action={
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connCfg.dot}`} />
            <span className={`text-xs font-medium ${connCfg.text}`}>{connCfg.label}</span>
          </div>
        }
      />

      {/* Banner de alarma */}
      {isAlarm && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
            <Icon name="alertCircle" size={16} />
            ALARMA: {data?.alarm || 'Ver display del ESP32'}
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={() => sendCmd('alarma_off')}>Silenciar</Btn>
            <Btn variant="danger"    size="sm" onClick={() => sendCmd('alarma_reset')}>Resetear</Btn>
          </div>
        </div>
      )}

      {/* Sin datos */}
      {!data && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="droplets" size={28} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">Sin datos del ESP32</p>
          <p className="text-sm text-slate-400">
            Verificá que el ESP32 esté encendido y conectado a WiFi.<br />
            Los datos se actualizan automáticamente cada 5 segundos.
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-4">

          {/* Fila estado + sensores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${stateCfg?.color}`}>
                {stateCfg?.label}
              </span>
              <span className="text-sm text-slate-500">
                Modo:{' '}
                <strong className={data.autoMode ? 'text-blue-600' : 'text-orange-600'}>
                  {data.autoMode ? 'Automático' : 'Manual'}
                </strong>
              </span>
              {data.time && (
                <span className="ml-auto text-sm font-mono text-slate-400">{data.time}</span>
              )}
            </div>
            <PurifSensorCard label="TDS Entrada" value={data.tdsIn}  unit="ppm" />
            <PurifSensorCard label="TDS Salida"  value={data.tdsOut} unit="ppm" warn={data.tdsOut > 50} />
          </div>

          {/* Cuerpo: 3 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Col 1: Presión + Flotantes */}
            <div className="space-y-4">
              <PurifSensorCard
                label="Presión"
                value={typeof data.pressure === 'number' ? data.pressure.toFixed(2) : '—'}
                unit="bar"
                warn={data.pressure > 8.5 || (isPurif && data.pressure < 1.5)}
              />
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Niveles</p>
                <div className="flex justify-around">
                  <PurifFloat label="Cisterna" active={floats?.cisterna} />
                  <PurifFloat label="Bajo"     active={floats?.tankLow}  />
                  <PurifFloat label="Alto"     active={floats?.tankHigh} />
                </div>
              </div>
            </div>

            {/* Col 2: Relés */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Estado relés</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ['B. Alim',   relays?.alim],
                  ['B. HP',     relays?.hp],
                  ['Solenoide', relays?.sol],
                  ['UV',        relays?.uv],
                  ['Lavado 1',  relays?.lav1],
                  ['Lavado 2',  relays?.lav2],
                  ['Lavado 3',  relays?.lav3],
                  ['Alarma',    relays?.alarm],
                ].map(([label, on]) => (
                  <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium
                    ${on ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Col 3: Controles */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Control</p>
              <div className="space-y-2">
                {!isPurif
                  ? <Btn variant="primary" className="w-full justify-center" disabled={isAlarm}
                      onClick={() => sendCmd('encender')}>
                      {cmdPending === 'encender' ? 'Iniciando...' : '▶ Iniciar purificación'}
                    </Btn>
                  : <Btn variant="danger" className="w-full justify-center"
                      onClick={() => sendCmd('apagar')}>
                      {cmdPending === 'apagar' ? 'Deteniendo...' : '⏹ Detener sistema'}
                    </Btn>
                }
                <Btn variant="secondary" className="w-full justify-center"
                  disabled={isPurif || isAlarm} onClick={() => sendCmd('lavar')}>
                  {cmdPending === 'lavar' ? 'Iniciando...' : '🪣 Lavado de bidones'}
                </Btn>
              </div>
              <hr className="border-gray-100" />
              <div className="flex flex-wrap gap-1">
                {!isManual
                  ? <Btn variant="ghost" size="sm" onClick={() => sendCmd('manual')}>🔧 Manual</Btn>
                  : <Btn variant="ghost" size="sm" onClick={() => sendCmd('auto')}>🤖 Auto</Btn>
                }
                {!isStandby
                  ? <Btn variant="ghost" size="sm" onClick={() => sendCmd('standby')}>💤 Standby</Btn>
                  : <Btn variant="ghost" size="sm" onClick={() => sendCmd('auto')}>⏺ Activar</Btn>
                }
              </div>
              {isManual && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <p className="text-xs text-slate-400 mb-2">Relés manuales</p>
                  {[
                    { on: 'alim_on', off: 'alim_off', label: 'B. Alim',   active: relays?.alim },
                    { on: 'hp_on',   off: 'hp_off',   label: 'B. HP',     active: relays?.hp   },
                    { on: 'sol_on',  off: 'sol_off',  label: 'Solenoide', active: relays?.sol  },
                    { on: 'uv_on',   off: 'uv_off',   label: 'UV',        active: relays?.uv   },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{r.label}</span>
                      <div className="flex gap-1">
                        <button onClick={() => sendCmd(r.on)} disabled={r.active}
                          className={`px-2 py-1 text-xs rounded-lg border transition-colors disabled:opacity-40
                            ${r.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-gray-200 hover:border-blue-300'}`}>
                          ON
                        </button>
                        <button onClick={() => sendCmd(r.off)} disabled={!r.active}
                          className="px-2 py-1 text-xs rounded-lg border bg-white text-slate-600 border-gray-200 hover:border-red-300 transition-colors disabled:opacity-40">
                          OFF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mantenimiento + Programación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Mantenimiento */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Mantenimiento</p>
                <Btn variant="ghost" size="sm" onClick={() => setShowAlarms(true)}>📋 Historial alarmas</Btn>
              </div>
              <div className="space-y-5">
                <PurifCounter
                  label="Membrana RO"
                  hours={memHours}
                  warnH={MEMBRANE_WARN_H}
                  onReset={() => resetCounter('membrane')}
                />
                <PurifCounter
                  label="Lámpara UV"
                  hours={uvHours}
                  warnH={UV_WARN_H}
                  onReset={() => resetCounter('uv')}
                />
              </div>
            </div>

            {/* Programación horaria */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Programación horaria</p>
                <Btn variant="secondary" size="sm" onClick={() => setShowSchedule(true)}>Configurar</Btn>
              </div>
              {data.schedule ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${data.schedule.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={`text-sm font-medium ${data.schedule.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {data.schedule.enabled ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {data.schedule.enabled && (
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs text-slate-400">Encendido</p>
                        <p className="text-2xl font-mono font-bold text-slate-800">
                          {String(data.schedule.onH).padStart(2,'0')}:{String(data.schedule.onM).padStart(2,'0')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Apagado</p>
                        <p className="text-2xl font-mono font-bold text-slate-800">
                          {String(data.schedule.offH).padStart(2,'0')}:{String(data.schedule.offM).padStart(2,'0')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Sin datos de programación</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal programación */}
      <Modal isOpen={showSchedule} onClose={() => setShowSchedule(false)} title="Programación horaria" size="sm">
        <div className="space-y-5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setSchedEnabled(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${schedEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${schedEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {schedEnabled ? 'Programación activa' : 'Programación inactiva'}
            </span>
          </label>
          <div className={`grid grid-cols-2 gap-4 transition-opacity ${!schedEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <FormField label="Hora de encendido">
              <input type="time" value={schedOn} onChange={e => setSchedOn(e.target.value)}
                className={inputCls()} />
            </FormField>
            <FormField label="Hora de apagado">
              <input type="time" value={schedOff} onChange={e => setSchedOff(e.target.value)}
                className={inputCls()} />
            </FormField>
          </div>
          <p className="text-xs text-slate-400">
            El ESP32 usa NTP para sincronizar la hora automáticamente (UTC-3, Argentina).
          </p>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" onClick={() => setShowSchedule(false)}>Cancelar</Btn>
            <Btn variant="primary"   onClick={saveSchedule}>Guardar</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal historial alarmas */}
      <Modal isOpen={showAlarms} onClose={() => setShowAlarms(false)} title="Historial de alarmas" size="md">
        <div className="py-10 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-medium text-slate-600 mb-1">No disponible en modo nube</p>
          <p className="text-xs text-slate-400">
            El historial se almacena localmente en el ESP32.<br />
            Accedé a la IP local del dispositivo para verlo.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function PurifSensorCard({ label, value, unit, warn }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 ${warn ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? 'text-red-600' : 'text-slate-900'}`}>
        {value ?? '—'}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function PurifFloat({ label, active }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
        ${active ? 'bg-blue-100 ring-2 ring-blue-300' : 'bg-slate-100'}`}>
        <Icon name="droplets" size={18} className={active ? 'text-blue-600' : 'text-slate-400'} />
      </div>
      <span className="text-xs text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

function PurifCounter({ label, hours, warnH, onReset }) {
  const pct     = Math.min(100, (hours / warnH) * 100);
  const isWarn  = hours >= warnH;
  const isClose = hours >= warnH * 0.8;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold tabular-nums ${isWarn ? 'text-red-600' : 'text-slate-800'}`}>
            {hours.toFixed(0)} h
          </span>
          <button onClick={onReset}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors px-1 py-0.5 rounded">
            Reset
          </button>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500
            ${isWarn ? 'bg-red-500' : isClose ? 'bg-amber-400' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {isWarn
          ? '⚠️ Revisar reemplazo'
          : `${(warnH - hours).toFixed(0)} h restantes (de ${warnH.toLocaleString()} h recomendadas)`}
      </p>
    </div>
  );
}
