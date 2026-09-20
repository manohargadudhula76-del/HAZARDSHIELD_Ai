import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F14] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 mb-6">
        <AlertTriangle className="h-16 w-16" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="h-6 w-6 text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">HAZARDSHIELD AI</span>
      </div>
      <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">Page Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
        The command center module you requested could not be located. It may have been moved or does not exist.
      </p>
      <button
        onClick=
{() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </button>
    </div>
  );
};
