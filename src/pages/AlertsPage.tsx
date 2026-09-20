import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  Filter,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Users,
  Compass,
  FileText,
  Clock,
  CheckCheck
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { Modal } from '../components/common/Modal';
import { DisasterAlert } from '../types/alert';
import { alertService } from '../services/alertService';
import { formatNumber } from '../utils/formatters';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'WARNINGS' | 'RESOLVED'>('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  // Modal State
  const [selectedAlertModal, setSelectedAlertModal] = useState<DisasterAlert | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await alertService.getAlerts();
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await alertService.markAsRead(id);
    loadAlerts();
  };

  const handleMarkAsResolved = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'RESOLVED', isRead: true } : a))
    );
    if (selectedAlertModal && selectedAlertModal.id === id) {
      setSelectedAlertModal(prev => (prev ? { ...prev, status: 'RESOLVED', isRead: true } : null));
    }
  };

  const handleMarkAllAsRead = async () => {
    await alertService.markAllAsRead();
    loadAlerts();
  };

  const handleTriggerRelocation = (alert: DisasterAlert) => {
    navigate('/relocation', {
      state: {
        habitationId: alert.habitationId || 'hab-001'
      }
    });
  };

  // KPIs
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const highPriorityCount = alerts.filter(a => a.severity === 'HIGH PRIORITY' && a.status !== 'RESOLVED').length;
  const warningsCount = alerts.filter(a => a.severity === 'MODERATE' && a.status !== 'RESOLVED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  // Filtered alert list
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Tab filter
      if (activeTab === 'CRITICAL' && (a.severity !== 'CRITICAL' || a.status === 'RESOLVED')) return false;
      if (activeTab === 'WARNINGS' && (a.severity === 'CRITICAL' || a.status === 'RESOLVED')) return false;
      if (activeTab === 'RESOLVED' && a.status !== 'RESOLVED') return false;

      // Dropdown filters
      if (selectedState !== 'ALL' && a.state !== selectedState) return false;
      if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;

      return true;
    });
  }, [alerts, activeTab, selectedState, selectedSeverity]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Alerts & Notifications"
          subtitle="Real-time automated disaster warning triage, slope displacement alarms, and capacity breaches."
          icon={Bell}
          badgeText="Disaster Warning Feed • Prototype Data"
        />

        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-[#263246] dark:bg-[#151B2B] px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1B2435] transition-colors shadow-sm cursor-pointer"
        >
          <CheckCheck className="h-4 w-4 text-emerald-500" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Critical Alerts"
          value={criticalCount.toString()}
          subtitle="Immediate hazard action required"
          icon={ShieldAlert}
          iconBgColor="bg-red-500/10"
          iconTextColor="text-red-500"
          isWarning={true}
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount.toString()}
          subtitle="Elevated monitoring & shelter prep"
          icon={AlertTriangle}
          iconBgColor="bg-orange-500/10"
          iconTextColor="text-orange-500"
        />
        <StatCard
          title="Warnings"
          value={warningsCount.toString()}
          subtitle="Precautionary advisories"
          icon={Bell}
          iconBgColor="bg-amber-500/10"
          iconTextColor="text-amber-500"
        />
        <StatCard
          title="Resolved"
          value={resolvedCount.toString()}
          subtitle="Mitigated or safely relocated"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-500/10"
          iconTextColor="text-emerald-500"
        />
      </div>

      {/* Tabs and Filter Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'All Alerts', count: alerts.length },
            { id: 'CRITICAL', label: 'Critical', count: criticalCount },
            { id: 'WARNINGS', label: 'Warnings', count: warningsCount + highPriorityCount },
            { id: 'RESOLVED', label: 'Resolved', count: resolvedCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'bg-slate-100 dark:bg-[#1B2435] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* State and Severity Filters */}
        <div className="flex items-center gap-2.5 text-xs">
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="Assam">Assam</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Kerala">Kerala</option>
            <option value="Odisha">Odisha</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Bihar">Bihar</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH PRIORITY">High Priority</option>
            <option value="MODERATE">Moderate</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-12 text-center text-slate-500 text-xs shadow-sm">
          No disaster alerts found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => {
            const isResolved = alert.status === 'RESOLVED';
            return (
              <div
                key={alert.id}
                className={`rounded-2xl border bg-white dark:bg-[#151B2B] p-5 shadow-xl transition-all space-y-3 relative overflow-hidden ${
                  alert.isRead
                    ? 'border-slate-200 dark:border-[#263246]'
                    : 'border-red-500/40 dark:border-red-500/30'
                }`}
              >
                {!alert.isRead && !isResolved && (
                  <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {alert.district}, {alert.state}
                      </span>
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> RESOLVED
                        </span>
                      ) : (
                        <RiskBadge level={alert.riskLevel} size="sm" pulse={!alert.isRead} />
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">• {alert.timeAgo}</span>
                    </div>

                    <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                      {alert.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Affected Habitation: {alert.habitationName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="rounded-lg border border-slate-200 dark:border-[#263246] px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1B2435] cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}

                    {!isResolved && (
                      <button
                        onClick={() => handleMarkAsResolved(alert.id)}
                        className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {alert.description}
                </p>

                {/* Metric Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#263246] text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>
                      Population Exposed: <strong className="text-slate-900 dark:text-white">{formatNumber(alert.populationAtRisk)} residents</strong>
                    </span>
                  </div>

                  <div className="text-amber-700 dark:text-amber-400 font-medium">
                    <strong>Mandated Action:</strong> {alert.actionRequired}
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedAlertModal(alert)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Alert Details</span>
                  </button>

                  <button
                    onClick={() => handleTriggerRelocation(alert)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-white dark:text-slate-900 transition-colors shadow-md cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Trigger Relocation Plan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlertModal && (
        <Modal
          isOpen={!!selectedAlertModal}
          onClose={() => setSelectedAlertModal(null)}
          title={`Emergency Warning: ${selectedAlertModal.title}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div>
                <span className="text-[10px] text-red-700 dark:text-red-400 uppercase font-bold">Severity Classification</span>
                <p className="text-base font-black text-red-800 dark:text-red-300">{selectedAlertModal.severity}</p>
              </div>
              <RiskBadge level={selectedAlertModal.riskLevel} size="md" pulse={true} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Habitation</span>
                <strong className="text-slate-900 dark:text-white">{selectedAlertModal.habitationName}</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">District & State</span>
                <strong className="text-slate-900 dark:text-white">{selectedAlertModal.district}, {selectedAlertModal.state}</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Citizens at Risk</span>
                <strong className="text-red-600 dark:text-red-400">{formatNumber(selectedAlertModal.populationAtRisk)} residents</strong>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block">Alert Timestamp</span>
                <strong className="text-slate-900 dark:text-white">{selectedAlertModal.timeAgo}</strong>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-1">Situation Description:</span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700">
                {selectedAlertModal.description}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-1">Mandated Response Protocol:</span>
              <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                {selectedAlertModal.actionRequired}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#263246] flex items-center justify-between">
              {selectedAlertModal.status !== 'RESOLVED' ? (
                <button
                  onClick={() => handleMarkAsResolved(selectedAlertModal.id)}
                  className="rounded-xl border border-emerald-500 text-emerald-600 dark:text-emerald-400 px-3 py-2 font-bold hover:bg-emerald-500/10 cursor-pointer"
                >
                  Mark as Resolved
                </button>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Incident Mitigated
                </span>
              )}

              <button
                onClick={() => {
                  setSelectedAlertModal(null);
                  handleTriggerRelocation(selectedAlertModal);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold shadow-md cursor-pointer"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Open Relocation Planner</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
