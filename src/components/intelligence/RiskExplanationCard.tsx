import React from 'react';
import { RiskExplanationFactor } from '../../types/intelligence';
import {
  AlertTriangle,
  Waves,
  Users,
  NavigationOff,
  History,
  Building2,
  Mountain,
  CloudRain,
  Activity,
  Ship,
  HelpCircle
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

interface RiskExplanationCardProps {
  factors: RiskExplanationFactor[];
  habitationName: string;
}

export const RiskExplanationCard: React.FC<RiskExplanationCardProps> = ({
  factors,
  habitationName
}) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Waves':
        return <Waves className="h-5 w-5 text-blue-500" />;
      case 'Users':
        return <Users className="h-5 w-5 text-amber-500" />;
      case 'NavigationOff':
        return <NavigationOff className="h-5 w-5 text-red-500" />;
      case 'History':
        return <History className="h-5 w-5 text-purple-500" />;
      case 'Building2':
        return <Building2 className="h-5 w-5 text-rose-500" />;
      case 'Mountain':
        return <Mountain className="h-5 w-5 text-amber-600" />;
      case 'CloudRain':
        return <CloudRain className="h-5 w-5 text-cyan-500" />;
      case 'Activity':
        return <Activity className="h-5 w-5 text-red-600" />;
      case 'Ship':
        return <Ship className="h-5 w-5 text-teal-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Why?</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                — Root Drivers for {habitationName}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Key geospatial, infrastructural, and vulnerability triggers explaining the risk score
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#263246]">
          {factors.length} Critical Factors
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {factors.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/70 dark:bg-[#0B0F14]/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
          >
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-[#263246] shrink-0">
              {renderIcon(item.iconName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.factor}
                </h4>
                <RiskBadge level={item.severity} size="sm" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
