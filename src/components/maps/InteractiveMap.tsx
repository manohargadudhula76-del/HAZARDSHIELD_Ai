import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { MapLocationMarker } from '../../types/hazard';
import { SafeHavenLocation } from '../../types/relocation';
import { BackendMapItem } from '../../services/api';
import {
  createColoredMarkerIcon,
  createSafeHavenMarkerIcon,
  createRedZoneMarkerIcon
} from '../../utils/leafletHelpers';
import { MapPanZoomController } from './MapPanZoomController';
import { RiskBadge } from '../common/RiskBadge';
import { formatNumber } from '../../utils/formatters';
import {
  ArrowRight,
  AlertTriangle,
  Users,
  ShieldCheck,
  Radio,
  HeartPulse,
  Activity,
  Compass,
  Loader2
} from 'lucide-react';
import { RiskLevel } from '../../types/habitation';

interface InteractiveMapProps {
  markers?: MapLocationMarker[];
  habitations?: BackendMapItem[];
  redZones?: BackendMapItem[];
  safeHavens?: (SafeHavenLocation | BackendMapItem)[];
  center?: [number, number];
  zoom?: number;
  focusCenter?: [number, number] | null;
  focusZoom?: number;
  onSelectMarker?: (marker: any) => void;
  height?: string;
  loading?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers = [],
  habitations,
  redZones = [],
  safeHavens = [],
  center = [22.5937, 78.9629], // Center of India
  zoom = 5,
  focusCenter,
  focusZoom,
  onSelectMarker,
  height = 'h-[460px]',
  loading = false
}) => {
  const navigate = useNavigate();

  // Permanent Light Leaflet Map style in both Light Mode and Dark Mode
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // Normalize habitations
  const displayHabitations = habitations && habitations.length > 0
    ? habitations
    : markers.map(m => ({
        id: m.id,
        name: m.name,
        latitude: m.lat,
        longitude: m.lng,
        risk_score: m.hazardScore,
        risk_level: m.riskLevel,
        population: m.population,
        type: 'habitation' as const,
        district: m.district,
        state: m.state,
        hazard_type: m.hazardType,
        relocation_priority: m.riskLevel === 'CRITICAL' ? 'IMMEDIATE' : 'SHORT_TERM'
      }));

  // Collect all coordinates for smart "Fit All" bounds
  const fitBoundsCoords: [number, number][] = useMemo(() => {
    const coords: [number, number][] = [];
    displayHabitations.forEach(h => {
      if (h.latitude && h.longitude) coords.push([h.latitude, h.longitude]);
    });
    redZones.forEach(r => {
      if (r.latitude && r.longitude) coords.push([r.latitude, r.longitude]);
    });
    safeHavens.forEach(sh => {
      const lat = (sh as any).latitude ?? (sh as any).lat;
      const lng = (sh as any).longitude ?? (sh as any).lng;
      if (lat && lng) coords.push([lat, lng]);
    });
    return coords;
  }, [displayHabitations, redZones, safeHavens]);

  return (
    <div
      className={`relative w-full ${height} overflow-hidden rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-2xl z-10`}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-white/75 dark:bg-[#151B2B]/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 transition-opacity">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Loading disaster locations…
          </span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        boxZoom={true}
        keyboard={true}
        zoomControl={false}
        attributionControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />

        {/* Pan, Zoom, and Fit Controller with On-Map HUD */}
        <MapPanZoomController
          initialCenter={center}
          initialZoom={zoom}
          focusCenter={focusCenter}
          focusZoom={focusZoom}
          fitBoundsCoords={fitBoundsCoords}
          showNavigationControls={true}
        />

        {/* 1. Habitation Markers */}
        {displayHabitations.map(hab => {
          const riskLvl = (hab.risk_level?.toUpperCase() || 'MODERATE') as RiskLevel;
          const lat = hab.latitude;
          const lng = hab.longitude;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={`hab-${hab.id}`}
              position={[lat, lng]}
              icon={createColoredMarkerIcon(riskLvl)}
              eventHandlers={{
                click: () => {
                  if (onSelectMarker) onSelectMarker(hab);
                }
              }}
            >
              <Popup className="custom-leaflet-popup" autoPan={true} autoPanPadding={[50, 50]}>
                <div className="p-1 space-y-2 text-slate-900 dark:text-slate-100 min-w-[230px]">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hab.name}</h4>
                    <RiskBadge level={riskLvl} size="sm" />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {hab.district}, {hab.state}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs py-1">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Risk Score</span>
                      <span className="font-extrabold text-red-600 dark:text-red-400">
                        {hab.risk_score}/100
                      </span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                        <Compass className="h-2.5 w-2.5 text-blue-500" /> Relocation
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] truncate">
                        {hab.relocation_priority || 'SHORT_TERM'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Users className="h-3 w-3" /> Population:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatNumber(hab.population)}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/habitation/${hab.id}`)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-xs font-bold text-white dark:text-slate-900 hover:opacity-90 transition-colors shadow-md cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 2. Red Zone Markers & Buffer Circles */}
        {redZones.map(zone => {
          const lat = zone.latitude;
          const lng = zone.longitude;
          const radiusKm = zone.radius || 8.0;

          if (!lat || !lng) return null;

          return (
            <React.Fragment key={`rz-${zone.id}`}>
              {/* Spatial Buffer Circle */}
              <Circle
                center={[lat, lng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: '#DC2626',
                  fillColor: '#EF4444',
                  fillOpacity: 0.16,
                  weight: 2,
                  dashArray: '4, 6'
                }}
              />

              {/* Red Zone Warning Pin */}
              <Marker
                position={[lat, lng]}
                icon={createRedZoneMarkerIcon()}
                eventHandlers={{
                  click: () => {
                    if (onSelectMarker) onSelectMarker(zone);
                  }
                }}
              >
                <Popup className="custom-leaflet-popup" autoPan={true} autoPanPadding={[50, 50]}>
                  <div className="p-1 space-y-2 text-slate-900 dark:text-slate-100 min-w-[220px]">
                    <div className="flex items-center justify-between pb-1 border-b border-red-200 dark:border-red-900/60">
                      <h4 className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>Red Zone</span>
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        {zone.status || 'ACTIVE'}
                      </span>
                    </div>

                    <p className="font-semibold text-xs text-slate-800 dark:text-white">{zone.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {zone.district}, {zone.state} (Radius: {radiusKm} km)
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs py-1">
                      <div className="bg-red-50 dark:bg-red-950/30 p-1.5 rounded border border-red-200 dark:border-red-900/40">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Risk Score</span>
                        <span className="font-black text-red-600 dark:text-red-400">{zone.risk_score}/100</span>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/30 p-1.5 rounded border border-red-200 dark:border-red-900/40">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                          <Radio className="h-2.5 w-2.5 text-red-500" /> Hazard
                        </span>
                        <span className="font-bold text-red-700 dark:text-red-300 text-[11px]">
                          {zone.hazard_type || 'Multi-Hazard'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Users className="h-3 w-3" /> Exposed:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatNumber(zone.population)}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 3. Safe Haven Markers */}
        {safeHavens.map((sh, idx) => {
          const lat = (sh as any).latitude ?? (sh as any).lat;
          const lng = (sh as any).longitude ?? (sh as any).lng;
          const availCap = (sh as any).available_capacity ?? (sh as any).availableCapacityPeople ?? 0;
          const safety = (sh as any).safety_score ?? (sh as any).safetyScore ?? 90;
          const healthcare = (sh as any).healthcare_score ?? 88;
          const suitability = (sh as any).suitability_score ?? safety;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={`sh-${sh.id || idx}`}
              position={[lat, lng]}
              icon={createSafeHavenMarkerIcon()}
            >
              <Popup className="custom-leaflet-popup" autoPan={true} autoPanPadding={[50, 50]}>
                <div className="p-1 space-y-2 text-slate-900 dark:text-slate-100 min-w-[230px]">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200 dark:border-emerald-900/60">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>{sh.name}</span>
                    </h4>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                      Safe Haven
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sh.district}, {sh.state}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs py-1">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Available Capacity</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(availCap)}
                      </span>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> Safety
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {safety}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded text-[11px] flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <HeartPulse className="h-3 w-3 text-red-500" /> Health:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">{healthcare}%</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded text-[11px] flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Activity className="h-3 w-3 text-blue-500" /> Suitability:
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{suitability}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/relocation')}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-md cursor-pointer"
                  >
                    <span>Relocate Here</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
