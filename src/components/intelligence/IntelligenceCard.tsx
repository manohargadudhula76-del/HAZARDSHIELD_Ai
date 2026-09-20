import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface IntelligenceCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  badgeText: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string; highlight?: boolean }[];
  actionText: string;
  onAction: () => void;
}

export const IntelligenceCard: React.FC<IntelligenceCardProps> = ({
  icon: Icon,
  iconBg,
  iconColor,
  badgeText,
  title,
  subtitle,
  stats,
  actionText,
  onAction
}) => {
  return (
    <div className="group rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor} shadow-md group-hover:scale-105 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {badgeText}
          </span>
        </div>

        {/* Titles */}
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {subtitle}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {stats.map((st, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/50 border border-slate-200/80 dark:border-slate-800/80"
            >
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
                {st.label}
              </span>
              <span
                className={`text-xs font-black block truncate ${
                  st.highlight
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {st.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onAction}
        className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all cursor-pointer group/btn"
      >
        <span>{actionText}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
      </button>
    </div>
  );
};
