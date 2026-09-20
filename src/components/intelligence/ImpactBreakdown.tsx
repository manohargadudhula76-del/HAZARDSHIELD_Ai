import React from 'react';
import { ScenarioImpactBreakdownItem } from '../../types/intelligence';

interface ImpactBreakdownProps {
  items: ScenarioImpactBreakdownItem[];
  totalDelta: number;
}

export const ImpactBreakdown: React.FC<ImpactBreakdownProps> = ({ items, totalDelta }) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Scenario Impact Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Marginal point contributions to overall risk score change
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-black rounded-lg border ${
            totalDelta >= 0
              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          }`}
        >
          Net Impact: {totalDelta >= 0 ? `+${totalDelta}` : totalDelta}
        </span>
      </div>

      <div className="space-y-3.5">
        {items.map((item) => {
          const isPositive = item.delta > 0;
          const isZero = item.delta === 0;
          const barWidth = Math.min(100, Math.max(8, (Math.abs(item.delta) / 15) * 100));

          return (
            <div key={item.driver} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.driver}
                </span>
                <span
                  className={`font-black px-2 py-0.5 rounded border text-xs ${
                    isPositive
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40'
                      : isZero
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-[#263246]'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                  }`}
                >
                  {isPositive ? `+${item.delta} risk` : isZero ? '0 risk' : `${item.delta} risk`}
                </span>
              </div>

              {/* Visual mini bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive ? 'bg-red-500' : isZero ? 'bg-slate-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
