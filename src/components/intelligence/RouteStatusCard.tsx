import React from 'react';
import { EvacuationFacility } from '../../types/intelligence';
import { Hospital, Home, ShieldCheck, AlertOctagon, CheckCircle2, XCircle } from 'lucide-react';

interface RouteStatusCardProps {
  facilities: EvacuationFacility[];
  roadAClosed: boolean;
}

export const RouteStatusCard: React.FC<RouteStatusCardProps> = ({
  facilities,
  roadAClosed
}) => {
  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'HOSPITAL':
        return <Hospital className="h-4 w-4 text-blue-500" />;
      case 'SHELTER':
        return <Home className="h-4 w-4 text-amber-500" />;
      case 'SAFE_HAVEN':
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      default:
        return <AlertOctagon className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Critical Facility Accessibility Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time reachability status for life-support infrastructure
          </p>
        </div>
        <span
          className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
            roadAClosed
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          }`}
        >
          {roadAClosed ? '1 Severed Link' : 'All Facilities Reachable'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {facilities
          .filter((f) => f.id !== 'fac-hab')
          .map((fac) => {
            const isInaccessible = roadAClosed && fac.id === 'fac-emergency';

            return (
              <div
                key={fac.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isInaccessible
                    ? 'border-red-500/30 bg-red-500/10 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-[#263246] bg-slate-50/70 dark:bg-[#0B0F14]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                      {getFacilityIcon(fac.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {fac.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                        {fac.type.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase ${
                      isInaccessible
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isInaccessible ? (
                      <>
                        <XCircle className="h-3 w-3" />
                        INACCESSIBLE
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        ACCESSIBLE
                      </>
                    )}
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {isInaccessible
                    ? 'Cut off by Route A bridge washout. Boat crossing required.'
                    : fac.description}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
};
