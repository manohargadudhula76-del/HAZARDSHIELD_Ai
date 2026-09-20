import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badgeText?: string;
  actionButton?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  actionButton
}) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-slate-200 dark:border-[#263246]">
      <div>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {badgeText && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>

      {actionButton && <div className="flex items-center gap-2">{actionButton}</div>}
    </div>
  );
};
