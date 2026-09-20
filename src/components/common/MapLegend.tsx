import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#263246] bg-white/95 dark:bg-[#151B2B]/95 p-3 shadow-lg backdrop-blur-md text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-[10px]">Hazard Risk Index</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/30" />
          <span className="text-slate-800 dark:text-slate-300 font-semibold">Critical (80-100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-500 ring-2 ring-orange-500/30" />
          <span className="text-slate-800 dark:text-slate-300 font-semibold">High (65-79)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
          <span className="text-slate-800 dark:text-slate-300 font-semibold">Moderate (45-64)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
          <span className="text-slate-800 dark:text-slate-300 font-semibold">Safe (&lt;45)</span>
        </div>
      </div>
    </div>
  );
};
