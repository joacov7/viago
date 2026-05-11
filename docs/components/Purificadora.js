// NATIVA - Purificadora module (ESP32 ósmosis inversa)
const MEMBRANE_WARN_H = 8760;
const UV_WARN_H       = 9000;

function Purificadora() {
  const DEFAULT_IP = '192.168.1.100';

  const [ip, setIp]               = React.useState(() => localStorage.getItem('nativa_purif_ip') || DEFAULT_IP);
  const [ipInput, setIpInput]     = React.useState(ip);
  const [showSettings, setShowSettings]   = React.useState(false);
  const [showSchedule, setShowSchedule]   = React.useState(false);
  const [showAlarms,   setShowAlarms]     = React.useState(false);
  const [wsStatus, setWsStatus]   = React.useState('disconnected');
  const [data, setData]           = React.useState(null);
  const [cmdPending, setCmdPending] = React.useState(null);
  const [alarmLog, setAlarmLog]   = React.useState([]);
  const [loadingAlarms, setLoadingAlarms] = React.useState(false);

  // Schedule form
  const [schedEnabled, setSchedEnabled] = React.useState(false);
  const [schedOn,  setSchedOn]  = React.useState('08:00');
  const [schedOff, setSchedOff] = React.useState('18:00');

  const wsRef    = React.useRef(null);
  const retryRef = React.useRef(null);

  const connectWs = React.useCallback((espIp) => {
    clearTimeout(retryRef.current);
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    setWsStatus('connecting');
    try {
      const socket = new WebSocket(`ws://${espIp}/ws`);
      wsRef.current = socket;
      socket.onopen    = () => setWsStatus('connected');
      socket.onmessage = (e) => { try { setData(JSON.parse(e.data)); } catch {} };
      socket.onerror   = () => socket.close();
      socket.onclose   = () => {
        setWsStatus('disconnected');
        retryRef.current = setTimeout(() => connectWs(espIp), 4000);
      };
    } catch {
      setWsStatus('disconnected');
      retryRef.current = setTimeout(() => connectWs(espIp), 4000);
    }
  }, []);

  React.useEffect(() => {
    connectWs(ip);
    return () => {
      clearTimeout(retryRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [ip, connectWs]);

  // Sync schedule form when ESP32 data arrives
  React.useEffect(() => {
    if (!data?.schedule) return;
    const s = data.schedule;
    setSchedEnabled(s.enabled);
    setSchedOn(String(s.onH).padStart(2,'0') + ':' + String(s.onM).padStart(2,'0'));
    setSchedOff(String(s.offH).padStart(2,'0') + ':' + String(s.offM).padStart(2,'0'));
  }, [data?.schedule?.enabled, data?.schedule?.onH, data?.schedule?.offH]);

  const saveIp = () => {
    const v = ipInput.trim();
    if (v) { localStorage.setItem('nativa_purif_ip', v); setIp(v); }
    setShowSettings(false);
  };

  const sendCmd = async (cmd) => {
    setCmdPending(cmd);
    try {
      await fetch(`http://${ip}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
      });
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
      await fetch(`http://${ip}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: schedEnabled, onH, onM, offH, offM }),
      });
    } catch (e) { alert('Error: ' + e.message); }
    setShowSchedule(false);
  };

  const resetCounter = async (counter) => {
    const label = counter === 'membrane' ? 'membrana' : 'UV';
    if (!confirm(`¿Resetear contador de ${label}?`)) return;
    try {
      await fetch(`http://${ip}/api/reset_counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counter }),
      });
    } catch (e) { alert('Error: ' + e.message); }
  };

  const fetchAlarms = async () => {
    setLoadingAlarms(true);
    try {
      const res = await fetch(`http://${ip}/api/alarms`);
      setAlarmLog(await res.json());
    } catch { setAlarmLog([]); }
    finally { setLoadingAlarms(false); }
  };

  const openAlarms = () => { setShowAlarms(true); fetchAlarms(); };

  const STATE_CFG = {
    'ESPERA  ': { color: 'bg-slate-100 text-slate-600',   label: 'ESPERA'       },
    'CEBANDO ': { color: 'bg-amber-100 text-amber-700',   label: 'CEBANDO'      },
    'PURIF.  ': { color: 'bg-blue-100 text-blue-700',     label: 'PURIFICANDO'  },
    'LAVADO  ': { color: 'bg-purple-100 text-purple-700', label: 'LAVANDO'      },
    'ALARMA! ': { color: 'bg-red-100 text-red-700',       label: 'ALARMA'       },
    'MANUAL  ': { color: 'bg-orange-100 text-orange-700', label: 'MANUAL'       },
    'STANDBY ': { color: 'bg-slate-100 text-slate-500',   label: 'STANDBY'      },
  };

  const WS_CFG = {
    connecting:   { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-600',   label: 'Conectando...' },
    connected:    { dot: 'bg-emerald-500',             text: 'text-emerald-600', label: 'Conectado'     },
    disconnected: { dot: 'bg-red-500',                 text: 'text-red-600',     label: 'Sin conexión'  },
  };

  const wsCfg    = WS_CFG[wsStatus];
  const stateCfg = data ? (STATE_CFG[data.state] || { color: 'bg-slate-100 text-slate-700', label: data.state?.trim() }) : null;
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wsCfg.dot}`} />
              <span className={`text-xs font-medium ${wsCfg.text}`}>{wsCfg.label}</span>
            </div>
            <Btn variant="secondary" size="sm" icon="settings"
              onClick={() => { setIpInput(ip); setShowSettings(true); }}>
              {ip}
            </Btn>
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

      {/* Sin conexión */}
      {!data && wsStatus !== 'connected' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="droplets" size={28} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">Sin conexión al ESP32</p>
          <p className="text-sm text-slate-400 mb-6">
            Verificá que <strong>{ip}</strong> sea la IP correcta
            y que el dispositivo esté encendido en la red local.
          </p>
          <Btn variant="secondary" size="sm" onClick={() => connectWs(ip)}>Reintentar</Btn>
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
                <Btn variant="ghost" size="sm" onClick={openAlarms}>📋 Historial alarmas</Btn>
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

      {/* Modal IP */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Configuración ESP32" size="sm">
        <div className="space-y-4">
          <FormField label="Dirección IP del ESP32"
            hint="La IP aparece en el monitor serie al arrancar y en el mensaje de Telegram.">
            <input autoFocus type="text" value={ipInput}
              onChange={e => setIpInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveIp()}
              className={inputCls()} placeholder="192.168.1.100" />
          </FormField>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" onClick={() => setShowSettings(false)}>Cancelar</Btn>
            <Btn variant="primary"   onClick={saveIp}>Guardar</Btn>
          </div>
        </div>
      </Modal>

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
        {loadingAlarms ? (
          <p className="text-sm text-slate-400 py-6 text-center">Cargando...</p>
        ) : alarmLog.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm font-medium text-slate-600 mb-1">Sin alarmas registradas</p>
            <p className="text-xs text-slate-400">El sistema no ha generado alarmas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {alarmLog.map((entry, i) => (
              <div key={i} className="py-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{entry.msg}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{entry.ts}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
