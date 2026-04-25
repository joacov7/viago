// NATIVA - Admin authentication: simple password, no Supabase Auth required

function Auth({ onLogin }) {
  const [loading, setLoading] = React.useState(true);
  const [isFirstTime, setIsFirstTime] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [newPass, setNewPass] = React.useState('');
  const [confirmPass, setConfirmPass] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [supabaseError, setSupabaseError] = React.useState(false);

  React.useEffect(() => {
    DataService.getConfig().then(cfg => {
      setIsFirstTime(!cfg.adminPassword);
      setLoading(false);
    }).catch(err => {
      console.error('Supabase error:', err);
      setSupabaseError(true);
      setLoading(false);
    });
  }, []);

  const hash = async (str) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const cfg = await DataService.getConfig();
      if (!cfg.adminPassword) {
        setIsFirstTime(true); setSaving(false); return;
      }
      const hashed = await hash(password);
      if (hashed === cfg.adminPassword) {
        sessionStorage.setItem('nativa_admin_ok', '1');
        onLogin();
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con Supabase. Verificá la clave en supabaseClient.js');
    }
    setSaving(false);
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (newPass !== confirmPass) { setError('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      const hashed = await hash(newPass);
      const cfg = await DataService.getConfig();
      await DataService.saveConfig({ ...cfg, adminPassword: hashed });
      sessionStorage.setItem('nativa_admin_ok', '1');
      onLogin();
    } catch (err) {
      console.error(err);
      setError('Error al guardar en Supabase. Verificá la clave y que la tabla config exista.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (supabaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <Icon name="droplets" size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="alertCircle" size={20} className="text-red-500 flex-shrink-0" />
              <h2 className="font-semibold text-slate-900">Error de conexión con Supabase</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              La clave de Supabase no es válida. Seguí estos pasos:
            </p>
            <ol className="text-sm text-slate-700 space-y-2 mb-4 list-decimal list-inside">
              <li>Entrá a <strong>supabase.com/dashboard</strong></li>
              <li>Seleccioná tu proyecto</li>
              <li>Andá a <strong>Settings → API</strong></li>
              <li>Copiá la clave <strong>"anon public"</strong> (empieza con <code className="bg-gray-100 px-1 rounded">eyJ...</code>)</li>
              <li>Reemplazá el valor de <code className="bg-gray-100 px-1 rounded">SUPABASE_ANON_KEY</code> en <code className="bg-gray-100 px-1 rounded">utils/supabaseClient.js</code></li>
            </ol>
            <button onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <Icon name="droplets" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
          <p className="text-slate-500 text-sm mt-1">Panel de administración</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {isFirstTime ? (
            <>
              <h2 className="font-semibold text-slate-900 mb-1">Primera vez</h2>
              <p className="text-xs text-slate-500 mb-5">Creá una contraseña para acceder al panel de administración</p>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva contraseña</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres" required minLength={6} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Repetí la contraseña" required />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {saving ? 'Guardando...' : 'Crear contraseña y entrar'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-slate-900 mb-5">Iniciar sesión</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••" required autoFocus />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {saving ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
