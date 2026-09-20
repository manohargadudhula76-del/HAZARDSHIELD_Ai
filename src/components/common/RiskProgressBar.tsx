import React from 'react';

interface RiskProgressBarProps {
  label: string;
  value: number; // 0 - 100 or percentage
  max?: number;
  showValueLabel?: boolean;
  statusLabel?: string;
  colorScheme?: 'auto' | 'red' | 'orange' | 'amber' | 'emerald' | 'blue';
}

export const RiskProgressBar: React.FC<RiskProgressBarProps> = ({
  label,
  value,
  max = 100,
  showValueLabel = true,
  statusLabel,
  colorScheme = 'auto'
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  let colorClass = 'bg-emerald-500';
  if (colorScheme === 'auto') {
    if (percentage >= 80) colorClass = 'bg-red-500';
    else if (percentage >= 60) colorClass = 'bg-orange-500';
    else if (percentage >= 40) colorClass = 'bg-amber-500';
    else colorClass = 'bg-emerald-500';
  } else {
    const map = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      amber: 'bg-amber-500',
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500'
    };
    colorClass = map[colorScheme];
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          {statusLabel && <span className="font-semibold text-slate-500 dark:text-slate-400">{statusLabel}</span>}
          {showValueLabel && (
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {value}
              {max === 100 ? '%' : ` / ${max}`}
            </span>
          )}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#263246]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
