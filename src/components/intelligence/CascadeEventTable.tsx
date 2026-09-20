import React from 'react';
import { CascadeEventRow } from '../../types/intelligence';
import { RiskBadge } from '../common/RiskBadge';
import { formatNumber } from '../../utils/formatters';

interface CascadeEventTableProps {
  events: CascadeEventRow[];
}

export const CascadeEventTable: React.FC<CascadeEventTableProps> = ({ events }) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cascade Impact Progression Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological audit of trigger events and secondary system disruptions
          </p>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {events.length} Recorded Sequence Steps
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#263246] text-slate-500 dark:text-slate-400 font-bold">
              <th className="py-2.5 px-3">EVENT</th>
              <th className="py-2.5 px-3">TRIGGER</th>
              <th className="py-2.5 px-3">IMPACT</th>
              <th className="py-2.5 px-3">AFFECTED POPULATION</th>
              <th className="py-2.5 px-3">SEVERITY</th>
              <th className="py-2.5 px-3 text-right">ESTIMATED DELAY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-[#0B0F14]/30 transition-colors">
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                  {ev.event}
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                  {ev.trigger}
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {ev.impact}
                </td>
                <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                  {formatNumber(ev.affectedPopulation)}
                </td>
                <td className="py-3 px-3">
                  <RiskBadge level={ev.severity} size="sm" />
                </td>
                <td className="py-3 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                  {ev.estimatedDelay}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
