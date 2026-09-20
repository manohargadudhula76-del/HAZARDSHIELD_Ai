import React from 'react';
import { CascadeStage } from '../../types/intelligence';
import { CascadeNode } from './CascadeNode';
import { ArrowRight, ArrowDown } from 'lucide-react';

interface CascadeFlowProps {
  stages: CascadeStage[];
}

export const CascadeFlow: React.FC<CascadeFlowProps> = ({ stages }) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-6 border-b border-slate-200 dark:border-[#263246] gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Primary Hazard to Compound Failure Sequence</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Systemic shockwave propagation from initial hydrometeorological trigger to social crisis
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          6-Stage Propagation Pipeline
        </span>
      </div>

      {/* Responsive Cascade Flow: Grid with intermediate connectors on desktop, vertical stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          return (
            <div key={stage.id} className="relative flex flex-col">
              <CascadeNode stage={stage} isLast={isLast} />
              {/* Connector hint on desktop */}
              {!isLast && (
                <div className="hidden xl:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
