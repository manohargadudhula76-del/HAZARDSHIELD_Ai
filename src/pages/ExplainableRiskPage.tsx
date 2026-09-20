import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskContributorChart } from '../components/intelligence/RiskContributorChart';
import { RiskExplanationCard } from '../components/intelligence/RiskExplanationCard';
import { mockExplainableRiskData } from '../data/explainableRisk';
import { api, BackendHabitation, ExplainableRiskResponse } from '../services/api';
import {
  Brain,
  Filter,
  Zap,
  FileText,
  Info,
  Loader2
} from 'lucide-react';

export const ExplainableRiskPage: React.FC = () => {
  const [habitations, setHabitations] = useState<BackendHabitation[]>([]);
  const [selectedHabitationId, setSelectedHabitationId] = useState('1');
  const [hazardFilter, setHazardFilter] = useState('ALL');
  const [riskData, setRiskData] = useState<ExplainableRiskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Load habitations from backend on mount
  useEffect(() => {
    api.getHabitations().then((res) => {
      if (res && res.length > 0) {
        setHabitations(res);
        setSelectedHabitationId(String(res[0].id));
      }
    }).catch(console.warn);
  }, []);

  // Fetch explainable risk for selected habitation
  useEffect(() => {
    setLoading(true);
    const numericId = parseInt(selectedHabitationId.replace(/\D/g, '')) || 1;
    api.getExplainableRisk(numericId)
      .then((data) => {
        setRiskData(data);
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [selectedHabitationId]);

  // Fallback fallback if still loading or offline
  const fallback = mockExplainableRiskData['hab-001'];

  const habitationName = riskData?.habitation_name || fallback.name;
  const district = riskData?.district || fallback.district;
  const state = riskData?.state || fallback.state;
  const overallRisk = riskData ? riskData.overall_risk : fallback.overallRisk;
  const riskLevel = (riskData ? riskData.risk_level : fallback.riskLevel) as any;

  // Map backend contributors to UI chart format
  const chartContributors = riskData?.contributors
    ? riskData.contributors.map((c, i) => {
        const colors = ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#8B5CF6', '#10B981'];
        return {
          name: c.factor,
          percentage: c.weight_percentage,
          color: colors[i % colors.length],
          description: c.explanation
        };
      })
    : fallback.contributors;

  // Map backend risk factors to explanation card
  const explanationFactors = riskData?.risk_factors
    ? riskData.risk_factors.map((rf, idx) => ({
        id: `rf-${idx}`,
        iconName: idx === 0 ? 'Waves' : idx === 1 ? 'NavigationOff' : idx === 2 ? 'Building2' : 'Activity',
        factor: idx === 0 ? 'Topographic Surge Exposure' : idx === 1 ? 'Primary Ingress Vulnerability' : idx === 2 ? 'Housing Fragility Index' : 'Emergency Transit Distance',
        severity: (idx === 0 || idx === 1 ? 'CRITICAL' : 'HIGH') as any,
        explanation: rf
      }))
    : fallback.explanationFactors;

  // Map backend hazard profiles
  const hazardProfiles = riskData?.hazard_profile
    ? riskData.hazard_profile.map((hp) => ({
        hazard: hp.hazard_type,
        score: hp.hazard_score,
        level: hp.severity as any,
        trend: hp.description || 'Active seasonal monitoring'
      }))
    : fallback.hazardProfile;

  // Filter hazard profiles
  const filteredProfiles = hazardProfiles.filter((h) => {
    if (hazardFilter === 'ALL') return true;
    return h.hazard.toLowerCase().includes(hazardFilter.toLowerCase());
  });

  const formulaWeights = riskData?.contributors
    ? riskData.contributors.map((c) => ({
        factor: c.factor,
        rawScore: c.raw_score,
        weight: c.weight_percentage / 100,
        weightedScore: c.weighted_contribution
      }))
    : fallback.formulaWeights;


  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Explainable Multi-Hazard Risk"
        subtitle="Understand the factors contributing to habitation-level disaster risk."
        icon={Brain}
        badgeText="DECISION INTELLIGENCE"
        actionButton={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Demo Dataset • Illustrative Estimate
            </span>
          </div>
        }
      />

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="h-4 w-4 text-blue-500" />
            <span>Target Habitation & Filters:</span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-2xl">
            {/* Habitation Selector */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Settlement
              </label>
              <select
                value={selectedHabitationId}
                onChange={(e) => setSelectedHabitationId(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {habitations.length > 0 ? (
                  habitations.map((h) => (
                    <option key={h.id} value={String(h.id)}>
                      {h.name} ({h.district}, {h.state})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Rampur River Basin (Darrang, Assam)</option>
                    <option value="2">Devipur (Rudraprayag, Uttarakhand)</option>
                    <option value="3">Majuli North Island (Majuli, Assam)</option>
                  </>
                )}
              </select>
            </div>

            {/* Region / District Info (Readonly for current selection) */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                District / State
              </label>
              <div className="text-xs font-bold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-100 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 truncate">
                {district}, {state}
              </div>
            </div>

            {/* Hazard Filter */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Hazard Filter
              </label>
              <select
                value={hazardFilter}
                onChange={(e) => setHazardFilter(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Hazard Profiles</option>
                <option value="Flood">Flood Hazards</option>
                <option value="Landslide">Landslide Hazards</option>
                <option value="Rainfall">Rainfall / Storms</option>
                <option value="Cyclone">Cyclone / Erosion</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Habitation Score Overview Hero */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent dark:from-red-950/30 dark:via-[#151B2B] dark:to-[#151B2B] p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Composite Risk Assessment
              </span>
              <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[10px] font-bold">
                {riskData?.relocation_priority || 'HIGH PRIORITY'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {habitationName}
            </h2>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              {district}, {state} • {riskData ? `${riskData.population_exposed.toLocaleString()} Residents Exposed` : '4,850 Residents'}
            </p>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/80 dark:bg-[#0B0F14]/70 backdrop-blur-md border border-slate-200 dark:border-[#263246] shadow-md">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">
                Overall Risk Score
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400">
                  {overallRisk}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                Risk Classification
              </span>
              <RiskBadge level={riskLevel} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Risk Contributors Chart + Why Insight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskContributorChart contributors={chartContributors} />
        <RiskExplanationCard
          factors={explanationFactors}
          habitationName={habitationName}
        />
      </div>

      {/* Multi-Hazard Profile Cards */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Multi-Hazard Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disaggregated hazard risk scores and telemetry indicators
            </p>
          </div>
          <span className="text-xs text-slate-400">{filteredProfiles.length} Monitored Hazards</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredProfiles.map((hp, idx) => (
            <div
              key={`${hp.hazard}-${idx}`}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/60 dark:bg-[#0B0F14]/40 flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 truncate">
                  {hp.hazard}
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {hp.score}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <RiskBadge level={hp.level} size="sm" />
                <span className="text-[10px] text-slate-400 block mt-1 truncate">
                  {hp.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Score Calculation Breakdown */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="pb-3 mb-4 border-b border-slate-200 dark:border-[#263246]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Risk Score Weighted Composition</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intuitive weighted breakdown showing exactly how the composite risk score of {overallRisk}/100 is derived
          </p>
        </div>

        {/* Visual Weighted Formula Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {formulaWeights.map((fw, idx) => (
            <div
              key={`${fw.factor}-${idx}`}
              className="p-3 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14]/50 text-center"
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">
                {fw.factor}
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white my-1">
                {fw.rawScore} <span className="text-xs text-slate-400 font-normal">× {fw.weight}</span>
              </p>
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                = +{fw.weightedScore} pts
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#263246] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <span>
              Composite formula: ∑ (Dimension Raw Score × Assigned Weight Factor) = Overall Risk Score
            </span>
          </div>

          <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span>Result:</span>
            <span className="text-red-600 dark:text-red-400">{overallRisk} / 100</span>
            <RiskBadge level={riskLevel} size="sm" />
          </div>
        </div>
      </div>

      {/* Recommended Emergency Action Banner */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-[#151B2B] p-5 shadow-xl">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-[#263246]">
          <FileText className="h-4 w-4 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Actionable Decision Support
          </h3>
        </div>

        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
          Recommended Protocol: <span className="text-blue-600 dark:text-blue-400 font-black">{riskData?.recommended_action || 'Immediate Phase-1 Evacuation & Temporary Relocation Priority'}</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-[#0B0F14]/40">
            <span className="text-[10px] text-slate-400 uppercase font-black block">
              Primary Risk Driver
            </span>
            <h4 className="text-sm font-extrabold text-red-600 dark:text-red-400 mt-0.5">
              {riskData?.contributors[0]?.factor || 'Flood & Hazard Severity'} ({riskData?.contributors[0]?.weight_percentage || 30}% Weight)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {riskData?.contributors[0]?.explanation || 'Peak riverine inundation measured across active flood telemetry.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-[#0B0F14]/40">
            <span className="text-[10px] text-slate-400 uppercase font-black block">
              Secondary Risk Driver
            </span>
            <h4 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {riskData?.contributors[1]?.factor || 'Population Exposure'} ({riskData?.contributors[1]?.weight_percentage || 22}% Weight)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {riskData?.contributors[1]?.explanation || 'High human density situated in low-elevation flood channel.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

