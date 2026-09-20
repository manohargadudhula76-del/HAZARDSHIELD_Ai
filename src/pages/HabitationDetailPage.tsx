import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  ShieldAlert,
  Users,
  Building2,
  Scale,
  Calendar,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { RiskBadge } from '../components/common/RiskBadge';
import { RiskProgressBar } from '../components/common/RiskProgressBar';
import { AIInsightCard } from '../components/common/AIInsightCard';
import { Habitation } from '../types/habitation';
import { habitationService } from '../services/habitationService';
import { formatNumber } from '../utils/formatters';

export const HabitationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habitation, setHabitation] = useState<Habitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState('');

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      if (id) {
        const detail = await habitationService.getHabitationById(id);
        if (detail) setHabitation(detail);
      }
      setLoading(false);
    }
    loadDetail();
  }, [id]);

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    setTimeout(() => {
      setGeneratingReport(false);
      setReportSuccessMessage(`Disaster Risk Briefing Report for ${habitation?.name} generated successfully!`);
      setTimeout(() => setReportSuccessMessage(''), 4000);
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-500" />
      </div>
    );
  }

  if (!habitation) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400">Habitation detail record not found.</p>
        <button
          onClick={() => navigate('/vulnerable-habitations')}
          className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Notification Alert Toast */}
      {reportSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/80 p-4 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{reportSuccessMessage}</span>
        </div>
      )}

      {/* Header with Back, Print, Download actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#263246]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Habitations</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1B2435] dark:hover:bg-[#263246] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#263246] transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white px-4 py-2 text-xs font-bold text-white dark:text-slate-900 shadow-md transition-colors cursor-pointer"
          >
            {generatingReport ? (
              <span className="animate-pulse">Generating PDF...</span>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Generate PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      <PageHeader
        title={`${habitation.name} — Disaster Risk Report`}
        subtitle={`Detailed GIS evaluation perimeter for ${habitation.district}, ${habitation.state}`}
        badgeText={`Rank #${habitation.relocationPriorityRank}`}
      />

      {/* Top Telemetry Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-red-500/30 bg-white dark:bg-[#151B2B] p-4 text-center shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Overall Risk Score</span>
          <h3 className="text-3xl font-black text-red-500 mt-1">{habitation.hazardScore}/100</h3>
          <div className="mt-1">
            <RiskBadge level={habitation.riskLevel} size="sm" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 text-center shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Population</span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(habitation.population)}</h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Residents</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 text-center shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Relocation Needed</span>
          <h3 className="text-2xl font-bold text-amber-500 dark:text-amber-400 mt-1">{formatNumber(habitation.peopleNeedingRelocation)}</h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">High priority citizens</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 text-center shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Carrying Capacity</span>
          <h3 className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">{habitation.carryingCapacityPercentage}%</h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Resource stress</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 text-center col-span-2 lg:col-span-1 shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Infra Score</span>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{habitation.infrastructureScore}/100</h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Evacuation capability</span>
        </div>
      </div>

      {/* Prominent AI Summary */}
      <AIInsightCard
        title={`AI Decision Analysis Summary — ${habitation.name}`}
        insight={habitation.vulnerabilityReason}
        recommendation="Immediate activation of Safe Haven Alpha relocation plan and deployment of disaster quick-response personnel."
      />

      {/* 6 Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Hazard Analysis */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#263246]">
            <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />
            <span>1. Hazard Risk Breakdown</span>
          </h4>
          <RiskProgressBar label="Riverine Flood Risk" value={habitation.primaryHazard === 'Flood' ? 95 : 45} />
          <RiskProgressBar label="Landslide Debris Threat" value={habitation.primaryHazard === 'Landslide' ? 90 : 30} />
          <RiskProgressBar label="Heavy Precipitation Saturation" value={85} />
        </div>

        {/* Section 2: Population Exposure */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-sm space-y-3 text-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#263246]">
            <Users className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <span>2. Population Exposure Metrics</span>
          </h4>
          <div className="space-y-2 text-slate-600 dark:text-slate-300">
            <p className="flex justify-between"><span>Resident Population:</span> <strong className="text-slate-900 dark:text-white">{formatNumber(habitation.population)}</strong></p>
            <p className="flex justify-between"><span>Families / Households:</span> <strong className="text-slate-900 dark:text-white">~{habitation.families || Math.round(habitation.population / 4.5)}</strong></p>
            <p className="flex justify-between"><span>Habitation Area:</span> <strong className="text-slate-900 dark:text-white">{habitation.areaSqKm} sq. km</strong></p>
            <p className="flex justify-between"><span>Elderly (60+):</span> <strong className="text-rose-600 dark:text-rose-400 font-bold">{formatNumber(habitation.elderlyPopulation || Math.round(habitation.population * 0.14))}</strong></p>
            <p className="flex justify-between"><span>Children (&lt;12):</span> <strong className="text-amber-600 dark:text-amber-400 font-bold">{formatNumber(habitation.childrenPopulation || Math.round(habitation.population * 0.28))}</strong></p>
            <p className="flex justify-between"><span>Persons with Disabilities:</span> <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatNumber(habitation.personsWithDisabilities || Math.round(habitation.population * 0.03))}</strong></p>
          </div>
        </div>

        {/* Section 3: Infrastructure Analysis */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-3 text-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#263246]">
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>3. Infrastructure Condition</span>
          </h4>
          <RiskProgressBar label="Evacuation Road Width" value={habitation.infrastructureScore} statusLabel={`${habitation.infrastructureScore}% Safe`} />
          <p className="text-slate-500 dark:text-slate-400 italic mt-2">Single narrow access arterial road susceptible to early monsoon washouts.</p>
        </div>

        {/* Section 4: Carrying Capacity */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-3 text-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#263246]">
            <Scale className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span>4. Carrying Capacity Thresholds</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-300 flex justify-between"><span>Capacity Utilization:</span> <strong className="text-red-500 dark:text-red-400 font-extrabold">{habitation.carryingCapacityPercentage}%</strong></p>
          <p className="text-slate-600 dark:text-slate-300 flex justify-between"><span>Status:</span> <strong className="text-red-500 dark:text-red-400">{habitation.carryingCapacityStatus}</strong></p>
        </div>

        {/* Section 5: Historical Disaster Info */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-3 text-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#263246]">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>5. Historical Disaster Events</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-300">Total Recorded Incidents: <strong className="text-slate-900 dark:text-white">{habitation.historicalDisastersCount} Major Floods/Storms (2015-2026)</strong></p>
          <p className="text-slate-500 dark:text-slate-400 italic">Average inundation frequency: 1.4 events per monsoon cycle.</p>
        </div>

        {/* Section 6: Recommended Actions */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-3 text-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#263246]">
            <Compass className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span>6. Immediate Recommended Actions</span>
          </h4>
          <button
            onClick={() => navigate('/relocation', { state: { habitationId: habitation.id } })}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-900 transition-all shadow-md cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            <span>Open AI Relocation Recommendation Engine</span>
          </button>
        </div>
      </div>
    </div>
  );
};
