import { RiskLevel } from '../types/habitation';

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function getRiskColorClass(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  hex: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-500/10 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/30',
        badgeBg: 'bg-red-600 text-white',
        hex: '#EF4444'
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-500/10 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500/30',
        badgeBg: 'bg-orange-500 text-white',
        hex: '#F97316'
      };
    case 'MODERATE':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        badgeBg: 'bg-amber-500 text-white',
        hex: '#F59E0B'
      };
    case 'LOW':
    case 'SAFE':
    default:
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        badgeBg: 'bg-emerald-600 text-white',
        hex: '#10B981'
      };
  }
}
