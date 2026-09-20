import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Sliders,
  Map,
  RefreshCw,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  Shield,
  Palette,
  Layout,
  Database
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'appearance' | 'dashboard' | 'notifications' | 'map' | 'display' | 'thresholds' | 'profile'>('appearance');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentUser = authService.getCurrentUser() || {
    fullName: 'Dr. Rajesh Verma',
    email: 'admin@hazardshield.gov.in',
    role: 'Senior Disaster Decision Commissioner',
    organization: 'National Disaster Management Authority (NDMA)',
    authorityLevel: 'National' as const
  };

  const [officerName, setOfficerName] = useState(currentUser.fullName);
  const [officerRole, setOfficerRole] = useState(currentUser.role);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="fixed top-20 right-6 z-50 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 p-4 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-2xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>System Preferences & Decision Thresholds saved to Local Storage!</span>
        </div>
      )}

      <PageHeader
        title="Settings & Decision Thresholds"
        subtitle="Configure appearance, GIS decision thresholds, data presentation, and notification channels."
        icon={Settings}
        badgeText="Client-Side Persistent Preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Tabs (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-3 shadow-xl space-y-1 transition-colors">
          {[
            { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
            { id: 'dashboard', label: 'Dashboard Defaults', icon: Layout },
            { id: 'notifications', label: 'Notification Rules', icon: Bell },
            { id: 'map', label: 'Map GIS Settings', icon: Map },
            { id: 'display', label: 'Data Display Format', icon: Database },
            { id: 'thresholds', label: 'Risk Thresholds', icon: Sliders },
            { id: 'profile', label: 'Authority Profile', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-100 dark:border-[#263246] mt-3">
            <button
              onClick={() => {
                resetSettings();
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 2500);
              }}
              className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              Reset to Factory Defaults
            </button>
          </div>
        </div>

        {/* Tab Content Panel (9 cols) */}
        <div className="lg:col-span-9 rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-6 shadow-xl transition-colors">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* 1. Appearance & Theme */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Application Theme & Visual Identity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Switch between the Dark Command Center palette and Light Administrative mode.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div
                    onClick={() => {
                      setTheme('dark');
                      updateSettings({ theme: 'dark' });
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 dark:border-[#263246] bg-slate-100 dark:bg-[#1B2435] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 font-bold">
                      <Moon className="h-4 w-4 text-amber-400" />
                      <span>Dark Command Center (Default)</span>
                    </div>
                    <p className="text-[11px] opacity-75">
                      High-contrast slate background optimized for disaster control room environments.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setTheme('light');
                      updateSettings({ theme: 'light' });
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-white text-slate-900 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-[#263246] bg-slate-100 dark:bg-[#1B2435] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 font-bold">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span>Light Administrative Theme</span>
                    </div>
                    <p className="text-[11px] opacity-75">
                      Clean high-readability daytime styling for executive reviews and printed briefings.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                  <strong>Map Tile Policy:</strong> The OpenStreetMap Leaflet layers remain permanently in the high-legibility light tile mode in both dark and light application themes.
                </div>
              </div>
            )}

            {/* 2. Dashboard Preferences */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Dashboard Operational Preferences
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set the default operational jurisdiction and simulated data telemetry refresh interval.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Default Region / State Jurisdiction</label>
                    <select
                      value={settings.defaultRegion}
                      onChange={e => updateSettings({ defaultRegion: e.target.value })}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="ALL">National Command (All States)</option>
                      <option value="Assam">Assam SDMA</option>
                      <option value="Uttarakhand">Uttarakhand SDMA</option>
                      <option value="Himachal Pradesh">Himachal Pradesh SDMA</option>
                      <option value="Odisha">Odisha SDMA</option>
                      <option value="West Bengal">West Bengal SDMA</option>
                      <option value="Bihar">Bihar SDMA</option>
                      <option value="Kerala">Kerala SDMA</option>
                      <option value="Andhra Pradesh">Andhra Pradesh SDMA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Default Map Telemetry View</label>
                    <select
                      value={settings.defaultMapView}
                      onChange={e => updateSettings({ defaultMapView: e.target.value as any })}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="all">Display All Monitored Habitations</option>
                      <option value="critical">Highlight Critical Red Zones Only</option>
                      <option value="high">Highlight High Risk & Red Zones</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">Auto-Refresh Simulated Feeds</strong>
                      <span className="text-slate-500">Periodically update sensor readings and risk indices</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoRefreshEnabled}
                      onChange={e => updateSettings({ autoRefreshEnabled: e.target.checked })}
                      className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                    >
                    </input>
                  </div>

                  {settings.autoRefreshEnabled && (
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Auto-Refresh Interval (Minutes): <strong>{settings.autoRefreshInterval} mins</strong>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={settings.autoRefreshInterval}
                        onChange={e => updateSettings({ autoRefreshInterval: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Notification Rules */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Emergency Alert Routing Rules
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure which severity categories trigger automated top-bar notification broadcasts.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">Critical Red Zone Breaches</strong>
                      <span className="text-slate-500">Trigger instant alert for flood surge, dam overflow & landslide slips</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.criticalAlerts}
                      onChange={e => updateSettings({ criticalAlerts: e.target.checked })}
                      className="h-4 w-4 rounded accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">Relocation Mandate Notifications</strong>
                      <span className="text-slate-500">Alerts when an evacuation corridor or safe haven match is activated</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.relocationAlerts}
                      onChange={e => updateSettings({ relocationAlerts: e.target.checked })}
                      className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">Carrying Capacity Strain Alarms</strong>
                      <span className="text-slate-500">Warnings when drinking water, shelter, or healthcare loads exceed 100%</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.capacityAlerts}
                      onChange={e => updateSettings({ capacityAlerts: e.target.checked })}
                      className="h-4 w-4 rounded accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Map GIS Settings */}
            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    GIS Map Layer Preferences
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure which geospatial markers and safe haven pins appear across map displays.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">Show Habitation Pins</strong>
                      <span className="text-slate-500">Render color-coded hazard markers for surveyed settlements</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showHabitationMarkers}
                      onChange={e => updateSettings({ showHabitationMarkers: e.target.checked })}
                      className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">Highlight Red Zones</strong>
                      <span className="text-slate-500">Emphasize critical hazard score perimeters with pulsing effects</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showRedZones}
                      onChange={e => updateSettings({ showRedZones: e.target.checked })}
                      className="h-4 w-4 rounded accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">Show Candidate Safe Havens</strong>
                      <span className="text-slate-500">Render green shield destination markers for evacuation hubs</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showSafeHavens}
                      onChange={e => updateSettings({ showSafeHavens: e.target.checked })}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Data Display Format */}
            {activeTab === 'display' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Data Formatting & Presentation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure numeral formatting and vulnerability score representations.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Number Formatting Style</label>
                    <select
                      value={settings.numberFormat}
                      onChange={e => updateSettings({ numberFormat: e.target.value as any })}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="indian">Indian Numbering System (e.g. 18,450 / 1,25,000)</option>
                      <option value="international">International System (e.g. 18,450 / 125,000)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Risk Score Display Mode</label>
                    <select
                      value={settings.riskScoreDisplay}
                      onChange={e => updateSettings({ riskScoreDisplay: e.target.value as any })}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="fraction">Fraction Rating (e.g. 92/100)</option>
                      <option value="percentage">Percentage Rating (e.g. 92%)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Risk Thresholds */}
            {activeTab === 'thresholds' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Risk Engine Cutoff Thresholds
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adjust numeric cutoffs determining when habitations are classified into Critical or High Risk tiers.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">
                        Critical Red Zone Threshold (0 - 100)
                      </label>
                      <strong className="text-red-600 dark:text-red-400 font-extrabold text-sm">
                        &ge; {settings.criticalThreshold}
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="95"
                      value={settings.criticalThreshold}
                      onChange={e => updateSettings({ criticalThreshold: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Habitations scoring at or above this value trigger automated priority-1 relocation recommendations.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">
                        High Risk Threshold (0 - 100)
                      </label>
                      <strong className="text-orange-600 dark:text-orange-400 font-extrabold text-sm">
                        &ge; {settings.highThreshold}
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="75"
                      value={settings.highThreshold}
                      onChange={e => updateSettings({ highThreshold: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Scores between {settings.highThreshold} and {settings.criticalThreshold - 1} represent elevated vulnerability.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Authority Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-[#263246]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Command Center Authority Profile
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Logged in disaster management official credentials.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Officer Full Name</label>
                    <input
                      type="text"
                      value={officerName}
                      onChange={e => setOfficerName(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Designated Role</label>
                    <input
                      type="text"
                      value={officerRole}
                      onChange={e => setOfficerRole(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 block">Organization</span>
                      <strong className="text-slate-900 dark:text-white text-xs">{currentUser.organization}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 block">Jurisdiction Level</span>
                      <strong className="text-slate-900 dark:text-white text-xs">{currentUser.authorityLevel} Command</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#263246] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Settings automatically sync with your browser's local storage.</span>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
