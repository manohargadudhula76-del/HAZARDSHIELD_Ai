import React from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';

interface AIInsightCardProps {
  title?: string;
  insight: string;
  recommendation?: string;
  timestamp?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  title = 'AI Risk Intelligence Synthesis',
  insight,
  recommendation,
  timestamp
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#263246] mb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <BrainCircuit className="h-5 w-5 text-amber-500 animate-pulse shrink-0" />
          <span className="font-extrabold tracking-tight">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>AI Intelligence Engine</span>
          {timestamp && <span>• {timestamp}</span>}
        </div>
      </div>

      <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
        {insight}
      </p>

      {recommendation && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#263246] flex items-start gap-2">
          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider shrink-0 mt-0.5">
            Recommended Action:
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{recommendation}</p>
        </div>
      )}
    </div>
  );
};
