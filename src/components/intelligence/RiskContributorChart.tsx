import React from 'react';
import { RiskContributor } from '../../types/intelligence';

interface RiskContributorChartProps {
  contributors: RiskContributor[];
  title?: string;
}

export const RiskContributorChart: React.FC<RiskContributorChartProps> = ({
  contributors,
  title = 'Risk Contributors'
}) => {
  const totalPercentage = contributors.reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Relative weight contribution to composite hazard score (Sum = {totalPercentage}%)
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20">
          Total: {totalPercentage}%
        </span>
      </div>

      {/* Horizontal Stacked Strip */}
      <div className="w-full h-4 rounded-full overflow-hidden flex shadow-inner mb-6 bg-slate-100 dark:bg-slate-800">
        {contributors.map((c) => (
          <div
            key={c.name}
            style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
            title={`${c.name}: ${c.percentage}%`}
            className="h-full transition-all duration-500 hover:brightness-110"
          />
        ))}
      </div>

      {/* Itemized Contributor Rows */}
      <div className="space-y-3.5">
        {contributors.map((c) => (
          <div key={c.name} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {c.description}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-[#263246]">
                  {c.percentage}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
