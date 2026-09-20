import React from 'react';
import { ScenarioResultMetrics } from '../../types/intelligence';
import { RiskBadge } from '../common/RiskBadge';
import { formatNumber } from '../../utils/formatters';
import { ArrowRight, TrendingUp, TrendingDown, Info, ShieldAlert } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface ScenarioComparisonProps {
  beforeMetrics: ScenarioResultMetrics;
  afterMetrics: ScenarioResultMetrics;
  riskDelta: number;
  percentageChange: number;
  explanation: string;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  beforeMetrics,
  afterMetrics,
  riskDelta,
  percentageChange,
  explanation
}) => {
  // Chart comparison data
  const chartData = [
    {
      metric: 'Risk Score',
      Before: beforeMetrics.riskScore,
      After: afterMetrics.riskScore
    },
    {
      metric: 'Pop. at Risk (/100)',
      Before: Math.round(beforeMetrics.populationAtRisk / 100),
      After: Math.round(afterMetrics.populationAtRisk / 100)
    },
    {
      metric: 'Evac. Vulnerability',
      Before: beforeMetrics.evacuationAccess === 'GOOD' ? 30 : 60,
      After:
        afterMetrics.evacuationAccess === 'CRITICAL FAILURE'
          ? 95
          : afterMetrics.evacuationAccess === 'POOR'
          ? 80
          : afterMetrics.evacuationAccess === 'MODERATE'
          ? 55
          : 30
    },
    {
      metric: 'Shelter Stress',
      Before: beforeMetrics.shelterCapacityStatus === 'SUFFICIENT' ? 35 : 50,
      After:
        afterMetrics.shelterCapacityStatus === 'CRITICAL DEFICIT'
          ? 95
          : afterMetrics.shelterCapacityStatus === 'INSUFFICIENT'
          ? 80
          : afterMetrics.shelterCapacityStatus === 'STRAINED'
          ? 60
          : 35
    }
  ];

  const isRiskIncreased = riskDelta > 0;

  return (
    <div className="space-y-5">
      {/* Risk Delta Banner */}
      <div
        className={`rounded-2xl p-5 border shadow-xl transition-all ${
          isRiskIncreased
            ? 'border-red-500/30 bg-red-500/10 dark:bg-red-950/20'
            : riskDelta < 0
            ? 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20'
            : 'border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isRiskIncreased
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isRiskIncreased ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Simulated Impact Delta
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Risk {isRiskIncreased ? 'increased by' : 'decreased by'}:{' '}
                <span className={isRiskIncreased ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {riskDelta > 0 ? `+${riskDelta}` : riskDelta} points
                </span>{' '}
                <span className="text-sm font-bold opacity-80">
                  ({percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`})
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Baseline → Simulated</span>
              <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                {beforeMetrics.riskScore} → <span className="text-red-600 dark:text-red-400 text-base">{afterMetrics.riskScore}</span> / 100
              </span>
            </div>
            {/* Visual Mini Progress Bar */}
            <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  afterMetrics.riskScore >= 85
                    ? 'bg-red-600'
                    : afterMetrics.riskScore >= 70
                    ? 'bg-orange-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${afterMetrics.riskScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Before vs After Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Simulation Result: Before → After Comparison
          </h3>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            PROTOTYPE SIMULATION
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#263246] text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-bold">METRIC</th>
                <th className="py-2.5 px-3 font-bold">BEFORE (BASELINE)</th>
                <th className="py-2.5 px-1 text-center w-8"></th>
                <th className="py-2.5 px-3 font-bold">AFTER (SIMULATED)</th>
                <th className="py-2.5 px-3 font-bold text-right">NET CHANGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]">
              {/* Risk Score */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  Risk Score
                </td>
                <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                  {beforeMetrics.riskScore} / 100
                </td>
                <td className="py-3 px-1 text-center text-slate-400">
                  <ArrowRight className="h-3.5 w-3.5 mx-auto" />
                </td>
                <td className="py-3 px-3 font-black text-red-600 dark:text-red-400 text-sm">
                  {afterMetrics.riskScore} / 100
                </td>
                <td className="py-3 px-3 text-right font-bold text-red-600 dark:text-red-400">
                  +{riskDelta} pts
                </td>
              </tr>

              {/* Risk Level */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                  Risk Level
                </td>
                <td className="py-3 px-3">
                  <RiskBadge level={beforeMetrics.riskLevel} size="sm" />
                </td>
                <td className="py-3 px-1 text-center text-slate-400">
                  <ArrowRight className="h-3.5 w-3.5 mx-auto" />
                </td>
                <td className="py-3 px-3">
                  <RiskBadge level={afterMetrics.riskLevel} size="sm" />
                </td>
                <td className="py-3 px-3 text-right text-slate-500">
                  {afterMetrics.riskLevel !== beforeMetrics.riskLevel ? 'Escalated' : 'Unchanged'}
                </td>
              </tr>

              {/* Population at Risk */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                  Population at Risk
                </td>
                <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                  {formatNumber(beforeMetrics.populationAtRisk)}
                </td>
                <td className="py-3 px-1 text-center text-slate-400">
                  <ArrowRight className="h-3.5 w-3.5 mx-auto" />
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                  {formatNumber(afterMetrics.populationAtRisk)}
                </td>
                <td className="py-3 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                  +{formatNumber(afterMetrics.populationAtRisk - beforeMetrics.populationAtRisk)}
                </td>
              </tr>

              {/* Evacuation Access */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                  Evacuation Access
                </td>
                <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                  {beforeMetrics.evacuationAccess}
                </td>
                <td className="py-3 px-1 text-center text-slate-400">
                  <ArrowRight className="h-3.5 w-3.5 mx-auto" />
                </td>
                <td className="py-3 px-3 font-bold text-red-600 dark:text-red-400">
                  {afterMetrics.evacuationAccess}
                </td>
                <td className="py-3 px-3 text-right text-red-500 font-semibold">
                  Degraded
                </td>
              </tr>

              {/* Shelter Capacity */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                  Shelter Capacity
                </td>
                <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                  {beforeMetrics.shelterCapacityStatus}
                </td>
                <td className="py-3 px-1 text-center text-slate-400">
                  <ArrowRight className="h-3.5 w-3.5 mx-auto" />
                </td>
                <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-400">
                  {afterMetrics.shelterCapacityStatus}
                </td>
                <td className="py-3 px-3 text-right text-amber-500 font-semibold">
                  Deficit
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Explanation Card */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Why Did Risk Change?
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Comparison Chart (Recharts) */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Risk Before vs After Simulation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-dimensional stress response comparative analysis
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Before" fill="#64748B" radius={[4, 4, 0, 0]} name="Baseline (Before)" />
              <Bar dataKey="After" fill="#EF4444" radius={[4, 4, 0, 0]} name="Simulated (After)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
