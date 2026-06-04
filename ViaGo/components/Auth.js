// NATIVA - Admin authentication via Supabase Auth (email + password)

// Module-level rate limit state — persists across re-renders
const _loginState = { attempts: 0, lockedUntil: 0 };

// Signup only accessible via ?setup=1 in the URL
const _setupMode = new URLSearchParams(window.location.search).get('setup') === '1';

function Auth({ onLogin }) {
  const [loading, setLoading]         = React.useState(true);
  const [mode, setMode]               = React.useState('login'); // 'login' | 'signup' | 'check-email' | 'conn-error'
  const [email, setEmail]             = React.useState('');
  const [password, setPassword]       = React.useState('');
  const [confirmPass, setConfirmPass] = React.useState('');
  const [error, setError]             = React.useState('');
  const [saving, setSaving]           = React.useState(false);
  const [lockSecs, setLockSecs]       = React.useState(0);

  React.useEffect(() => {
    DataService.getSession().then(session => {
      if (session) { onLogin(); return; }
      if (_setupMode) setMode('signup');
      setLoading(false);
    }).catch(() => {
      setMode('conn-error');
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    if (!lockSecs) return;
    const t = setTimeout(() => setLockSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [lockSecs]);

  const isLocked = () => {
    const now = Date.now();
    if (_loginState.lockedUntil > now) {
      const rem = Math.ceil((_loginState.lockedUntil - now) / 1000);
      setLockSecs(rem);
      setError(`Demasiados intentos fallidos. Esperá ${rem} segundos.`);
      return true;
    }
    return false;
  };

  const recordFail = () => {
    _loginState.attempts++;
    if (_loginState.attempts >= 5) {
      _loginState.lockedUntil = Date.now() + 60000;
      _loginState.attempts = 0;
      setLockSecs(60);
      setError('Demasiados intentos fallidos. Esperá 60 segundos.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked()) return;
    setError(''); setSaving(true);
    try {
      await DataService.signIn(email, password);
      _loginState.attempts = 0;
      onLogin();
    } catch (err) {
      recordFail();
      if (err.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.');
      } else {
        setError('Error al conectar: ' + err.message);
      }
    }
    setSaving(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirmPass) { setError('Las contraseñas no coinciden.'); return; }
    setSaving(true);
    try {
      const result = await DataService.signUp(email, password);
      if (result.session) {
        onLogin();
      } else {
        setMode('check-email');
      }
    } catch (err) {
      if (err.message.includes('rate limit') || err.message.includes('Email rate limit')) {
        setError('Demasiadas solicitudes. Esperá unos minutos.');
      } else {
        setError('Error al crear cuenta: ' + err.message);
      }
    }
    setSaving(false);
  };

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
        <Icon name="droplets" size={32} className="text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
      <p className="text-slate-500 text-sm mt-1">Panel de administración</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'conn-error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Logo />
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="alertCircle" size={20} className="text-red-500 flex-shrink-0" />
              <h2 className="font-semibold text-slate-900">Error de conexión con Supabase</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Verificá que la clave de Supabase sea correcta en <code className="bg-gray-100 px-1 rounded">utils/supabaseClient.js</code>.
            </p>
            <ol className="text-sm text-slate-700 space-y-2 mb-4 list-decimal list-inside">
              <li>Entrá a <strong>supabase.com/dashboard</strong></li>
              <li>Seleccioná tu proyecto → <strong>Settings → API</strong></li>
              <li>Copiá la clave <strong>"anon public"</strong></li>
              <li>Pegala como <code className="bg-gray-100 px-1 rounded">SUPABASE_ANON_KEY</code></li>
            </ol>
            <button onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'check-email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Logo />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="mail" size={28} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-slate-900 mb-2">Confirmá tu email</h2>
            <p className="text-sm text-slate-600 mb-5">
              Enviamos un link a <strong>{email}</strong>. Hacé clic en él para activar tu cuenta y luego volvé aquí.
            </p>
            <button onClick={() => { setMode('login'); setPassword(''); setConfirmPass(''); }}
              className="w-full py-2.5 border border-gray-200 text-slate-700 font-medium rounded-xl hover:bg-gray-50">
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
              <Icon name="alertCircle" size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <h2 className="font-semibold text-slate-900 mb-5">Iniciar sesión</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@tuempresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••" />
                </div>
                <button type="submit" disabled={saving || lockSecs > 0}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {saving ? 'Verificando...' : lockSecs > 0 ? `Esperá ${lockSecs}s` : 'Entrar'}
                </button>
              </form>
              <p className="text-center text-xs text-slate-400 mt-5">
                Gestioná usuarios en Supabase Dashboard → Authentication → Users
              </p>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-slate-900 mb-1">Crear cuenta de administrador</h2>
              <p className="text-xs text-slate-500 mb-5">Primera configuración. Usarás este email y contraseña para ingresar al panel.</p>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@tuempresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Repetí la contraseña" />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {saving ? 'Creando cuenta...' : 'Crear cuenta y entrar'}
                </button>
              </form>
              <p className="text-center text-xs text-slate-400 mt-5">
                <button onClick={() => { setMode('login'); setError(''); }}
                  className="text-blue-600 hover:underline font-medium">
                  ← Ya tengo cuenta
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


  // Check existing session on mount
  React.useEffect(() => {
    DataService.getSession().then(session => {
      if (session) { onLogin(); return; }
      setLoading(false);
    }).catch(() => {
      setMode('conn-error');
      setLoading(false);
    });
  }, []);

  // Countdown ticker when rate-limited
  React.useEffect(() => {
    if (!lockSecs) return;
    const t = setTimeout(() => setLockSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [lockSecs]);

  const isLocked = () => {
    const now = Date.now();
    if (_loginState.lockedUntil > now) {
      const rem = Math.ceil((_loginState.lockedUntil - now) / 1000);
      setLockSecs(rem);
      setError(`Demasiados intentos fallidos. Esperá ${rem} segundos.`);
      return true;
    }
    return false;
  };

  const recordFail = () => {
    _loginState.attempts++;
    if (_loginState.attempts >= 5) {
      _loginState.lockedUntil = Date.now() + 60000;
      _loginState.attempts = 0;
      setLockSecs(60);
      setError('Demasiados intentos fallidos. Esperá 60 segundos.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked()) return;
    setError(''); setSaving(true);
    try {
      await DataService.signIn(email, password);
      _loginState.attempts = 0;
      onLogin();
    } catch (err) {
      recordFail();
      if (err.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.');
      } else {
        setError('Error al conectar: ' + err.message);
      }
    }
    setSaving(false);
  };

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
        <Icon name="droplets" size={32} className="text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
      <p className="text-slate-500 text-sm mt-1">Panel de administración</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'conn-error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Logo />
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="alertCircle" size={20} className="text-red-500 flex-shrink-0" />
              <h2 className="font-semibold text-slate-900">Error de conexión con Supabase</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Verificá que la clave de Supabase sea correcta en <code className="bg-gray-100 px-1 rounded">utils/supabaseClient.js</code>.
            </p>
            <ol className="text-sm text-slate-700 space-y-2 mb-4 list-decimal list-inside">
              <li>Entrá a <strong>supabase.com/dashboard</strong></li>
              <li>Seleccioná tu proyecto → <strong>Settings → API</strong></li>
              <li>Copiá la clave <strong>"anon public"</strong></li>
              <li>Pegala como <code className="bg-gray-100 px-1 rounded">SUPABASE_ANON_KEY</code></li>
            </ol>
            <button onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
              <Icon name="alertCircle" size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <h2 className="font-semibold text-slate-900 mb-5">Iniciar sesión</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@tuempresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••" />
                </div>
                <button type="submit" disabled={saving || lockSecs > 0}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {saving ? 'Verificando...' : lockSecs > 0 ? `Esperá ${lockSecs}s` : 'Entrar'}
                </button>
              </form>
              <p className="text-center text-xs text-slate-400 mt-5">
                Gestioná usuarios en Supabase Dashboard → Authentication → Users
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
