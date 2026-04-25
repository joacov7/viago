// NATIVA - Admin authentication screen

function Auth({ onLogin }) {
  const [mode, setMode] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await SupabaseDB.auth.signInWithPassword({ email, password });
      } else {
        result = await SupabaseDB.auth.signUp({ email, password });
        if (!result.error && result.data?.user && !result.data.session) {
          setInfo('Revisá tu email para confirmar la cuenta, luego volvé a iniciar sesión.');
          setLoading(false); return;
        }
      }
      if (result.error) { setError(result.error.message); }
      else { onLogin(result.data.user); }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
            <Icon name="droplets" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">NATIVA</h1>
          <p className="text-slate-500 text-sm mt-1">Panel de administración</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-slate-900 mb-5">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta de administrador'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
          )}
          {info && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">{info}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@tuempresa.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Cargando...' : (mode === 'login' ? 'Entrar' : 'Crear cuenta')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }}
              className="text-sm text-blue-600 hover:text-blue-700">
              {mode === 'login' ? '¿Primera vez? Crear cuenta de administrador' : '¿Ya tenés cuenta? Iniciar sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
