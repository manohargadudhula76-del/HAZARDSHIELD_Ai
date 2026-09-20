import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  trend?: string;
  isWarning?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-500/10 dark:bg-blue-900/30',
  iconTextColor = 'text-blue-500',
  trend,
  isWarning = false
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 shadow-md hover:shadow-lg ${
        isWarning
          ? 'bg-red-50/60 dark:bg-[#151B2B] border-red-300 dark:border-red-500/40'
          : 'bg-white dark:bg-[#151B2B] border-slate-200 dark:border-[#263246] hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {subtitle}
            {trend && <span className="font-semibold text-emerald-600 dark:text-emerald-400">{trend}</span>}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColor} ${iconTextColor} border border-slate-200/50 dark:border-white/5`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {isWarning && (
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500" />
      )}
    </div>
  );
};
