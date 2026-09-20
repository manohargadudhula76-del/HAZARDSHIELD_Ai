import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { CascadeFlow } from '../components/intelligence/CascadeFlow';
import { CascadeEventTable } from '../components/intelligence/CascadeEventTable';
import {
  mockCascadeEventTable,
  simulateCascadeRun,
  CascadeSimulationConfig
} from '../data/cascadingImpact';
import { api, BackendHabitation, CascadeSimulateResponse } from '../services/api';
import {
  GitFork,
  Activity,
  Users,
  Clock,
  Home,
  ShieldAlert,
  Play,
  Lightbulb,
  TrendingUp,
  MapPin,
  Loader2
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const CascadingImpactPage: React.FC = () => {
  const [habitations, setHabitations] = useState<BackendHabitation[]>([]);
  const [selectedHabitationId, setSelectedHabitationId] = useState('1');
  // Cascade simulation state
  const [config, setConfig] = useState<CascadeSimulationConfig>({
    rainIntensity: 'HEAVY',
    roadStatus: 'ONE_BLOCKED',
    shelterCapacity: 'REDUCED_20',
    evacuationStatus: 'CONGESTED'
  });

  const [simulatedData, setSimulatedData] = useState(() => simulateCascadeRun(config));
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    api.getHabitations().then((res) => {
      if (res && res.length > 0) {
        setHabitations(res);
        setSelectedHabitationId(String(res[0].id));
      }
    }).catch(console.warn);
  }, []);

  const selectedHab = habitations.find(h => String(h.id) === selectedHabitationId) || habitations[0];
  const habName = selectedHab?.name || 'Rampur River Basin';
  const district = selectedHab?.district || 'Darrang';
  const state = selectedHab?.state || 'Assam';

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateCascade({
        habitation_id: parseInt(selectedHabitationId.replace(/\D/g, '')) || 1,
        rainfall_intensity: config.rainIntensity,
        road_status: config.roadStatus,
        shelter_capacity: config.shelterCapacity,
        evacuation_status: config.evacuationStatus
      });
      const baseRun = simulateCascadeRun(config);
      setSimulatedData({
        cascadeRisk: res.cascade_risk,
        secondaryFailures: res.secondary_failures,
        populationImpacted: res.population_impacted,
        evacuationDelayMin: res.evacuation_delay_minutes,
        additionalShelterDemand: res.additional_shelter_demand,
        stages: baseRun.stages,
        progression: res.escalation_curve.map((ec) => ({
          step: ec.time,
          riskScore: ec.risk,
          label: ec.time
        }))
      });
    } catch (err) {
      console.warn('Backend cascade API fallback to local model:', err);
      setSimulatedData(simulateCascadeRun(config));
    } finally {
      setIsSimulating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Cascading Disaster Impact Analysis"
        subtitle="Analyze how primary hazards can trigger secondary failures and increase population risk."
        icon={GitFork}
        badgeText="PROTOTYPE CASCADE SIMULATION"
        actionButton={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              System Dynamics Multiplier
            </span>
          </div>
        }
      />

      {/* 5 Cascade KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-xl">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span className="text-[11px] font-bold uppercase">Cascade Risk</span>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">
            {simulatedData.cascadeRisk} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </p>
          <span className="text-[10px] text-slate-400">Compounded mortality index</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-xl">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Activity className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] font-bold uppercase">Secondary Failures</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {simulatedData.secondaryFailures}
          </p>
          <span className="text-[10px] text-slate-400">Interlinked infrastructure breakdowns</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-xl">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-[11px] font-bold uppercase">Pop. Impacted</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {formatNumber(simulatedData.populationImpacted)}
          </p>
          <span className="text-[10px] text-slate-400">Directly stranded/affected</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-xl">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="text-[11px] font-bold uppercase">Evac Delay</span>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            +{simulatedData.evacuationDelayMin} min
          </p>
          <span className="text-[10px] text-slate-400">Average transit congestion</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-xl">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Home className="h-4 w-4 text-emerald-500" />
            <span className="text-[11px] font-bold uppercase">Shelter Deficit</span>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {simulatedData.additionalShelterDemand}
          </p>
          <span className="text-[10px] text-slate-400">Excess bed & ration demand</span>
        </div>
      </div>

      {/* Reusable Cascade Flow Pipeline */}
      <CascadeFlow stages={simulatedData.stages} />

      {/* Middle Grid: Risk Escalation Chart + Key Finding Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts Risk Escalation Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span>Risk Escalation Through Cascade</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Composite risk score multiplying as secondary infrastructure failures compound
              </p>
            </div>
            <span className="text-xs font-black text-red-600 dark:text-red-400">
              Peak: {simulatedData.cascadeRisk}/100
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulatedData.progression} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="cascadeRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="step" tick={{ fontSize: 11 }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  stroke="#EF4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#cascadeRiskGrad)"
                  name="Risk Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Finding Insight Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-white to-transparent dark:from-[#151B2B] dark:via-[#151B2B] dark:to-amber-950/20 p-5 shadow-xl">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Key Strategic Finding
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Command center risk synthesis
                </p>
              </div>
            </div>

            <blockquote className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed border-l-4 border-amber-500 pl-3.5 my-3">
              "Heavy rainfall may trigger flooding, which can disrupt evacuation routes. The resulting delay may increase shelter demand and expose additional people to risk."
            </blockquote>

            <div className="space-y-2 mt-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>Primary shockwave travels through transportation cutoff rather than immediate drowning risk.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>Secondary shelter saturation creates humanitarian triage bottlenecks within 4 hours.</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#263246] flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Synthesis: Multi-Hazard Interdependency</span>
            <span className="text-emerald-600 dark:text-emerald-400">Early Intervention High ROI</span>
          </div>
        </div>
      </div>

      {/* Interactive Cascade Simulation Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246] gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cascade Simulation Stress Injector
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select environmental and systemic failure conditions to simulate dynamic cascade outcomes
            </p>
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>RUN CASCADE SIMULATION</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Rainfall Intensity
            </label>
            <select
              value={config.rainIntensity}
              onChange={(e) => setConfig({ ...config, rainIntensity: e.target.value as any })}
              className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="NORMAL">Normal Monsoon (65%)</option>
              <option value="HEAVY">Heavy Inundation (92%)</option>
              <option value="EXTREME">Extreme Cloudburst (98%)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Road Network State
            </label>
            <select
              value={config.roadStatus}
              onChange={(e) => setConfig({ ...config, roadStatus: e.target.value as any })}
              className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL_OPEN">All Routes Open</option>
              <option value="ONE_BLOCKED">Route A Submerged (Detour Active)</option>
              <option value="ALL_BLOCKED">All Corridors Cut (Isolated)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Shelter Surge Cushion
            </label>
            <select
              value={config.shelterCapacity}
              onChange={(e) => setConfig({ ...config, shelterCapacity: e.target.value as any })}
              className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="NORMAL">Normal Capacity</option>
              <option value="REDUCED_20">20% Capacity Deficit</option>
              <option value="REDUCED_50">50% Severe Deficit</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Evacuation Transit Status
            </label>
            <select
              value={config.evacuationStatus}
              onChange={(e) => setConfig({ ...config, evacuationStatus: e.target.value as any })}
              className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="CLEAR">Clear Transit Flow</option>
              <option value="CONGESTED">Congested Detour (+18 min)</option>
              <option value="FAILED">Gridlock / Submersion (+35 min)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detailed Cascade Event Progression Table */}
      <CascadeEventTable events={mockCascadeEventTable} />
    </div>
  );
};
