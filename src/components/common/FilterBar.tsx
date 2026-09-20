import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
}

export interface FilterBarProps {
  filters: FilterConfig[];
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-[#151B2B] border border-slate-200 dark:border-[#263246] rounded-xl shadow-sm ${className}`}>
      {filters.map((filter) => (
        <div key={filter.id} className="flex flex-col">
          <label htmlFor={filter.id} className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {filter.label}
          </label>
          <select
            id={filter.id}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-[#263246] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};
