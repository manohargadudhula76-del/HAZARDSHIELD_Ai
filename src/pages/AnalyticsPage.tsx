import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Sparkles,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  Compass,
  FileText
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { RiskDonutChart } from '../components/charts/RiskDonutChart';
import { PopulationBarChart } from '../components/charts/PopulationBarChart';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { AIInsightCard } from '../components/common/AIInsightCard';
import { AnalyticsSummary } from '../types/analytics';
import { analyticsService } from '../services/analyticsService';
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
  CartesianGrid,
  Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [habitations, setHabitations] = useState<Habitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedHazard, setSelectedHazard] = useState('ALL');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('1Y');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [analyticsData, habData] = await Promise.all([
        analyticsService.getAnalyticsSummary(),
        habitationService.getHabitations()
      ]);
      setAnalytics(analyticsData);
      setHabitations(habData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    const result = await analyticsService.generateAISummary();
    setSummaryMessage(result);
    setGeneratingSummary(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Real client-side CSV export
  const handleExportCSV = () => {
    if (!habitations.length) return;
    const headers = [
      'Habitation ID',
      'Habitation Name',
      'District',
      'State',
      'Population',
      'Risk Score',
      'Risk Level',
      'Primary Hazard',
      'Carrying Capacity %',
      'Relocation Priority',
      'People Needing Relocation'
    ];

    const rows = habitations.map(h => [
      h.id,
      `"${h.name}"`,
      `"${h.district}"`,
      `"${h.state}"`,
      h.population,
      h.hazardScore,
      h.riskLevel,
      h.primaryHazard,
      h.carryingCapacityPercentage,
      `"${h.relocationStatus}"`,
      h.peopleNeedingRelocation
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HazardShield_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Analytics CSV exported successfully with all 12 monitored habitations!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Capacity utilization chart data
  const capacityUtilizationData = useMemo(() => {
    return habitations.map(h => ({
      habitation: h.name.split(' ')[0],
      CapacityLoad: h.carryingCapacityPercentage,
      SafeLimit: 100
    }));
  }, [habitations]);

  if (loading || !analytics) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 p-4 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Export & Print Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Analytics & Reports"
          subtitle="National spatial metrics, carrying capacity aggregates, and AI disaster risk synthesis."
          icon={BarChart3}
          badgeText="Executive Intelligence • Demo Dataset"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-[#263246] dark:bg-[#151B2B] px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1B2435] transition-colors shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-4 py-2 text-xs font-bold text-white dark:text-slate-900 shadow-md transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Habitations Assessed"
          value={formatNumber(analytics.totalHabitationsAssessed)}
          subtitle="Monitored across 8 high-risk states"
          icon={Building2}
          iconBgColor="bg-blue-500/10"
          iconTextColor="text-blue-500"
        />
        <StatCard
          title="High Risk Areas"
          value={formatNumber(analytics.highRiskAreas)}
          subtitle="Red zones & critical hazard sectors"
          icon={AlertTriangle}
          iconBgColor="bg-red-500/10"
          iconTextColor="text-red-500"
          isWarning={true}
        />
        <StatCard
          title="Population Exposed"
          value={formatNumber(analytics.totalPopulationExposed)}
          subtitle="Citizens within high vulnerability zones"
          icon={Users}
          iconBgColor="bg-orange-500/10"
          iconTextColor="text-orange-500"
        />
        <StatCard
          title="Relocation Required"
          value={`${formatNumber(analytics.relocationRequired)} People`}
          subtitle="Immediate priority 1 evacuation load"
          icon={Compass}
          iconBgColor="bg-emerald-500/10"
          iconTextColor="text-emerald-500"
        />
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-blue-500" />
          <span>Report Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="Assam">Assam</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Odisha">Odisha</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Bihar">Bihar</option>
            <option value="Kerala">Kerala</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
          </select>

          <select
            value={selectedHazard}
            onChange={e => setSelectedHazard(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Hazard Drivers</option>
            <option value="Flood">Flood</option>
            <option value="Landslide">Landslide</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Earthquake">Earthquake</option>
            <option value="Coastal Erosion">Coastal Erosion</option>
          </select>

          <select
            value={selectedTimePeriod}
            onChange={e => setSelectedTimePeriod(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="30D">Last 30 Days</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last 1 Year (Monsoon Cycle)</option>
            <option value="ALL">Historical (5 Years)</option>
          </select>
        </div>
      </div>

      {/* AI Summary Generator Card */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/40 dark:from-[#151B2B] dark:via-[#151B2B] dark:to-indigo-950/40 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>AI Executive Briefing Synthesizer</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate on-demand multi-hazard risk synthesis for state disaster management authorities.
          </p>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={generatingSummary}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-900 shadow-md transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${generatingSummary ? 'animate-spin' : ''}`} />
          <span>{generatingSummary ? 'Synthesizing...' : 'Generate Real-Time Briefing'}</span>
        </button>
      </div>

      {/* AI Briefing Callout */}
      <AIInsightCard
        title="National Executive Disaster Risk Briefing"
        insight={summaryMessage || analytics.aiExecutiveSummary}
        recommendation="Prioritize budget allocation and NDRF rapid mobilization for 3 critical red-zone clusters (Assam Brahmaputra, Uttarakhand Alaknanda basin, and Sunderbans coastal delta)."
      />

      {/* Visualizations Grid A & B: Risk Distribution Donut & Hazard Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Risk Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Habitation Risk Distribution
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Classification across all 249 surveyed settlements</p>
          </div>
          <RiskDonutChart data={analytics.riskDistribution} />
        </div>

        {/* Chart B: Hazard Frequency Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Primary Hazard Frequency Breakdown
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution of disaster triggers impacting habitations</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hazardDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="hazardType" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3B82F6" name="% of Total Events" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Visualizations Grid C & D: District Population at Risk & Monthly Risk Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart C: District Population at Risk */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Population at Risk by Vulnerable District
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Resident headcounts residing within high-hazard corridors</p>
          </div>
          <PopulationBarChart data={analytics.districtVulnerability} />
        </div>

        {/* Chart F: Monthly / Seasonal Risk Trends */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              12-Month Hazard & Red Zone Trends
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Critical, High, and Moderate zone volume during monsoon seasons</p>
          </div>
          <TrendLineChart data={analytics.monthlyTrends || []} height={260} />
        </div>
      </div>

      {/* Chart E: Capacity Utilization by Habitation */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Carrying Capacity Stress Index Across Habitations
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Current civic & environmental demand as % of safe threshold (&gt;100% indicates severe resource deficit)
          </p>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityUtilizationData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="habitation" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 160]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="CapacityLoad" fill="#EF4444" name="Carrying Load %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Summary Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span>Strategic Decision Report Summary</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">Key Finding 1</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Riverine flooding in Assam and coastal storm surge in West Bengal account for 57% of all critical red-zone declarations nationally.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">Key Finding 2</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Carrying capacity deficits average 38% over safe limits in flood-plain habitations, with drinking water contamination being the fastest-failing resource.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F14]/40 border border-slate-200 dark:border-[#263246]">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">Key Finding 3</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              All 8 designated safe haven hubs possess over 85% safety indices and sufficient absorption margins to receive the 6,780 citizens requiring immediate relocation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
