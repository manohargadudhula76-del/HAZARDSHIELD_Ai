import React from 'react';
import { DisasterAlert } from '../../types/alert';
import { RiskBadge } from './RiskBadge';
import { formatNumber } from '../../utils/formatters';
import { ShieldAlert, AlertTriangle, Users, CheckCircle2, ArrowRight } from 'lucide-react';

interface AlertCardProps {
  alert: DisasterAlert;
  onMarkAsRead?: (id: string) => void;
  onAction?: (alert: DisasterAlert) => void;
  actionLabel?: string;
  showDetails?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onMarkAsRead,
  onAction,
  actionLabel = 'Trigger Relocation Plan',
  showDetails = true
}) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        alert.isRead
          ? 'border-slate-200 bg-white opacity-85 hover:opacity-100 dark:border-[#263246] dark:bg-[#151B2B]'
          : 'border-slate-300 bg-white shadow-md dark:border-slate-700 dark:bg-[#151B2B]'
      }`}
    >
      {/* Top accent bar based on severity */}
      <div
        className={`h-1.5 w-full ${
          alert.severity === 'CRITICAL'
            ? 'bg-red-500'
            : alert.severity === 'HIGH PRIORITY'
            ? 'bg-orange-500'
            : alert.severity === 'MODERATE'
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />

      <div className="p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                  : alert.severity === 'HIGH PRIORITY'
                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              {alert.severity === 'CRITICAL' ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {alert.district}, {alert.state}
                </span>
                {alert.status === 'RESOLVED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> RESOLVED
                  </span>
                ) : (
                  <RiskBadge level={alert.riskLevel} pulse={!alert.isRead} />
                )}
              </div>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {alert.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {alert.habitationName} • {alert.timeAgo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onMarkAsRead && !alert.isRead && (
              <button
                onClick={() => onMarkAsRead(alert.id)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Mark Read
              </button>
            )}
          </div>
        </div>

        {showDetails && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {alert.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-[#263246]">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Users className="h-4 w-4 text-slate-400" />
                <span>
                  Population Exposed:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {formatNumber(alert.populationAtRisk)}
                  </strong>
                </span>
              </div>

              {alert.actionRequired && (
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  <span className="font-bold">Required Action:</span> {alert.actionRequired}
                </div>
              )}
            </div>

            {onAction && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onAction(alert)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
