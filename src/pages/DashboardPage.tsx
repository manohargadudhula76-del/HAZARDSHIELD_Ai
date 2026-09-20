import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Building2,
  MapPin,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Bell,
  Scale,
  Compass,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Brain,
  Navigation as NavigationIcon,
  GitFork
} from 'lucide-react';

import { IntelligenceCard } from '../components/intelligence/IntelligenceCard';

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { InteractiveMap } from '../components/maps/InteractiveMap';
import { RiskDonutChart } from '../components/charts/RiskDonutChart';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { RiskBadge } from '../components/common/RiskBadge';

import { MapLocationMarker } from '../types/hazard';
import { DisasterAlert } from '../types/alert';
import { AnalyticsSummary } from '../types/analytics';

import { hazardService } from '../services/hazardService';
import { alertService } from '../services/alertService';
import { analyticsService } from '../services/analyticsService';
import { api, BackendDashboardSummary, BackendMapItem } from '../services/api';
import { formatNumber } from '../utils/formatters';

const REGIONS = [
  { value: 'ALL', label: 'All Regions (National)' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [mapMarkers, setMapMarkers] = useState<MapLocationMarker[]>([]);
  const [habitations, setHabitations] = useState<BackendMapItem[]>([]);
  const [redZones, setRedZones] = useState<BackendMapItem[]>([]);
  const [safeHavens, setSafeHavens] = useState<BackendMapItem[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<BackendDashboardSummary | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<DisasterAlert[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [summary, mapData, markers, alerts, analyticsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getMapLocations(),
        hazardService.getMapMarkers(),
        alertService.getAlerts('ALL'),
        analyticsService.getAnalyticsSummary()
      ]);
      setDashboardSummary(summary);
      setHabitations(mapData.habitations);
      setRedZones(mapData.red_zones);
      setSafeHavens(mapData.safe_havens);
      setMapMarkers(markers);
      setRecentAlerts(alerts.slice(0, 4));
      setAnalytics(analyticsData);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Filter habitations & red zones by selected region
  const filteredHabitations = useMemo(() => {
    if (selectedRegion === 'ALL') return habitations;
    return habitations.filter(h => h.state === selectedRegion);
  }, [habitations, selectedRegion]);

  const filteredRedZones = useMemo(() => {
    if (selectedRegion === 'ALL') return redZones;
    return redZones.filter(z => z.state === selectedRegion);
  }, [redZones, selectedRegion]);

  // Derived KPI figures from live backend or fallback
  const criticalCount = dashboardSummary?.critical_red_zones ?? analytics?.riskDistribution.find(r => r.name.includes('Critical'))?.count ?? 11;
  const highRiskCount = dashboardSummary?.high_risk_habitations ?? analytics?.riskDistribution.find(r => r.name.includes('High'))?.count ?? 17;
  const safeCount = dashboardSummary?.safe_habitations ?? analytics?.riskDistribution.find(r => r.name.includes('Safe'))?.count ?? 3;
  const totalPopAtRisk = dashboardSummary?.population_at_risk ?? analytics?.totalPopulationExposed ?? 76000;
  const capacityExceededCount = dashboardSummary?.capacity_exceeded ?? analytics?.capacityStatus.find(c => c.status.includes('Exceeded'))?.count ?? 8;
  const immediateRelocationCount = dashboardSummary?.immediate_relocation ?? analytics?.relocationPriority.find(p => p.level.includes('Immediate'))?.peopleCount ?? 64800;
  const activeAlertsCount = dashboardSummary?.active_alerts ?? recentAlerts.filter(a => a.status !== 'RESOLVED').length;


  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Disaster Risk Intelligence Dashboard"
          subtitle="Real-time multi-hazard assessment, carrying capacity thresholds & relocation prioritization."
          icon={ShieldAlert}
          badgeText="Demo Dataset • SIH 2026 Prototype"
        />

        {/* Header Controls: Region Selector, Time, and Async Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm dark:border-[#263246] dark:bg-[#151B2B] dark:text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Updated: <strong>{lastUpdated}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-[#263246] dark:bg-[#151B2B] dark:text-slate-200 dark:hover:border-slate-700 cursor-pointer"
            >
              {REGIONS.map(reg => (
                <option key={reg.value} value={reg.value}>
                  {reg.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-[#263246] dark:bg-[#151B2B] dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="Refresh simulated data feed"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Critical Red Zones"
          value={formatNumber(criticalCount)}
          subtitle="Immediate relocation mandatory"
          icon={AlertTriangle}
          iconBgColor="bg-red-500/10"
          iconTextColor="text-red-500"
          isWarning={true}
        />
        <StatCard
          title="Population at Risk"
          value={formatNumber(totalPopAtRisk)}
          subtitle="Residents in high-vulnerability sectors"
          icon={Users}
          iconBgColor="bg-orange-500/10"
          iconTextColor="text-orange-500"
        />
        <StatCard
          title="Capacity Exceeded"
          value={`${capacityExceededCount} Areas`}
          subtitle="Operating past safe environmental limits"
          icon={Building2}
          iconBgColor="bg-amber-500/10"
          iconTextColor="text-amber-500"
        />
        <StatCard
          title="Immediate Relocation"
          value={`${formatNumber(immediateRelocationCount)} People`}
          subtitle="Priority 1 evacuation allocation"
          icon={MapPin}
          iconBgColor="bg-blue-500/10"
          iconTextColor="text-blue-500"
        />
      </div>

      {/* Secondary Indicators Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-[#263246] dark:bg-[#151B2B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">High Risk Habitations</span>
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{highRiskCount}</p>
          <span className="text-[10px] text-slate-400">Continuous monitoring</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-[#263246] dark:bg-[#151B2B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Safe Habitations</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{safeCount}</p>
          <span className="text-[10px] text-slate-400">Within risk bounds</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-[#263246] dark:bg-[#151B2B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Emergency Alerts</span>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          </div>
          <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">{activeAlertsCount}</p>
          <span className="text-[10px] text-slate-400">Triggering alerts</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-[#263246] dark:bg-[#151B2B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Relocation Candidates</span>
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">8 Safe Havens</p>
          <span className="text-[10px] text-slate-400">Capacity verified</span>
        </div>
      </div>

      {/* Main Dashboard Interactive Section: Map + Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Leaflet Map Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span>Geospatial Hazard Risk Map</span>
                {selectedRegion !== 'ALL' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold">
                    {selectedRegion}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Light OpenStreetMap projection. Click habitations to inspect risk telemetry.
              </p>
            </div>

            <button
              onClick={() => navigate('/red-zone-map')}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <span>Dedicated Red Zone Map</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="h-[460px] flex items-center justify-center bg-slate-100 dark:bg-[#0B0F14] rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500" />
            </div>
          ) : (
            <InteractiveMap
              habitations={filteredHabitations}
              redZones={filteredRedZones}
              safeHavens={safeHavens}
              height="h-[460px]"
              loading={loading}
            />
          )}
        </div>

        {/* Right 1 Col: Donut Chart & Alerts */}
        <div className="space-y-6">
          {/* Risk Distribution Donut Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Risk Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Habitation vulnerability breakdown</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                249 Habitations
              </span>
            </div>

            <RiskDonutChart data={analytics?.riskDistribution || []} />
          </div>

          {/* Recent Critical Alerts */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-[#263246]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-500" />
                <span>Critical Alerts</span>
              </h3>
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => navigate('/alerts')}
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#1B2435] hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{alert.habitationName}</span>
                    <RiskBadge level={alert.riskLevel} size="sm" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{alert.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>At Risk: {formatNumber(alert.populationAtRisk)} residents</span>
                    <span>{alert.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Relocation Priority Overview & Hazard Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relocation Priority Overview */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-[#263246]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-500" />
                <span>Relocation Priority Overview</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI tier classification of vulnerable populations requiring planned movement
              </p>
            </div>
            <button
              onClick={() => navigate('/relocation')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Relocation Engine →
            </button>
          </div>

          <div className="space-y-3">
            {analytics?.relocationPriority.map(p => (
              <div
                key={p.level}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50/70 dark:bg-[#0B0F14]/40"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.level}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.habitationsCount} Habitations identified
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatNumber(p.peopleCount)}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Residents</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hazard Trends Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-[#263246]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                <span>Hazard & Red Zone Trends</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12-Month simulated seasonal risk variation across monsoon cycles
              </p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Full Analytics →
            </button>
          </div>

          <TrendLineChart
            data={analytics?.monthlyTrends || []}
            height={220}
          />
        </div>
      </div>

      {/* Advanced Disaster Intelligence Section (4 Cards) */}
      <div className="rounded-2xl border border-purple-500/30 bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-[#263246] gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>Advanced Disaster Intelligence</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Causal risk explanations, what-if disaster simulation, route failure analysis, and cascading disaster shockwaves
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            INTELLIGENCE LAYER
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <IntelligenceCard
            icon={Brain}
            iconBg="bg-rose-500/10 dark:bg-rose-950/40"
            iconColor="text-rose-600 dark:text-rose-400"
            badgeText="CAUSALITY"
            title="🧠 Explainable Risk"
            subtitle="Deconstruct the exact factors that drive habitation vulnerability"
            stats={[
              { label: 'Risk Score', value: '87 / 100', highlight: true },
              { label: 'Primary Driver', value: 'Flood Exposure' },
            ]}
            actionText="View Analysis →"
            onAction={() => navigate('/explainable-risk')}
          />

          <IntelligenceCard
            icon={Sparkles}
            iconBg="bg-blue-500/10 dark:bg-blue-950/40"
            iconColor="text-blue-600 dark:text-blue-400"
            badgeText="WHAT-IF"
            title="🔮 Scenario Simulator"
            subtitle="Stress test disaster conditions and observe compound risk escalation"
            stats={[
              { label: 'Current Risk', value: '72' },
              { label: 'Simulated Risk', value: '89', highlight: true },
            ]}
            actionText="View Simulator →"
            onAction={() => navigate('/scenario-simulator')}
          />

          <IntelligenceCard
            icon={NavigationIcon}
            iconBg="bg-amber-500/10 dark:bg-amber-950/40"
            iconColor="text-amber-600 dark:text-amber-400"
            badgeText="GIS ROUTING"
            title="🚧 Evacuation Impact"
            subtitle="Evaluate infrastructure cuts to hospitals, shelters and safe zones"
            stats={[
              { label: 'Affected Pop.', value: '1,240', highlight: true },
              { label: 'Routes Affected', value: '2' },
            ]}
            actionText="View Analysis →"
            onAction={() => navigate('/evacuation-impact')}
          />

          <IntelligenceCard
            icon={GitFork}
            iconBg="bg-purple-500/10 dark:bg-purple-950/40"
            iconColor="text-purple-600 dark:text-purple-400"
            badgeText="CASCADING"
            title="🧬 Cascading Impact"
            subtitle="Trace multi-stage secondary failures from initial hydrologic shock"
            stats={[
              { label: 'Cascade Risk', value: '78', highlight: true },
              { label: 'Secondary Failures', value: '4' },
            ]}
            actionText="View Analysis →"
            onAction={() => navigate('/cascading-impact')}
          />
        </div>
      </div>

      {/* Quick Actions Grid (4 Cards) */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-colors">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Operational Quick Actions</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immediate decision-support workflows for disaster command authorities
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/red-zone-map')}
            className="group p-4 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 hover:bg-slate-100/80 dark:bg-[#0B0F14]/40 dark:hover:bg-[#1B2435] transition-all cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 mb-3 group-hover:scale-105 transition-transform">
              <MapPin className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">View Red Zones</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Inspect geospatial hazard red zones & buffer perimeters.
            </p>
          </div>

          <div
            onClick={() => navigate('/carrying-capacity')}
            className="group p-4 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 hover:bg-slate-100/80 dark:bg-[#0B0F14]/40 dark:hover:bg-[#1B2435] transition-all cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 mb-3 group-hover:scale-105 transition-transform">
              <Scale className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Assess Carrying Capacity</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Evaluate shelter, water, and health resource bottlenecks.
            </p>
          </div>

          <div
            onClick={() => navigate('/vulnerable-habitations')}
            className="group p-4 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 hover:bg-slate-100/80 dark:bg-[#0B0F14]/40 dark:hover:bg-[#1B2435] transition-all cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-3 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">View Vulnerable Habitations</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Filter settlements by demographic risk and evacuation priority.
            </p>
          </div>

          <div
            onClick={() => navigate('/relocation')}
            className="group p-4 rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 hover:bg-slate-100/80 dark:bg-[#0B0F14]/40 dark:hover:bg-[#1B2435] transition-all cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Generate Relocation Plan</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Run AI routing to match red zones with suitable safe havens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
