import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, UserPlus, User, Mail, Lock, Building, Layers, Sun, Moon } from 'lucide-react';
import { authService } from '../services/authService';
import { RegisterData } from '../types/auth';
import { useTheme } from '../context/ThemeContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState<RegisterData>({
    fullName: '',
    email: '',
    department: 'Disaster Emergency Response Cell',
    organization: 'State Disaster Management Authority',
    authorityLevel: 'State',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password && formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.register(formData);
      navigate('/');
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F14] text-slate-900 dark:text-white flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
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

      <div className="w-full max-w-lg space-y-6 relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 dark:bg-[#1B2435] text-white shadow-xl">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Register Authority Account
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Create an official profile for Disaster Response & Relocation Decision Support
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-6 shadow-md space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" /> Full Name & Designation
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Dr. Anita Sharma"
                required
                className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Official Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="anita@sdma.gov.in"
                  required
                  className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" /> Authority Level
                </label>
                <select
                  name="authorityLevel"
                  value={formData.authorityLevel}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500"
                >
                  <option value="National">National Command</option>
                  <option value="State">State SDMA</option>
                  <option value="District">District Disaster Cell</option>
                  <option value="Field Officer">Field Response Unit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" /> Organization Name
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="e.g. Assam SDMA"
                  required
                  className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  Department / Cell
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Flood Monitoring Unit"
                  required
                  className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" /> Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs py-3 shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
            </button>
          </form>
        </div>

        {/* Login redirect link */}
        <div className="text-center text-xs text-slate-500">
          <span>Already registered? </span>
          <Link to="/login" className="font-bold text-slate-900 dark:text-white underline underline-offset-4">
            Sign In to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
};
