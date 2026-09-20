import React, { useEffect, useState, useMemo } from 'react';
import {
  Scale,
  Building2,
  Droplets,
  HeartPulse,
  Shield,
  Navigation,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  BarChart3,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { AIInsightCard } from '../components/common/AIInsightCard';
import { RiskProgressBar } from '../components/common/RiskProgressBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { HabitationCarryingCapacity, ResourceMetric } from '../types/carryingCapacity';
import { carryingCapacityService } from '../services/carryingCapacityService';
import { habitationService } from '../services/habitationService';
import { Habitation } from '../types/habitation';
import { formatNumber } from '../utils/formatters';
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

const iconCategoryMap: Record<string, React.ReactNode> = {
  Population: <Users className="h-4 w-4 text-blue-500" />,
  Housing: <Building2 className="h-4 w-4 text-indigo-500" />,
  Water: <Droplets className="h-4 w-4 text-cyan-500" />,
  Healthcare: <HeartPulse className="h-4 w-4 text-rose-500" />,
  Shelter: <Shield className="h-4 w-4 text-amber-500" />,
  Evacuation: <Navigation className="h-4 w-4 text-emerald-500" />
};

export const CarryingCapacityPage: React.FC = () => {
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [selectedHabitationId, setSelectedHabitationId] = useState<string>('hab-001');
  const [capacityData, setCapacityData] = useState<HabitationCarryingCapacity | null>(null);
  const [allCapacityData, setAllCapacityData] = useState<Record<string, HabitationCarryingCapacity>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initData() {
      const habs = await habitationService.getHabitations();
      setHabitations(habs);

      // Load capacity data for all habitations
      const capacityMap: Record<string, HabitationCarryingCapacity> = {};
      for (const h of habs) {
        const cap = await carryingCapacityService.getCarryingCapacity(h.id);
        if (cap) capacityMap[h.id] = cap;
      }
      setAllCapacityData(capacityMap);
      setCapacityData(capacityMap['hab-001'] || null);
      setLoading(false);
    }
    initData();
  }, []);

  const handleHabitationChange = async (id: string) => {
    setSelectedHabitationId(id);
    if (allCapacityData[id]) {
      setCapacityData(allCapacityData[id]);
    } else {
      const cap = await carryingCapacityService.getCarryingCapacity(id);
      if (cap) setCapacityData(cap);
    }
  };

  // Aggregated KPIs across all habitations
  const totalSites = habitations.length;
  const sitesExceeded = habitations.filter(h => h.carryingCapacityPercentage > 100).length;
  const sitesNearLimit = habitations.filter(h => h.carryingCapacityPercentage >= 90 && h.carryingCapacityPercentage <= 100).length;
  const sitesSafe = habitations.filter(h => h.carryingCapacityPercentage < 90).length;

  // Chart 1 data: Population vs Available Safe Capacity for top habitations
  const popVsCapacityChartData = useMemo(() => {
    return habitations.slice(0, 7).map(h => {
      const cap = allCapacityData[h.id];
      const safeThreshold = cap ? cap.safePopulationThreshold : Math.round(h.population * 0.75);
      return {
        name: h.name.split(' ')[0], // First word for concise axis label
        CurrentPopulation: h.population,
        SafeThreshold: safeThreshold
      };
    });
  }, [habitations, allCapacityData]);

  // Chart 2 data: Resource utilization percentage in selected habitation
  const resourceDistData = useMemo(() => {
    if (!capacityData) return [];
    return capacityData.resourceMetrics.map(r => ({
      resource: r.name.length > 14 ? r.name.slice(0, 14) + '…' : r.name,
      Utilization: r.utilizationPercentage,
      Category: r.category
    }));
  }, [capacityData]);

  // Capacity score (100 = optimal, 0 = critical deficit)
  const capacityScore = capacityData
    ? Math.max(0, Math.min(100, Math.round(200 - capacityData.overallCapacityPercentage)))
    : 50;

  const isSuitableForMore = capacityData && capacityData.overallCapacityPercentage < 95;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carrying Capacity Assessment"
        subtitle="Evaluate whether vulnerable habitations and candidate relocation havens can sustainably support population loads."
        icon={Scale}
        badgeText="Resource Threshold Engine • Prototype Data"
      />

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Assessed Sites"
          value={totalSites.toString()}
          subtitle="Monitored settlements & safe havens"
          icon={Layers}
          iconBgColor="bg-blue-500/10"
          iconTextColor="text-blue-500"
        />
        <StatCard
          title="Capacity Available"
          value={`${sitesSafe} Sites`}
          subtitle="Can accommodate relocated citizens"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-500/10"
          iconTextColor="text-emerald-500"
        />
        <StatCard
          title="Capacity Exceeded"
          value={`${sitesExceeded} Sites`}
          subtitle="Operating above safe environmental limit"
          icon={AlertTriangle}
          iconBgColor="bg-red-500/10"
          iconTextColor="text-red-500"
          isWarning={true}
        />
        <StatCard
          title="Near Safe Limit"
          value={`${sitesNearLimit} Sites`}
          subtitle="90% - 100% carrying load stress"
          icon={TrendingDown}
          iconBgColor="bg-amber-500/10"
          iconTextColor="text-amber-500"
        />
      </div>

      {/* Habitation Selector Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Select Habitation:
          </span>
          <select
            value={selectedHabitationId}
            onChange={e => handleHabitationChange(e.target.value)}
            className="rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {habitations.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.district}, {h.state}) - {h.carryingCapacityPercentage}% Load
              </option>
            ))}
          </select>
        </div>

        {capacityData && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">
              Safe Population Threshold: <strong className="text-emerald-600 dark:text-emerald-400">{formatNumber(capacityData.safePopulationThreshold)} Residents</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-[#263246] pl-4">
              Current Resident Load: <strong className="text-red-600 dark:text-red-400">{formatNumber(capacityData.totalPopulation)} Residents</strong>
            </span>
          </div>
        )}
      </div>

      {loading || !capacityData ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Habitation Carrying Capacity Hero Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
                Carrying Capacity Index
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{capacityData.habitationName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{capacityData.district}, {capacityData.state}</p>

              <div className="pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isSuitableForMore
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  {isSuitableForMore ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {isSuitableForMore
                    ? 'Site can accommodate additional relocated population'
                    : 'Site is unsuitable for additional population (Relocation Required)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Capacity Score Gauge / Metric */}
              <div className="text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Capacity Score</span>
                <span className={`text-4xl font-black tracking-tight ${
                  capacityScore < 50 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {capacityScore}/100
                </span>
                <span className="text-[10px] text-slate-400 block">Civic & natural resilience</span>
              </div>

              <div className="text-center border-l border-slate-200 dark:border-[#263246] pl-6">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Stress Level</span>
                <span className="text-4xl font-black text-red-600 dark:text-red-500 tracking-tight">
                  {capacityData.overallCapacityPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 block">of environmental limit</span>
              </div>
            </div>
          </div>

          {/* 6 Resource Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capacityData.resourceMetrics.map((res: ResourceMetric) => (
              <div
                key={res.id}
                className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                      {iconCategoryMap[res.category] || <Scale className="h-4 w-4 text-blue-500" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{res.name}</h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{res.category} Resource</span>
                    </div>
                  </div>
                  <StatusBadge status={res.status === 'EXCEEDED' ? 'Exceeded' : res.status === 'NEAR LIMIT' ? 'Near Limit' : 'Sufficient'} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-[#0B0F14]/40 p-2 rounded-lg border border-slate-100 dark:border-transparent">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Current Demand</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatNumber(res.currentDemand)} {res.unit}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0B0F14]/40 p-2 rounded-lg border border-slate-100 dark:border-transparent">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Available Capacity</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(res.availableCapacity)} {res.unit}</span>
                  </div>
                </div>

                <RiskProgressBar
                  label="Resource Utilization"
                  value={res.utilizationPercentage}
                  statusLabel={`${res.utilizationPercentage}% Utilized`}
                />

                <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0B0F14]/30 p-2.5 rounded-lg italic border border-slate-200 dark:border-[#263246]">
                  &quot;{res.notes}&quot;
                </p>
              </div>
            ))}
          </div>

          {/* Dual Charts Section: Population vs Capacity + Resource Utilization Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Population vs Safe Threshold */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span>Population vs Available Safe Capacity</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Comparing resident counts with environmental threshold limits</p>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popVsCapacityChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="CurrentPopulation" fill="#EF4444" name="Current Population" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="SafeThreshold" fill="#10B981" name="Safe Capacity Limit" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Resource Capacity Distribution for current site */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-amber-500" />
                  <span>Resource Stress Index: {capacityData.habitationName}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Utilization percentage across civic resource categories (&gt;100% indicates deficit)</p>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceDistData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" domain={[0, 'dataMax + 20']} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="resource" type="category" width={90} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="Utilization" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Habitation Capacity Assessment Master Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-[#263246]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                  <span>National Habitation Carrying Capacity Roster</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit of resident demands against critical infrastructure limits
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {habitations.length} Habitations Monitored
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-[#263246] dark:bg-[#0B0F14]/70 dark:text-slate-300">
                  <tr>
                    <th className="px-3.5 py-3 font-bold">Location</th>
                    <th className="px-3.5 py-3 font-bold">District / State</th>
                    <th className="px-3.5 py-3 font-bold">Population</th>
                    <th className="px-3.5 py-3 font-bold">Safe Limit</th>
                    <th className="px-3.5 py-3 font-bold">Overall Stress</th>
                    <th className="px-3.5 py-3 font-bold">Status</th>
                    <th className="px-3.5 py-3 font-bold">Relocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#263246]">
                  {habitations.map(h => {
                    const cap = allCapacityData[h.id];
                    const safeLimit = cap ? cap.safePopulationThreshold : Math.round(h.population * 0.75);
                    const statusText = h.carryingCapacityPercentage > 120
                      ? 'Critical'
                      : h.carryingCapacityPercentage > 100
                      ? 'Exceeded'
                      : h.carryingCapacityPercentage >= 90
                      ? 'Near Limit'
                      : 'Sufficient';

                    return (
                      <tr
                        key={h.id}
                        onClick={() => handleHabitationChange(h.id)}
                        className={`cursor-pointer transition-colors ${
                          selectedHabitationId === h.id
                            ? 'bg-blue-50/50 dark:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-white">
                          {h.name}
                        </td>
                        <td className="px-3.5 py-3 text-slate-600 dark:text-slate-400">
                          {h.district}, {h.state}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatNumber(h.population)}
                        </td>
                        <td className="px-3.5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatNumber(safeLimit)}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className={`font-extrabold ${
                            h.carryingCapacityPercentage > 100 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {h.carryingCapacityPercentage}%
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <StatusBadge status={statusText} />
                        </td>
                        <td className="px-3.5 py-3 text-slate-700 dark:text-slate-300">
                          {h.relocationStatus}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Capacity Insight Card */}
          <AIInsightCard
            title="AI Carrying Capacity Synthesis"
            insight={capacityData.aiInsight}
            recommendation={
              isSuitableForMore
                ? 'Site possesses positive capacity margins in housing, safe water, and emergency medical services. Approved as recipient safe haven for regional relocations.'
                : 'Site has breached critical demographic and civic carrying capacity. Immediate diversion of population to designated regional safe havens is mandated.'
            }
            timestamp={capacityData.lastAssessed}
          />
        </div>
      )}
    </div>
  );
};
