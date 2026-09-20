import React from 'react';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, actions, className = '' }) => {
  return (
    <div className={`flex flex-col bg-white dark:bg-[#151B2B] rounded-xl border border-slate-200 dark:border-[#263246] p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      <div className="flex-1 w-full min-h-0">
        {children}
      </div>
    </div>
  );
};
