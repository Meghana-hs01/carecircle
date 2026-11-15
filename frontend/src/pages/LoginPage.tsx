import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ELDERLY') {
        navigate('/elderly-dashboard');
      } else if (user.role === 'FAMILY_MEMBER') {
        navigate('/family-dashboard');
      } else {
        navigate('/caretaker-dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('CareCircle2026!');
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(demoEmail, 'CareCircle2026!');
      if (loggedUser.role === 'ELDERLY') {
        navigate('/elderly-dashboard');
      } else if (loggedUser.role === 'FAMILY_MEMBER') {
        navigate('/family-dashboard');
      } else {
        navigate('/caretaker-dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
            <Heart className="w-7 h-7 fill-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">CareCircle</span>
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome back to CareCircle
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to access your shared healthcare ecosystem
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-3xl shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Persona Fill */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center mb-2.5">
              Instant Hackathon Demo Login
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('kausalya@carecircle.demo')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-800 text-xs font-bold transition flex flex-col items-center gap-1 shadow-xs hover:shadow-sm disabled:opacity-50"
              >
                <span className="text-lg">👵</span>
                <span className="font-bold text-slate-900">Kausalya</span>
                <span className="text-[10px] text-teal-700 font-semibold uppercase bg-teal-100/60 px-1.5 py-0.5 rounded">Elderly</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('pooja@carecircle.demo')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-800 text-xs font-bold transition flex flex-col items-center gap-1 shadow-xs hover:shadow-sm disabled:opacity-50"
              >
                <span className="text-lg">👩‍💼</span>
                <span className="font-bold text-slate-900">Pooja</span>
                <span className="text-[10px] text-sky-700 font-semibold uppercase bg-sky-100/60 px-1.5 py-0.5 rounded">Family</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('rajesh@carecircle.demo')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 text-xs font-bold transition flex flex-col items-center gap-1 shadow-xs hover:shadow-sm disabled:opacity-50"
              >
                <span className="text-lg">👨‍⚕️</span>
                <span className="font-bold text-slate-900">Rajesh</span>
                <span className="text-[10px] text-emerald-700 font-semibold uppercase bg-emerald-100/60 px-1.5 py-0.5 rounded">Nurse</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-teal-700 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
