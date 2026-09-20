import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { RelocationRecommendationPlan } from '../../types/relocation';
import { MapPanZoomController } from './MapPanZoomController';
import L from 'leaflet';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface RelocationMapProps {
  plan: RelocationRecommendationPlan;
  height?: string;
}

const redZoneIcon = L.divIcon({
  className: 'red-zone-marker',
  html: `
    <div style="
      background-color: #EF4444;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 15px rgba(239,68,68,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const safeHavenIcon = L.divIcon({
  className: 'safe-haven-marker',
  html: `
    <div style="
      background-color: #10B981;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 12px rgba(16,185,129,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

export const RelocationMap: React.FC<RelocationMapProps> = ({ plan, height = 'h-[480px]' }) => {
  const center: [number, number] = [plan.affectedLat, plan.affectedLng];

  // Permanent Light Leaflet Map style in both Light Mode and Dark Mode
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const fitBoundsCoords: [number, number][] = useMemo(() => {
    const coords: [number, number][] = [[plan.affectedLat, plan.affectedLng]];
    plan.recommendations.forEach(sh => {
      if (sh.lat && sh.lng) coords.push([sh.lat, sh.lng]);
    });
    return coords;
  }, [plan]);

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] shadow-2xl z-10`}>
      <MapContainer
        center={center}
        zoom={11}
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

        {/* Dynamic Pan, Zoom, and Fit Controller with On-Map HUD */}
        <MapPanZoomController
          initialCenter={center}
          initialZoom={11}
          fitBoundsCoords={fitBoundsCoords}
          showNavigationControls={true}
        />

        {/* Source Affected Red Zone Marker */}
        <Marker position={[plan.affectedLat, plan.affectedLng]} icon={redZoneIcon}>
          <Popup autoPan={true} autoPanPadding={[50, 50]}>
            <div className="p-1 space-y-1 text-slate-900 dark:text-slate-100 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs">
                <ShieldAlert className="h-4 w-4" />
                <span>RED ZONE: {plan.habitationName}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{plan.affectedDistrict}, {plan.affectedState}</p>
              <p className="text-xs text-slate-900 dark:text-white font-semibold pt-1">
                People Needing Relocation: {formatNumber(plan.peopleRequiringRelocation)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Target Safe Haven Markers and Connecting Polylines */}
        {plan.recommendations.map(sh => (
          <React.Fragment key={sh.id}>
            <Polyline
              positions={[
                [plan.affectedLat, plan.affectedLng],
                [sh.lat, sh.lng]
              ]}
              pathOptions={{
                color: sh.rank === 1 ? '#10B981' : sh.rank === 2 ? '#3B82F6' : '#94A3B8',
                weight: sh.rank === 1 ? 4 : 2,
                dashArray: sh.rank === 1 ? undefined : '6, 6'
              }}
            />
            <Marker position={[sh.lat, sh.lng]} icon={safeHavenIcon}>
              <Popup autoPan={true} autoPanPadding={[50, 50]}>
                <div className="p-1 space-y-1.5 text-slate-900 dark:text-slate-100 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> #{sh.rank} {sh.matchType}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      {sh.safetyScore}% Safe
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{sh.name}</h4>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
                    <p>Distance: <strong className="text-slate-900 dark:text-white">{sh.distanceKm} km</strong></p>
                    <p>Available Cap: <strong className="text-emerald-600 dark:text-emerald-400">{formatNumber(sh.availableCapacityPeople)} People</strong></p>
                    <p>Infra Grade: <strong className="text-slate-900 dark:text-white">{sh.infrastructureGrade}</strong></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};
