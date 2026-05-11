function PurificadoraPanel() {
  const DEFAULT_IP = '192.168.1.100';

  const [ip, setIp]             = React.useState(() => localStorage.getItem('purif_esp32_ip') || DEFAULT_IP);
  const [ipInput, setIpInput]   = React.useState(ip);
  const [showIpEdit, setShowIpEdit] = React.useState(false);
  const [wsStatus, setWsStatus] = React.useState('disconnected');
  const [data, setData]         = React.useState(null);
  const [cmdPending, setCmdPending] = React.useState(null);

  const wsRef      = React.useRef(null);
  const retryRef   = React.useRef(null);

  // ── WebSocket ────────────────────────────────────────────
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

  const saveIp = () => {
    const v = ipInput.trim();
    if (v) { localStorage.setItem('purif_esp32_ip', v); setIp(v); }
    setShowIpEdit(false);
  };

  // ── REST command ─────────────────────────────────────────
  const sendCmd = async (cmd) => {
    setCmdPending(cmd);
    try {
      const res = await fetch(`http://${ip}/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (e) {
      alert('Error al enviar comando: ' + e.message);
    } finally {
      setCmdPending(null);
    }
  };

  // ── Helpers visuales ─────────────────────────────────────
  const STATE_CFG = {
    'ESPERA  ': { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'ESPERA'       },
    'CEBANDO ': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'CEBANDO'      },
    'PURIF.  ': { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'PURIFICANDO'  },
    'LAVADO  ': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'LAVANDO'      },
    'ALARMA! ': { bg: 'bg-red-100',    text: 'text-red-700',    label: 'ALARMA'       },
    'MANUAL  ': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'MANUAL'       },
  };

  const WS_CFG = {
    connecting:   { dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-600', label: 'Conectando...' },
    connected:    { dot: 'bg-green-500',                text: 'text-green-700',  label: 'Conectado'    },
    disconnected: { dot: 'bg-red-500',                  text: 'text-red-700',    label: 'Desconectado' },
  };

  const wsCfg    = WS_CFG[wsStatus];
  const stateCfg = data ? (STATE_CFG[data.state] || { bg: 'bg-gray-100', text: 'text-gray-700', label: data.state }) : null;
  const relays   = data?.relays;
  const floats   = data?.floats;
  const isAlarm  = data?.state?.trim() === 'ALARMA!';
  const isManual = data?.state?.trim() === 'MANUAL';
  const isPurif  = ['PURIF.', 'CEBANDO'].includes(data?.state?.trim());

  // ── Sub-componentes ───────────────────────────────────────
  const SensorCard = ({ label, value, unit, warn }) => (
    <div className={`card p-4 ${warn ? 'border-red-300 bg-red-50' : ''}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? 'text-red-600' : 'text-gray-900'}`}>
        {value ?? '—'}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </p>
    </div>
  );

  const FloatDot = ({ label, active }) => (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
        ${active ? 'bg-cyan-100 text-cyan-700 ring-2 ring-cyan-300' : 'bg-gray-100 text-gray-400'}`}>
        {active ? '●' : '○'}
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );

  const RelayChip = ({ label, on }) => (
    <div className={`px-2 py-1 rounded text-xs font-medium text-center border
      ${on ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${on ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
      {label}
    </div>
  );

  const Btn = ({ cmd, children, variant = 'secondary', disabled = false }) => {
    const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    const variants = {
      primary:   'bg-blue-600 hover:bg-blue-700 text-white',
      danger:    'bg-red-600 hover:bg-red-700 text-white',
      warning:   'bg-amber-500 hover:bg-amber-600 text-white',
      purple:    'bg-purple-600 hover:bg-purple-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border',
    };
    return (
      <button
        onClick={() => sendCmd(cmd)}
        disabled={disabled || cmdPending === cmd || wsStatus !== 'connected'}
        className={`${base} ${variants[variant]}`}
      >
        {cmdPending === cmd ? '...' : children}
      </button>
    );
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6" data-name="purificadora-panel" data-file="components/PurificadoraPanel.js">

      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-xl text-white">💧</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Purificadora de Agua</h2>
            <p className="text-sm text-gray-500">Ósmosis inversa — Panel de control</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Estado conexión */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${wsCfg.dot}`}></span>
            <span className={`text-sm font-medium ${wsCfg.text}`}>{wsCfg.label}</span>
          </div>

          {/* IP del ESP32 */}
          {showIpEdit ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={ipInput}
                onChange={e => setIpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveIp()}
                className="border rounded-lg px-2 py-1 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="192.168.1.100"
              />
              <button onClick={saveIp} className="btn-primary text-xs py-1 px-3">OK</button>
              <button onClick={() => setShowIpEdit(false)} className="btn-secondary text-xs py-1 px-2">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setIpInput(ip); setShowIpEdit(true); }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 border rounded-lg px-3 py-1"
            >
              <span className="icon-settings text-xs"></span>
              {ip}
            </button>
          )}
        </div>
      </div>

      {/* Banner de alarma */}
      {isAlarm && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-700 font-medium">
            <span>⚠️</span>
            <span>ALARMA: {data?.alarm || 'Ver display'}</span>
          </div>
          <div className="flex gap-2">
            <Btn cmd="alarma_off"   variant="secondary">Silenciar</Btn>
            <Btn cmd="alarma_reset" variant="warning">Resetear</Btn>
          </div>
        </div>
      )}

      {/* Sin conexión */}
      {!data && wsStatus !== 'connected' && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🔌</p>
          <p className="text-lg font-medium text-gray-700 mb-1">Sin conexión al ESP32</p>
          <p className="text-sm text-gray-500 mb-4">
            Verifica que <strong>{ip}</strong> sea la IP correcta y que el dispositivo esté encendido.
          </p>
          <button onClick={() => connectWs(ip)} className="btn-secondary text-sm py-2 px-4">
            Reintentar conexión
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Fila estado + sensores principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card col-span-2 flex items-center gap-4">
              <span className={`px-4 py-2 rounded-lg text-base font-bold ${stateCfg?.bg} ${stateCfg?.text}`}>
                {stateCfg?.label}
              </span>
              <span className="text-sm text-gray-500">
                Modo:{' '}
                <strong className={data.autoMode ? 'text-blue-600' : 'text-orange-600'}>
                  {data.autoMode ? 'Automático' : 'Manual'}
                </strong>
              </span>
            </div>
            <SensorCard label="TDS Entrada" value={data.tdsIn}  unit="ppm" />
            <SensorCard label="TDS Salida"  value={data.tdsOut} unit="ppm" warn={data.tdsOut > 50} />
          </div>

          {/* Cuerpo principal: 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Col 1: Presión + Flotantes */}
            <div className="space-y-4">
              <SensorCard
                label="Presión"
                value={typeof data.pressure === 'number' ? data.pressure.toFixed(2) : '—'}
                unit="bar"
                warn={data.pressure > 8.5 || (isPurif && data.pressure < 1.5)}
              />
              <div className="card">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Niveles de agua</p>
                <div className="flex justify-around">
                  <FloatDot label="Cisterna"   active={floats?.cisterna} />
                  <FloatDot label="Nivel bajo" active={floats?.tankLow}  />
                  <FloatDot label="Nivel alto" active={floats?.tankHigh} />
                </div>
              </div>
            </div>

            {/* Col 2: Estado de relés */}
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Estado de relés</p>
              <div className="grid grid-cols-2 gap-2">
                <RelayChip label="B. Alim"   on={relays?.alim}  />
                <RelayChip label="B. HP"     on={relays?.hp}    />
                <RelayChip label="Solenoide" on={relays?.sol}   />
                <RelayChip label="UV"        on={relays?.uv}    />
                <RelayChip label="Lavado 1"  on={relays?.lav1}  />
                <RelayChip label="Lavado 2"  on={relays?.lav2}  />
                <RelayChip label="Lavado 3"  on={relays?.lav3}  />
                <RelayChip label="Alarma"    on={relays?.alarm} />
              </div>
            </div>

            {/* Col 3: Controles */}
            <div className="card space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Control del sistema</p>

              <div className="flex flex-col gap-2">
                {!isPurif
                  ? <Btn cmd="encender" variant="primary"    disabled={isAlarm}>▶ Iniciar purificación</Btn>
                  : <Btn cmd="apagar"   variant="danger"             >⏹ Detener sistema</Btn>
                }
                <Btn cmd="lavar" variant="purple" disabled={isPurif || isAlarm}>
                  🪣 Ciclo lavado bidones
                </Btn>
              </div>

              <hr className="border-gray-100" />

              <div>
                {!isManual
                  ? <Btn cmd="manual" variant="secondary">🔧 Modo manual</Btn>
                  : <Btn cmd="auto"   variant="secondary">🤖 Modo automático</Btn>
                }
              </div>

              {/* Controles manuales de relés */}
              {isManual && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-gray-500 uppercase mb-2">Relés manuales</p>
                  {[
                    { on: 'alim_on', off: 'alim_off', label: 'B. Alim',    active: relays?.alim },
                    { on: 'hp_on',   off: 'hp_off',   label: 'B. HP',      active: relays?.hp   },
                    { on: 'sol_on',  off: 'sol_off',  label: 'Solenoide',  active: relays?.sol  },
                    { on: 'uv_on',   off: 'uv_off',   label: 'UV',         active: relays?.uv   },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{r.label}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => sendCmd(r.on)}
                          disabled={r.active || cmdPending === r.on}
                          className={`px-2 py-1 text-xs rounded border transition-colors disabled:opacity-40
                            ${r.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50'}`}
                        >ON</button>
                        <button
                          onClick={() => sendCmd(r.off)}
                          disabled={!r.active || cmdPending === r.off}
                          className="px-2 py-1 text-xs rounded border bg-white text-gray-600 border-gray-300 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >OFF</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
