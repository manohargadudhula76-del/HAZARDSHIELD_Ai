export interface AppSettings {
  // Appearance
  theme: 'dark' | 'light';

  // Dashboard Preferences
  defaultRegion: string;
  defaultMapView: 'all' | 'critical' | 'high';
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // minutes

  // Notifications
  criticalAlerts: boolean;
  relocationAlerts: boolean;
  capacityAlerts: boolean;

  // Map Settings
  showHabitationMarkers: boolean;
  showRedZones: boolean;
  showSafeHavens: boolean;

  // Data Display
  numberFormat: 'indian' | 'international';
  riskScoreDisplay: 'percentage' | 'fraction';

  // Risk Thresholds
  criticalThreshold: number;
  highThreshold: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultRegion: 'ALL',
  defaultMapView: 'all',
  autoRefreshEnabled: true,
  autoRefreshInterval: 15,
  criticalAlerts: true,
  relocationAlerts: true,
  capacityAlerts: true,
  showHabitationMarkers: true,
  showRedZones: true,
  showSafeHavens: true,
  numberFormat: 'indian',
  riskScoreDisplay: 'fraction',
  criticalThreshold: 80,
  highThreshold: 65,
};
