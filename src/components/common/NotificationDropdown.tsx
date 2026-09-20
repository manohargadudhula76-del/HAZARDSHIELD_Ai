import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock } from 'lucide-react';
import { mockAlerts } from '../../data/alerts';

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const topAlerts = mockAlerts.slice(0, 5);

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH PRIORITY': return 'bg-orange-500';
      case 'MODERATE': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const handleViewAll = () => {
    navigate('/alerts');
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        aria-label="Close notification dropdown"
      />
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#151B2B] rounded-xl shadow-xl border border-slate-200 dark:border-[#263246] z-50 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-[#263246] bg-slate-50/50 dark:bg-white/[0.02]">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </h3>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center font-medium">
            <Check className="w-3 h-3 mr-1" />
            Mark all as read
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {topAlerts.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-[#263246]">
              {topAlerts.map(alert => (
                <div key={alert.id} className="p-4 hover:bg-slate-50 dark:hover:bg-[#263246]/50 transition-colors cursor-pointer">
                  <div className="flex items-start">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${getSeverityColor(alert.severity)}`} />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                        {alert.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {alert.habitationName} • {alert.district}, {alert.state}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {alert.timeAgo || alert.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No new notifications
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-slate-200 dark:border-[#263246] bg-slate-50/50 dark:bg-white/[0.02]">
          <button 
            onClick={handleViewAll}
            className="w-full py-2 text-sm font-medium text-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            View All Alerts
          </button>
        </div>
      </div>
    </>
  );
};
