import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Filter,
  FileText,
  AlertTriangle,
  Users,
  Building2,
  Calendar,
  Compass,
  Gauge,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { InteractiveMap } from '../components/maps/InteractiveMap';
import { MapLegend } from '../components/common/MapLegend';
import { RiskBadge } from '../components/common/RiskBadge';
import { Habitation } from '../types/habitation';
import { habitationService } from '../services/habitationService';
import { api, BackendMapItem } from '../services/api';
import { formatNumber } from '../utils/formatters';

export const RedZoneMapPage: React.FC = () => {
  const navigate = useNavigate();

  // Backend state
  const [habitations, setHabitations] = useState<BackendMapItem[]>([]);
  const [redZones, setRedZones] = useState<BackendMapItem[]>([]);
  const [safeHavens, setSafeHavens] = useState<BackendMapItem[]>([]);
  const [allHabitations, setAllHabitations] = useState<Habitation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Habitation | null>(null);
  const [selectedMapItem, setSelectedMapItem] = useState<BackendMapItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [showSafeHavens, setShowSafeHavens] = useState(true);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedHazard, setSelectedHazard] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedPopRange, setSelectedPopRange] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [mapData, habData] = await Promise.all([
        api.getMapLocations(),
        habitationService.getHabitations()
      ]);

      setHabitations(mapData.habitations);
      setRedZones(mapData.red_zones);
      setSafeHavens(mapData.safe_havens);
      setIsFallback(!!mapData.isFallback);
      setAllHabitations(habData);

      // Default to selecting first critical habitation
      const firstCritical = habData.find(h => h.riskLevel === 'CRITICAL');
      if (firstCritical) {
        setSelectedLocation(firstCritical);
      } else if (mapData.habitations.length > 0) {
        setSelectedMapItem(mapData.habitations[0]);
      }
    } catch (err) {
      console.error('Error fetching map data:', err);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter habitations based on criteria
  const filteredHabitations = useMemo(() => {
    return habitations.filter(h => {
      if (selectedState !== 'ALL' && h.state !== selectedState) return false;
      if (selectedRisk !== 'ALL' && h.risk_level?.toUpperCase() !== selectedRisk) return false;

      if (selectedPopRange !== 'ALL') {
        if (selectedPopRange === '<3000' && h.population >= 3000) return false;
        if (selectedPopRange === '3000-5000' && (h.population < 3000 || h.population > 5000)) return false;
        if (selectedPopRange === '>5000' && h.population <= 5000) return false;
      }

      if (selectedPriority !== 'ALL') {
        const p = h.relocation_priority?.toUpperCase();
        if (selectedPriority.includes('Immediate') && p !== 'IMMEDIATE') return false;
        if (selectedPriority.includes('High') && p !== 'SHORT_TERM') return false;
        if (selectedPriority.includes('Monitoring') && p !== 'MEDIUM_TERM') return false;
      }

      return true;
    });
  }, [habitations, selectedState, selectedRisk, selectedPopRange, selectedPriority]);

  // Filter red zones based on criteria
  const filteredRedZones = useMemo(() => {
    return redZones.filter(z => {
      if (selectedState !== 'ALL' && z.state !== selectedState) return false;
      if (selectedHazard !== 'ALL' && z.hazard_type && !z.hazard_type.toLowerCase().includes(selectedHazard.toLowerCase())) {
        return false;
      }
      if (selectedRisk !== 'ALL' && z.risk_level?.toUpperCase() !== selectedRisk) return false;
      return true;
    });
  }, [redZones, selectedState, selectedHazard, selectedRisk]);

  const handleMarkerClick = async (marker: any) => {
    setSelectedMapItem(marker);
    const detail = await habitationService.getHabitationById(String(marker.id));
    if (detail) {
      setSelectedLocation(detail);
    } else {
      setSelectedLocation(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Hazard-Based Red Zone Map"
          subtitle="Full GIS spatial decision platform identifying hazard zones, buffer limits & relocation destinations."
          icon={MapPin}
          badgeText={isFallback ? 'GIS Spatial Overlay • Prototype Data' : 'Live GIS Backend • FastAPI + MySQL'}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            title="Reload backend data"
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-[#263246] dark:bg-[#1B2435] dark:text-slate-300 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowSafeHavens(prev => !prev)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              showSafeHavens
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#263246] dark:bg-[#1B2435] dark:text-slate-300'
            }`}
          >
            {showSafeHavens ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span>{showSafeHavens ? 'Safe Havens: Visible' : 'Safe Havens: Hidden'}</span>
          </button>
        </div>
      </div>

      {/* Backend Status Notice */}
      {isFallback ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Backend unavailable — displaying prototype data.</span>
          </div>
          <span className="text-[11px] opacity-80">Start FastAPI at http://localhost:8000</span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>
              Connected to live FastAPI backend • Displaying {filteredHabitations.length} habitations, {filteredRedZones.length} red zones, and {safeHavens.length} safe havens
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            Live Database
          </span>
        </div>
      )}

      {/* Comprehensive GIS Filter Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-blue-500" />
          <span>GIS Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
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
            <option value="Maharashtra">Maharashtra</option>
          </select>

          {/* Hazard Type Filter */}
          <select
            value={selectedHazard}
            onChange={e => setSelectedHazard(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Hazards</option>
            <option value="Flood">Flood</option>
            <option value="Landslide">Landslide</option>
            <option value="Cyclone">Cyclone</option>
            <option value="Extreme Rainfall">Extreme Rainfall</option>
            <option value="Coastal Erosion">Coastal Erosion</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={e => setSelectedRisk(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Red Zone</option>
            <option value="HIGH">High Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="LOW">Safe / Low</option>
          </select>

          {/* Population Range Filter */}
          <select
            value={selectedPopRange}
            onChange={e => setSelectedPopRange(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Populations</option>
            <option value="<3000">&lt; 3,000</option>
            <option value="3000-5000">3,000 - 5,000</option>
            <option value=">5000">&gt; 5,000</option>
          </select>

          {/* Relocation Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="rounded-lg bg-slate-50 dark:bg-[#1B2435] border border-slate-300 dark:border-[#263246] px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Immediate Relocation Required">Immediate Relocation</option>
            <option value="High Priority Relocation">High Priority</option>
            <option value="Monitoring Required">Monitoring</option>
          </select>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-2 border-l border-slate-300 dark:border-slate-700">
            Showing <strong className="text-slate-900 dark:text-white">{filteredHabitations.length}</strong> habitation(s),{' '}
            <strong className="text-red-600 dark:text-red-400">{filteredRedZones.length}</strong> red zone(s)
          </span>
        </div>
      </div>

      {/* Main Map + Selected Location Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative">
            <InteractiveMap
              habitations={filteredHabitations}
              redZones={filteredRedZones}
              safeHavens={showSafeHavens ? safeHavens : []}
              height="h-[580px]"
              loading={loading}
              onSelectMarker={handleMarkerClick}
            />
            <div className="absolute bottom-4 left-4 z-20">
              <MapLegend />
            </div>
          </div>
        </div>

        {/* Selected Location Details Panel (4 cols) */}
        <div className="lg:col-span-4">
          {selectedLocation ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#263246]">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
                    Zone Telemetry
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedLocation.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedLocation.district}, {selectedLocation.state}</p>
                </div>
                <RiskBadge level={selectedLocation.riskLevel} size="md" pulse={true} />
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-[#1B2435] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Hazard Type</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    {selectedLocation.primaryHazard}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1B2435] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Risk Score</span>
                  <span className="font-extrabold text-red-600 dark:text-red-400 text-base">{selectedLocation.hazardScore}/100</span>
                </div>
              </div>

              {/* Capacity Status & Relocation Priority Status Badges */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1B2435] border border-slate-200 dark:border-[#263246] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" /> Capacity Status:
                  </span>
                  <span className={`font-bold ${
                    selectedLocation.carryingCapacityPercentage > 100 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {selectedLocation.carryingCapacityPercentage}% ({selectedLocation.carryingCapacityStatus})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5" /> Relocation Priority:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedLocation.relocationStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1B2435]">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5" /> Population Exposed:
                  </span>
                  <strong className="text-slate-900 dark:text-white">{formatNumber(selectedLocation.population)}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1B2435]">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Building2 className="h-3.5 w-3.5" /> Infrastructure Condition:
                  </span>
                  <strong className="text-slate-700 dark:text-slate-300">{selectedLocation.infrastructureScore}/100</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1B2435]">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" /> Historical Disasters:
                  </span>
                  <strong className="text-amber-600 dark:text-amber-400">{selectedLocation.historicalDisastersCount} Recorded Events</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                &quot;{selectedLocation.vulnerabilityReason}&quot;
              </p>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => navigate('/relocation')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-md cursor-pointer"
                >
                  <Compass className="h-4 w-4" />
                  <span>Recommend Relocation Safe Havens</span>
                </button>

                <button
                  onClick={() => navigate(`/habitation/${selectedLocation.id}`)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-md cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Habitation Detail Report</span>
                </button>
              </div>
            </div>
          ) : selectedMapItem ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-5 shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#263246]">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
                    Telemetry ({selectedMapItem.type})
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedMapItem.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedMapItem.district}, {selectedMapItem.state}</p>
                </div>
                <RiskBadge level={(selectedMapItem.risk_level?.toUpperCase() || 'MODERATE') as any} size="md" pulse={true} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-[#1B2435] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Risk Score</span>
                  <span className="font-extrabold text-red-600 dark:text-red-400 text-base">{selectedMapItem.risk_score}/100</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1B2435] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Relocation Priority</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">{selectedMapItem.relocation_priority || 'SHORT_TERM'}</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#1B2435] flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Population:
                </span>
                <strong className="text-slate-900 dark:text-white">{formatNumber(selectedMapItem.population)}</strong>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => navigate(`/habitation/${selectedMapItem.id}`)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-900 hover:opacity-90 transition-colors shadow-md cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Full Analysis</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-8 text-center flex flex-col items-center justify-center h-full transition-colors">
              <MapPin className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Location Selected</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click on any map marker pin to view detailed risk telemetry, carrying capacity, and relocation options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
