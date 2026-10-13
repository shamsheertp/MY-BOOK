import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Database
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, user, error: authError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const redirectPath = location.state?.from?.pathname || '/';

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isSubmitting, navigate, redirectPath]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setLocalError('');
  };

  const handleQuickFill = (email, password) => {
    setMode('login');
    setFormData((prev) => ({
      ...prev,
      email,
      password,
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError('');
    setSuccessMessage('');

    if (mode === 'login') {
      const res = await login(formData.email, formData.password);
      setIsSubmitting(false);
      if (res.success) {
        navigate(redirectPath, { replace: true });
      } else {
        setLocalError(res.error);
      }
    } else {
      // Register
      if (!formData.name.trim()) {
        setLocalError('Please enter your full name');
        setIsSubmitting(false);
        return;
      }
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters long');
        setIsSubmitting(false);
        return;
      }

      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      });

      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);
      } else {
        setLocalError(res.error);
      }
    }
  };

  const isDbConnectionError =
    (localError && localError.includes('postgres.railway.internal')) ||
    (localError && localError.includes("Can't reach database server"));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8 sm:p-10 transition-all">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/30 mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {mode === 'login'
                ? 'Sign in to access your MY-BOOK accounting dashboard'
                : 'Register a new user account directly into PostgreSQL'}
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          {mode === 'login' && (
            <div className="mb-6 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
              <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Quick-Fill Demo Credentials:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@mybook.com', 'admin123')}
                  className="flex-1 py-1.5 px-2.5 bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-medium border border-indigo-200 transition-all shadow-sm text-center"
                >
                  Admin User
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('accountant@mybook.com', 'accountant123')}
                  className="flex-1 py-1.5 px-2.5 bg-white text-slate-700 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-medium border border-slate-200 transition-all shadow-sm text-center"
                >
                  Accountant
                </button>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {localError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-800">Connection or Auth Error</p>
                <p className="mt-0.5 break-words">{localError}</p>

                {isDbConnectionError && (
                  <div className="mt-2.5 pt-2 border-t border-rose-200/80 text-[11px] text-rose-800">
                    <div className="flex items-center gap-1 font-semibold text-amber-800">
                      <Database className="w-3.5 h-3.5" />
                      Tip for Railway PostgreSQL:
                    </div>
                    <p className="mt-1 text-slate-700">
                      <code>postgres.railway.internal</code> is only reachable inside Railway. For local development, copy the <strong>Public URL</strong> from Railway (e.g. <code>postgresql://postgres:...@roundhouse.proxy.rlwy.net:PORT/railway</code>) into <code>backend/.env</code>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Alex Johnson"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {mode === 'login' ? 'Email or Username' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={mode === 'login' ? 'admin or admin@mybook.com' : 'admin@mybook.com'}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setLocalError('');
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline ml-1 cursor-pointer"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setLocalError('');
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline ml-1 cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}

            <div className="mt-4">
              <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                ← Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
