import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Users,
  Navigation,
  Sparkles,
  Building2,
  AlertTriangle,
  FileText,
  Calendar,
  HeartPulse,
  Truck,
  PhoneCall,
  Clock,
  Printer
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { RelocationMap } from '../components/maps/RelocationMap';
import { CapacityComparisonChart } from '../components/charts/CapacityComparisonChart';
import { AIInsightCard } from '../components/common/AIInsightCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingAnalysis } from '../components/common/LoadingAnalysis';
import { Modal } from '../components/common/Modal';

import { RelocationRecommendationPlan, SafeHavenLocation } from '../types/relocation';
import { Habitation } from '../types/habitation';
import { relocationService } from '../services/relocationService';
import { habitationService } from '../services/habitationService';
import { formatNumber } from '../utils/formatters';
import { generateHabitationDossierPrint } from '../utils/reportGenerator';

export const RelocationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [habitations, setHabitations] = useState<Habitation[]>([]);
  // Check if a habitation ID was passed via route state
  const initialHabId = location.state?.habitationId || 'hab-001';
  const [selectedHabitationId, setSelectedHabitationId] = useState<string>(initialHabId);
  const [plan, setPlan] = useState<RelocationRecommendationPlan | null>(null);
  const [currentHabitation, setCurrentHabitation] = useState<Habitation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedHavenModal, setSelectedHavenModal] = useState<SafeHavenLocation | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  useEffect(() => {
    async function loadHabs() {
      const list = await habitationService.getHabitations();
      setHabitations(list);
    }
    loadHabs();
  }, []);

  useEffect(() => {
    async function loadPlan() {
      setLoading(true);
      const [planData, habData] = await Promise.all([
        relocationService.getRelocationPlan(selectedHabitationId),
        habitationService.getHabitationById(selectedHabitationId)
      ]);
      setPlan(planData);
      if (habData) setCurrentHabitation(habData);
      setLoading(false);
    }
    loadPlan();
  }, [selectedHabitationId]);

  const handleHabitationChange = (id: string) => {
    setSelectedHabitationId(id);
    setIsSimulating(true);
  };

  // Determine relocation urgency badge
  const urgency = currentHabitation?.riskLevel === 'CRITICAL'
    ? 'IMMEDIATE'
    : currentHabitation?.riskLevel === 'HIGH'
    ? 'SHORT-TERM'
    : 'MEDIUM-TERM';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="AI-Powered Safe Relocation Recommendation"
          subtitle="Spatial relocation optimization matching hazard red zones with resilient recipient safe havens."
          icon={Compass}
          badgeText="Relocation Optimization • Prototype Data"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const numericId = parseInt(selectedHabitationId.replace(/\D/g, '')) || 1;
              generateHabitationDossierPrint(numericId);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Decision Dossier (PDF)</span>
          </button>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            disabled={!plan}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-900 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>View Plan Action Roster</span>
          </button>
        </div>
      </div>

      {/* Select Habitation Banner Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Vulnerable Habitation:
          </span>
          <select
            value={selectedHabitationId}
            onChange={e => handleHabitationChange(e.target.value)}
            className="rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {habitations.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.district}, {h.state}) - {h.riskLevel}
              </option>
            ))}
          </select>
        </div>

        {plan && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Citizens Requiring Relocation:</span>
              <strong className="text-red-600 dark:text-red-400 font-bold">
                {formatNumber(plan.peopleRequiringRelocation)}
              </strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Hazard Level:</span>
              <RiskBadge level={plan.currentHazardLevel} size="sm" pulse={true} />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Relocation Urgency:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                urgency === 'IMMEDIATE'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                  : urgency === 'SHORT-TERM'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                {urgency}
              </span>
            </div>
          </div>
        )}
      </div>

      {isSimulating ? (
        <LoadingAnalysis
          title="AI Safe Haven Matcher Engine"
          steps={[
            'Evaluating Candidate Safe Haven Locations',
            'Checking Available Shelter & Resource Capacity',
            'Analyzing Evacuation Arterial Infrastructure',
            'Calculating Safety Index & Terrain Risk Index',
            'Ranking Optimal Relocation Destinations'
          ]}
          onComplete={() => setIsSimulating(false)}
        />
      ) : loading || !plan ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Map: Relocation Vectors & Safe Haven Spatial Map */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-500" />
                  <span>Relocation Vectors & Safe Haven Spatial Map</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Green vectors indicate optimal evacuation routing from {plan.habitationName} to candidate safe havens.
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {plan.recommendations.length} Candidate Safe Havens
              </span>
            </div>

            <RelocationMap plan={plan} height="h-[460px]" />
          </div>

          {/* 3 Recommended Safe Havens Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Recommended Safe Havens (Ranked by AI Suitability)</span>
              </h3>
              <span className="text-xs text-slate-400">Top 3 Candidates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plan.recommendations.map(sh => {
                const suitabilityScore = sh.safetyScore;
                return (
                  <div
                    key={sh.id}
                    className={`rounded-2xl border bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-4 flex flex-col justify-between transition-all ${
                      sh.rank === 1
                        ? 'border-emerald-500/50 dark:border-emerald-500/40 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 dark:border-[#263246]'
                    }`}
                  >
                    <div>
                      {/* Rank & Match Type Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#263246]">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          sh.rank === 1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-[#1B2435] dark:text-slate-300'
                        }`}>
                          #{sh.rank} {sh.matchType}
                        </span>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Suitability</span>
                          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            {suitabilityScore}%
                          </span>
                        </div>
                      </div>

                      <h4 className="mt-3 font-bold text-sm text-slate-900 dark:text-white">{sh.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sh.district}, {sh.state}</p>

                      {/* Key Metric Details */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-100 dark:border-transparent">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Available Capacity</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatNumber(sh.availableCapacityPeople)} People
                          </strong>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-100 dark:border-transparent">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Travel Distance</span>
                          <strong className="text-slate-900 dark:text-white font-bold">{sh.distanceKm} km</strong>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-100 dark:border-transparent">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Road Access</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sh.accessibilityLevel} Quality</strong>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-100 dark:border-transparent">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Healthcare Facilities</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sh.medicalCentersCount} Medical Centers</strong>
                        </div>
                      </div>

                      {/* Strengths bullet points */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#263246] space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                        {sh.keyStrengths.map((st, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedHavenModal(sh)}
                      className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1B2435] dark:hover:bg-[#263246] border border-slate-200 dark:border-[#263246] py-2.5 text-xs font-bold text-slate-800 dark:text-white transition-colors cursor-pointer"
                    >
                      <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Inspect Haven Telemetry</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Why This Site Was Recommended Panel */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Why This Site Was Recommended (Multi-Criteria Evaluation)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                <strong className="text-slate-900 dark:text-white block mb-1">1. Lower Hazard Exposure</strong>
                <p className="text-slate-600 dark:text-slate-400">Positioned above historical river inundation marks and steep landslide hazard corridors.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                <strong className="text-slate-900 dark:text-white block mb-1">2. Sufficient Carrying Capacity</strong>
                <p className="text-slate-600 dark:text-slate-400">Recipient facility capacity exceeds vulnerable population headcounts by over 40%.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                <strong className="text-slate-900 dark:text-white block mb-1">3. Optimized Travel Distance</strong>
                <p className="text-slate-600 dark:text-slate-400">Transit corridor ensures vehicular transit under 45 minutes for elderly and pediatric citizens.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                <strong className="text-slate-900 dark:text-white block mb-1">4. Robust Road Connectivity</strong>
                <p className="text-slate-600 dark:text-slate-400">All-weather 4-lane or double-lane paved state highway access unobstructed by flood plains.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                <strong className="text-slate-900 dark:text-white block mb-1">5. Proximity to Healthcare</strong>
                <p className="text-slate-600 dark:text-slate-400">District tertiary hospital and mobile medical emergency centers located within 5 km.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                <strong className="text-slate-900 dark:text-white block mb-1">6. Purpose-Built Multipurpose Shelters</strong>
                <p className="text-slate-600 dark:text-slate-400">Reinforced concrete cyclonic/flood shelters equipped with backup solar generators and water filtration.</p>
              </div>
            </div>
          </div>

          {/* AI Reasoning Insight Card */}
          <AIInsightCard
            title="AI Relocation Reasoning & Decision Logic"
            insight={plan.aiAnalysisSummary}
            recommendation="Stage emergency transit taskforces along primary arterial corridor to Safe Haven Alpha. Activate shelter triage protocols."
            timestamp={plan.generatedAt}
          />

          {/* Comparison Multi-Metric Bar Chart */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Safe Haven Multi-Dimensional Metric Comparison</span>
            </h3>
            <CapacityComparisonChart data={plan.comparisonMetrics} />
          </div>
        </div>
      )}

      {/* Haven Telemetry Modal */}
      {selectedHavenModal && (
        <Modal
          isOpen={!!selectedHavenModal}
          onClose={() => setSelectedHavenModal(null)}
          title={`Safe Haven Telemetry: ${selectedHavenModal.name}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold">Overall Safety Index</span>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{selectedHavenModal.safetyScore}%</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Available Capacity</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatNumber(selectedHavenModal.availableCapacityPeople)} Persons</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Elevation Above Baseline</span>
                <strong className="text-slate-900 dark:text-white">{selectedHavenModal.elevationMeters} meters</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Transit Distance</span>
                <strong className="text-slate-900 dark:text-white">{selectedHavenModal.distanceKm} km</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Shelter Buildings</span>
                <strong className="text-slate-900 dark:text-white">{selectedHavenModal.shelterCount} Multipurpose Units</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Medical Facilities</span>
                <strong className="text-slate-900 dark:text-white">{selectedHavenModal.medicalCentersCount} Health Centers</strong>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-1">Site Infrastructure Strengths:</span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                {selectedHavenModal.keyStrengths.map((st, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#263246] flex justify-end">
              <button
                onClick={() => setSelectedHavenModal(null)}
                className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-bold"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Simulated Relocation Plan Modal */}
      {isPlanModalOpen && plan && (
        <Modal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          title={`Official Relocation Action Plan: ${plan.habitationName}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-800 dark:text-blue-300 uppercase font-bold">Relocation Operation Code</span>
                <p className="text-base font-black text-blue-900 dark:text-blue-200">RELOC-{plan.affectedDistrict.toUpperCase()}-2026</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Target Relocation Population</span>
                <p className="text-base font-extrabold text-red-600 dark:text-red-400">{formatNumber(plan.peopleRequiringRelocation)} Residents</p>
              </div>
            </div>

            {/* Phased Execution Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                Three-Phase Evacuation Staging Schedule
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-red-500" /> Phase 1: High Vulnerability Triage (0 - 4 Hours)
                    </strong>
                    <span className="font-bold text-red-600 dark:text-red-400">~1,450 Citizens</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Evacuate elderly, pediatric, and persons with disabilities via specialized ambulance and bus shuttles directly to {plan.recommendations[0]?.name}.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-amber-500" /> Phase 2: Core Population Movement (4 - 12 Hours)
                    </strong>
                    <span className="font-bold text-amber-600 dark:text-amber-400">~1,800 Citizens</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Deploy heavy transport flotilla along arterial highway. Staging secondary camp intake at {plan.recommendations[1]?.name}.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Phase 3: Infrastructure Securing & Field Teams (12 - 24 Hours)
                    </strong>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Remaining Population</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    SDRF/NDRF perimeter lockdown. Cattle evacuation and vital utility isolation.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Haven Allocation */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Designated Primary Destination</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {plan.recommendations[0]?.name} (Distance: {plan.recommendations[0]?.distanceKm} km, Capacity: {formatNumber(plan.recommendations[0]?.availableCapacityPeople)})
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#263246] flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">Simulated plan for Smart India Hackathon 2026 demonstration.</span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-bold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Action Plan</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
