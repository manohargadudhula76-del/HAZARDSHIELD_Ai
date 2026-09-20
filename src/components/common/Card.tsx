import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] text-slate-900 dark:text-[#F8FAFC] shadow-sm transition-colors duration-200 ${className}`}
    >
      {children}
    </div>
  );
};
