import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { RiskBadge } from '../components/common/RiskBadge';
import { ScenarioControl } from '../components/intelligence/ScenarioControl';
import { ScenarioComparison } from '../components/intelligence/ScenarioComparison';
import { ImpactBreakdown } from '../components/intelligence/ImpactBreakdown';
import {
  BASELINE_SCENARIO,
  calculateScenarioSimulation
} from '../data/scenarioSimulation';
import { ScenarioInputs, ScenarioResultMetrics, ScenarioImpactBreakdownItem } from '../types/intelligence';
import { api, BackendHabitation, ScenarioSimulateResponse } from '../services/api';
import { Sparkles, MapPin, Loader2 } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export const ScenarioSimulatorPage: React.FC = () => {
  const [habitations, setHabitations] = useState<BackendHabitation[]>([]);
  const [selectedHabitationId, setSelectedHabitationId] = useState('1');
  // Scenario Inputs state
  const [inputs, setInputs] = useState<ScenarioInputs>({ ...BASELINE_SCENARIO.inputs });

  // Simulation execution state
  const [hasRun, setHasRun] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [backendResult, setBackendResult] = useState<ScenarioSimulateResponse | null>(null);

  useEffect(() => {
    api.getHabitations().then((res) => {
      if (res && res.length > 0) {
        setHabitations(res);
        setSelectedHabitationId(String(res[0].id));
      }
    }).catch(console.warn);
  }, []);

  const selectedHabitation = habitations.find(h => String(h.id) === selectedHabitationId) || habitations[0];
  const habitationName = selectedHabitation?.name || BASELINE_SCENARIO.habitationName;
  const district = selectedHabitation?.district || BASELINE_SCENARIO.district;
  const state = selectedHabitation?.state || BASELINE_SCENARIO.state;
  const baseRiskScore = selectedHabitation ? selectedHabitation.risk_score : BASELINE_SCENARIO.metrics.riskScore;
  const baseRiskLevel = (selectedHabitation?.risk_level || BASELINE_SCENARIO.metrics.riskLevel) as any;
  const basePop = selectedHabitation?.population || BASELINE_SCENARIO.metrics.populationAtRisk;

  // Run simulation and calculate result
  const localSimulationResult = calculateScenarioSimulation(inputs);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateScenario({
        habitation_id: parseInt(selectedHabitationId.replace(/\D/g, '')) || 1,
        rainfall_change: inputs.rainfallChange,
        population_change: inputs.populationChange,
        road_status: inputs.mainRoadClosed ? 'CLOSED' : 'OPEN',
        hospital_status: inputs.hospitalAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        shelter_change: inputs.shelterCapacityChange
      });
      setBackendResult(res);
      setHasRun(true);
    } catch (err) {
      console.warn('Backend scenario run failed, using local model:', err);
      setHasRun(true);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setInputs({ ...BASELINE_SCENARIO.inputs });
    setHasRun(false);
    setBackendResult(null);
  };


  // If user hasn't pressed Run yet, show baseline as default comparison
  const displayBeforeMetrics: ScenarioResultMetrics = {
    riskScore: baseRiskScore,
    riskLevel: baseRiskLevel,
    populationAtRisk: basePop,
    evacuationAccess: 'GOOD',
    shelterCapacityStatus: 'SUFFICIENT'
  };

  const displayAfterMetrics: ScenarioResultMetrics = backendResult
    ? {
        riskScore: backendResult.after.risk_score,
        riskLevel: backendResult.after.risk_level as any,
        populationAtRisk: backendResult.after.population,
        evacuationAccess: inputs.mainRoadClosed ? 'CRITICAL FAILURE' : (inputs.rainfallChange > 20 ? 'MODERATE' : 'GOOD'),
        shelterCapacityStatus: inputs.shelterCapacityChange < -25 ? 'CRITICAL DEFICIT' : (inputs.shelterCapacityChange < 0 ? 'STRAINED' : 'SUFFICIENT')
      }
    : (hasRun ? localSimulationResult.metrics : displayBeforeMetrics);

  const displayRiskDelta = backendResult ? backendResult.risk_delta : (hasRun ? localSimulationResult.riskDelta : 0);
  const displayPercentageChange = backendResult ? backendResult.percentage_change : (hasRun ? localSimulationResult.percentageChange : 0);
  const displayExplanation = backendResult ? backendResult.explanation : (hasRun ? localSimulationResult.explanation : 'Baseline scenario active. Adjust stress parameters on the left and click "RUN SIMULATION" to calculate parametric disaster escalation.');

  const breakdownItems: ScenarioImpactBreakdownItem[] = backendResult?.impact_breakdown
    ? backendResult.impact_breakdown.map((ib) => ({
        driver: ib.factor,
        delta: ib.delta_points,
        description: `${ib.factor} condition evaluated at ${ib.status}`
      }))
    : localSimulationResult.breakdown;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="What-If Disaster Simulator"
        subtitle="Simulate changing disaster conditions and evaluate their potential impact."
        icon={Sparkles}
        badgeText="PROTOTYPE SIMULATION"
        actionButton={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Deterministic Scenario Modeling
            </span>
          </div>
        }
      />

      {/* Current Scenario Context Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-[#263246] gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Current Scenario Location
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {habitationName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {district}, {state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Habitation Selector */}
            <select
              value={selectedHabitationId}
              onChange={(e) => {
                setSelectedHabitationId(e.target.value);
                setHasRun(false);
                setBackendResult(null);
              }}
              className="text-xs font-bold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {habitations.length > 0 ? (
                habitations.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name} ({h.district})
                  </option>
                ))
              ) : (
                <option value="1">Rampur River Basin</option>
              )}
            </select>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20">
              Interactive Stress Engine
            </span>
          </div>
        </div>

        {/* Current Baseline Values Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Risk Score</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {baseRiskScore} / 100
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Risk Level</span>
            <div className="mt-1">
              <RiskBadge level={baseRiskLevel} size="sm" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Pop. at Risk</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {formatNumber(basePop)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Evac Access</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              GOOD
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/50 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Shelter Cap.</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              SUFFICIENT
            </span>
          </div>
        </div>
      </div>

      {/* Main Simulation Layout: Left Controls, Right Comparison & Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <ScenarioControl
            inputs={inputs}
            onChange={setInputs}
            onRunSimulation={handleRunSimulation}
            onReset={handleReset}
            isLoading={isSimulating}
          />

          {/* Scenario Impact Breakdown Bars */}
          <ImpactBreakdown
            items={breakdownItems}
            totalDelta={displayRiskDelta}
          />
        </div>

        {/* Comparison & Analysis Column (7 cols) */}
        <div className="lg:col-span-7">
          <ScenarioComparison
            beforeMetrics={displayBeforeMetrics}
            afterMetrics={displayAfterMetrics}
            riskDelta={displayRiskDelta}
            percentageChange={displayPercentageChange}
            explanation={displayExplanation}
          />
        </div>
      </div>
    </div>
  );
};

