import React from 'react';
import { RiskLevel } from '../../types/habitation';
import { getRiskColorClass } from '../../utils/formatters';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  pulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showPulse = false, pulse = false }) => {
  const isPulsing = showPulse || pulse;
  const styles = getRiskColorClass(level);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wide',
    lg: 'px-3.5 py-1.5 text-sm font-bold tracking-wider'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]}`}
    >
      {isPulsing && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.badgeBg}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.badgeBg}`}></span>
        </span>
      )}
      {level}
    </span>
  );
};
