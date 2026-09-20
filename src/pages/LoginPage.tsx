import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogIn, Lock, Mail, Sparkles, ShieldCheck, ArrowRight, Sun, Moon } from 'lucide-react';
import { authService, DEMO_USER } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('admin@hazardshield.gov.in');
  const [password, setPassword] = useState('demo123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your official email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.login({ email, password });
      navigate('/');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    await authService.demoLogin();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F14] text-slate-900 dark:text-white flex flex-col justify-center items-center p-4 relative transition-colors duration-200">
      {/* Top Right Icon-Only Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="relative group p-2.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1B2435] transition-all duration-200 shadow-sm cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 dark:bg-[#1B2435] text-white shadow-xl ring-2 ring-slate-700">
            <ShieldAlert className="h-9 w-9 text-white" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
              HAZARD<span className="text-slate-400">SHIELD</span> <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-[#1B2435] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#263246]">AI</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Intelligent Disaster Risk Assessment and Relocation Decision Support System
            </p>
          </div>
        </div>

        {/* Quick Demo Login Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-md text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Official Government Quick Demo Access</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            One-click authentication with pre-loaded Authority credentials ({DEMO_USER.fullName}).
          </p>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs py-3 shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{loading ? 'Authenticating Access...' : 'Launch Quick Demo Login'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-[#263246] w-full" />
          <span className="bg-slate-50 dark:bg-[#0B0F14] px-3 text-[10px] uppercase font-bold text-slate-500">Or Login with Credentials</span>
        </div>

        {/* Standard Login Form */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-6 shadow-md space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>Official Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@hazardshield.gov.in"
                required
                className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Security Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs py-3 shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? 'Verifying Credentials...' : 'Sign In to Command Center'}</span>
            </button>
          </form>
        </div>

        {/* Footer Register Link */}
        <div className="text-center text-xs text-slate-500">
          <span>Don&apos;t have an authority account yet? </span>
          <Link to="/register" className="font-bold text-slate-900 dark:text-white underline underline-offset-4">
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
};
