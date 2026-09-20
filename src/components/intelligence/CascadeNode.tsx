import React from 'react';
import { CascadeStage } from '../../types/intelligence';
import { RiskBadge } from '../common/RiskBadge';
import { CloudRain, Waves, Construction, Clock, Building, ShieldAlert } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface CascadeNodeProps {
  stage: CascadeStage;
  isLast?: boolean;
}

export const CascadeNode: React.FC<CascadeNodeProps> = ({ stage }) => {
  const getCategoryIcon = (category: string, stageNum: number) => {
    switch (stageNum) {
      case 1:
        return <CloudRain className="h-5 w-5 text-cyan-500" />;
      case 2:
        return <Waves className="h-5 w-5 text-blue-500" />;
      case 3:
        return <Construction className="h-5 w-5 text-red-500" />;
      case 4:
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 5:
        return <Building className="h-5 w-5 text-purple-500" />;
      case 6:
      default:
        return <ShieldAlert className="h-5 w-5 text-rose-600" />;
    }
  };

  return (
    <div className="relative flex-1 min-w-[200px] p-4 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[11px] font-black text-white dark:text-slate-900 shadow-sm">
            {stage.stageNumber}
          </span>
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {getCategoryIcon(stage.category, stage.stageNumber)}
          </div>
        </div>
        <RiskBadge level={stage.severity} size="sm" />
      </div>

      <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1">
        {stage.title}
      </h4>

      <div className="my-2 p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/60 border border-slate-200 dark:border-[#263246]">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">
          Cascade Metric
        </span>
        <span className="text-sm font-black text-red-600 dark:text-red-400">
          {stage.metric}
        </span>
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
        {stage.impactDescription}
      </p>

      {stage.affectedPopulation && (
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1e2638] flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Exposed Pop:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatNumber(stage.affectedPopulation)}
          </span>
        </div>
      )}
    </div>
  );
};
