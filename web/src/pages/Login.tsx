import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username_or_email: usernameOrEmail, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950
                    flex items-center justify-center p-4">

      {/* Background cross pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 shadow-lg
                          flex items-center justify-center mb-4
                          ring-4 ring-primary-500/20">
            <span className="text-white text-2xl font-bold">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sanctus</h1>
          <p className="text-slate-400 text-sm mt-1">Parish Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-modal">

          <h2 className="text-lg font-semibold text-white mb-5">Sign in to continue</h2>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-red-500/10 border border-red-500/20
                            text-red-300 px-3.5 py-3 rounded-lg text-sm animate-fade-in">
              <span className="mt-0.5 text-red-400">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder="admin@parish.org"
                  className="w-full pl-9 pr-3 py-2.5 text-sm
                             bg-white/8 border border-white/10 rounded-lg
                             text-white placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                             transition-colors duration-150"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm
                             bg-white/8 border border-white/10 rounded-lg
                             text-white placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                             transition-colors duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2
                         py-2.5 px-4 mt-2
                         bg-primary-600 hover:bg-primary-500
                         text-white text-sm font-semibold rounded-lg
                         shadow-lg shadow-primary-600/25
                         transition-all duration-150 active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Sanctus Parish Management System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;