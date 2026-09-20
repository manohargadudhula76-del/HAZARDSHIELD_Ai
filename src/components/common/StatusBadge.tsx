import React from 'react';

export interface StatusBadgeProps {
  status: 'Sufficient' | 'Near Limit' | 'Exceeded' | 'Critical' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = 'bg-slate-100 dark:bg-[#263246]';
  let textColor = 'text-slate-700 dark:text-slate-300';
  let dotColor = 'bg-slate-500';

  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes('sufficient') || normalizedStatus.includes('active')) {
    bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
    textColor = 'text-emerald-700 dark:text-emerald-400';
    dotColor = 'bg-emerald-500';
  } else if (normalizedStatus.includes('near limit') || normalizedStatus.includes('moderate')) {
    bgColor = 'bg-amber-50 dark:bg-amber-900/20';
    textColor = 'text-amber-700 dark:text-amber-400';
    dotColor = 'bg-amber-500';
  } else if (normalizedStatus.includes('exceeded') || normalizedStatus.includes('high')) {
    bgColor = 'bg-orange-50 dark:bg-orange-900/20';
    textColor = 'text-orange-700 dark:text-orange-400';
    dotColor = 'bg-orange-500';
  } else if (normalizedStatus.includes('critical') || normalizedStatus.includes('inactive')) {
    bgColor = 'bg-red-50 dark:bg-red-900/20';
    textColor = 'text-red-700 dark:text-red-400';
    dotColor = 'bg-red-500';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
