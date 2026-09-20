import React from 'react';
import { EvacuationImpactSummary } from '../../types/intelligence';
import { formatNumber } from '../../utils/formatters';
import {
  Users,
  Navigation,
  Clock,
  Compass,
  Route as RouteIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { mockRoutePopulationData } from '../../data/evacuationImpact';

interface RouteImpactPanelProps {
  impact: EvacuationImpactSummary;
  roadAClosed: boolean;
  onToggleRoadA: () => void;
  onSelectAlternative: (routeId: string) => void;
  isAlternativeSelected: boolean;
}

export const RouteImpactPanel: React.FC<RouteImpactPanelProps> = ({
  impact,
  roadAClosed,
  onToggleRoadA,
  onSelectAlternative,
  isAlternativeSelected
}) => {
  return (
    <div className="space-y-5">
      {/* Interactive Road Closure Toggle Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#263246]">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Simulation Control
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Simulate Road Closure</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test infrastructure resilience when Main Arterial Route A (NH-15) fails
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Main Road A:
            </span>
            <button
              onClick={onToggleRoadA}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                roadAClosed
                  ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {roadAClosed ? 'CLOSED 🚧 (Simulated)' : 'OPEN ✓'}
            </button>
          </div>
        </div>

        {/* 4 Quick Impact Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Users className="h-4 w-4 text-red-500" />
              <span className="text-[11px] font-semibold">Affected Pop.</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {formatNumber(impact.affectedPopulation)}
            </p>
            <span className="text-[10px] text-slate-400">
              {roadAClosed ? 'Directly stranded/diverted' : 'Normal flow'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <RouteIcon className="h-4 w-4 text-amber-500" />
              <span className="text-[11px] font-semibold">Routes Affected</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {impact.routesAffected}
            </p>
            <span className="text-[10px] text-slate-400">Corridors impacted</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Navigation className="h-4 w-4 text-blue-500" />
              <span className="text-[11px] font-semibold">Extra Distance</span>
            </div>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">
              +{impact.additionalDistanceKm} km
            </p>
            <span className="text-[10px] text-slate-400">Via bypass loop</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-[11px] font-semibold">Extra Travel Time</span>
            </div>
            <p className="text-lg font-black text-purple-600 dark:text-purple-400">
              +{impact.additionalTravelTimeMin} min
            </p>
            <span className="text-[10px] text-slate-400">Convoy transit delay</span>
          </div>
        </div>
      </div>

      {/* Route Comparison & Recommended Alternative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Route Comparison Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Corridor Comparison (Before vs After)
            </h4>
            <span className="text-[11px] text-slate-500">Route A vs Detour</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/50 dark:bg-[#151B2B]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Before Failure:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                  Route A: OPEN
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Distance: <span className="font-semibold text-slate-900 dark:text-white">6.2 km</span> • Time: <span className="font-semibold text-slate-900 dark:text-white">12 min</span>
              </p>
            </div>

            <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-red-600 dark:text-red-400">After Closure:</span>
                <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 font-bold text-[10px]">
                  Route A: CLOSED
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Alternative Route B: <span className="font-semibold text-slate-900 dark:text-white">11.0 km</span> • Time: <span className="font-semibold text-slate-900 dark:text-white">23 min</span>
              </p>
              <div className="mt-2 pt-2 border-t border-red-200/60 dark:border-red-900/30 flex items-center justify-between text-[11px] font-bold text-red-600 dark:text-red-400">
                <span>Additional Distance: +4.8 km</span>
                <span>Additional Time: +11 min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Alternative Card */}
        <div className="rounded-2xl border border-blue-500/20 bg-white dark:bg-[#151B2B] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#263246]">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recommended Alternative
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-extrabold text-[10px]">
                OPTIMAL DETOUR
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {impact.recommendedAlternative.name}
              </h5>
              <div className="grid grid-cols-3 gap-2 py-2">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/60 border border-slate-200 dark:border-[#263246]">
                  <span className="text-[10px] text-slate-500 block">Distance</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {impact.recommendedAlternative.distanceKm} km
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/60 border border-slate-200 dark:border-[#263246]">
                  <span className="text-[10px] text-slate-500 block">Travel Time</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {impact.recommendedAlternative.travelTimeMin} min
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/60 border border-slate-200 dark:border-[#263246]">
                  <span className="text-[10px] text-slate-500 block">Accessibility</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {impact.recommendedAlternative.accessibility}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Paved bypass ridge corridor safely 12m above high water mark with two-way capacity.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#263246]">
            <button
              onClick={() => onSelectAlternative(impact.recommendedAlternative.routeId)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAlternativeSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>
                {isAlternativeSelected
                  ? 'Alternative Route Highlighted on Map'
                  : 'View Alternative Route'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Affected Population Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="mb-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Population Dependent on Corridors
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Headcount exposed if respective corridor suffers inundation
          </p>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockRoutePopulationData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '11px'
                }}
              />
              <Bar dataKey="population" radius={[0, 4, 4, 0]}>
                {mockRoutePopulationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
