import { DisasterAlert } from '../types/alert';
import { mockAlerts } from '../data/alerts';
import { api } from './api';

let localAlerts = [...mockAlerts];

export const alertService = {
  async getAlerts(filterSeverity?: string): Promise<DisasterAlert[]> {
    try {
      const backendAlerts = await api.getAlerts();
      if (backendAlerts && backendAlerts.length > 0) {
        const mapped: DisasterAlert[] = backendAlerts.map((ba, idx) => {
          const locationParts = ba.location.split(', ');
          const district = locationParts[0] || 'Darrang';
          const state = locationParts[1] || 'Assam';
          const sevMap: Record<string, any> = {
            'CRITICAL': 'CRITICAL',
            'HIGH': 'HIGH PRIORITY',
            'MODERATE': 'MODERATE',
            'LOW': 'INFO'
          };
          return {
            id: ba.id,
            habitationId: `hab-00${(idx % 3) + 1}`,
            habitationName: ba.title.split(':')[1]?.trim() || ba.title,
            district,
            state,
            title: ba.title,
            severity: sevMap[ba.severity] || 'CRITICAL',
            riskLevel: (ba.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH') as any,
            description: ba.message,
            populationAtRisk: ba.population_affected,
            actionRequired: ba.action_required,
            timestamp: new Date().toISOString(),
            timeAgo: ba.timestamp,
            isRead: ba.status === 'ACKNOWLEDGED',
            status: 'ACTIVE'
          };
        });
        localAlerts = mapped;
      }
    } catch {
      // Fallback
    }

    if (!filterSeverity || filterSeverity === 'ALL') return localAlerts;
    return localAlerts.filter(a => a.severity === filterSeverity || a.riskLevel === filterSeverity);
  },

  async markAsRead(alertId: string): Promise<void> {
    try {
      await api.acknowledgeAlert(alertId);
    } catch {
      // Fallback
    }
    localAlerts = localAlerts.map(a => (a.id === alertId ? { ...a, isRead: true } : a));
  },

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await api.resolveAlert(alertId);
    } catch {
      // Fallback
    }
    localAlerts = localAlerts.filter(a => a.id !== alertId);
  },

  async markAllAsRead(): Promise<void> {
    localAlerts = localAlerts.map(a => ({ ...a, isRead: true }));
  }
};

