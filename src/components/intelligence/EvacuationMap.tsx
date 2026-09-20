import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { EvacuationFacility, EvacuationRoute } from '../../types/intelligence';
import { MapPanZoomController } from '../maps/MapPanZoomController';

interface EvacuationMapProps {
  facilities: EvacuationFacility[];
  routes: EvacuationRoute[];
  roadAClosed: boolean;
  highlightedRouteId?: string | null;
  height?: string;
}

// Marker Icon Generators
const createOriginIcon = () =>
  L.divIcon({
    className: 'custom-origin-marker',
    html: `
      <div style="
        background-color: #EF4444;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      ">
        🔴
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

const createFacilityIcon = (type: string, status: string) => {
  let bg = '#3B82F6';
  let emoji = '🏥';

  if (type === 'HOSPITAL') {
    bg = '#3B82F6';
    emoji = '🏥';
  } else if (type === 'SHELTER') {
    bg = '#F59E0B';
    emoji = '🏠';
  } else if (type === 'SAFE_HAVEN') {
    bg = '#10B981';
    emoji = '🟢';
  } else if (type === 'EMERGENCY_CENTER') {
    bg = status === 'INACCESSIBLE' ? '#94A3B8' : '#8B5CF6';
    emoji = '⚡';
  }

  return L.divIcon({
    className: 'custom-facility-marker',
    html: `
      <div style="
        background-color: ${bg};
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const createClosureIcon = () =>
  L.divIcon({
    className: 'custom-closure-marker',
    html: `
      <div style="
        background-color: #DC2626;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(220,38,38,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        🚧
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

export const EvacuationMap: React.FC<EvacuationMapProps> = ({
  facilities,
  routes,
  roadAClosed,
  highlightedRouteId,
  height = 'h-[500px]'
}) => {
  // Center of Rampur Village / Darrang area
  const center: [number, number] = [26.4750, 92.0550];

  // ALWAYS normal Light OpenStreetMap tile layer in BOTH dark and light application modes
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Calculate coordinates to fit all routes and facilities
  const fitBoundsCoords: [number, number][] = useMemo(() => {
    const coords: [number, number][] = [];
    facilities.forEach(f => {
      if (f.lat && f.lng) coords.push([f.lat, f.lng]);
    });
    routes.forEach(r => {
      if (r.coordinates && r.coordinates.length > 0) {
        r.coordinates.forEach(pt => coords.push(pt));
      }
    });
    return coords;
  }, [facilities, routes]);

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-2xl border border-slate-200 dark:border-[#263246] bg-white shadow-xl z-10`}>
      <MapContainer
        center={center}
        zoom={12}
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />

        {/* Dynamic Pan, Zoom, and Fit Controller with On-Map HUD */}
        <MapPanZoomController
          initialCenter={center}
          initialZoom={12}
          fitBoundsCoords={fitBoundsCoords}
          showNavigationControls={true}
        />

        {/* Render Route Polylines */}
        {routes.map((r) => {
          const isClosed = roadAClosed && r.id === 'route-a';
          const isHighlighted = highlightedRouteId === r.id;

          let color = '#10B981'; // Green open
          let dashArray = undefined;
          let weight = 4;
          let opacity = 0.8;

          if (isClosed) {
            color = '#EF4444'; // Red closed
            dashArray = '8, 8';
            weight = 5;
            opacity = 0.9;
          } else if (isHighlighted) {
            color = '#6366F1'; // Highlighted alternative purple
            weight = 6;
            opacity = 1.0;
          } else if (r.id === 'route-b' && roadAClosed) {
            color = '#3B82F6'; // Active detour route
            weight = 5;
          }

          return (
            <Polyline
              key={r.id}
              positions={r.coordinates}
              pathOptions={{
                color,
                weight,
                dashArray,
                opacity
              }}
            >
              <Popup autoPan={true} autoPanPadding={[50, 50]}>
                <div className="p-1 text-xs">
                  <h4 className="font-bold text-slate-900">{r.name}</h4>
                  <p className="text-slate-600">
                    Status: <span className="font-bold">{isClosed ? 'CLOSED' : 'OPEN'}</span>
                  </p>
                  <p className="text-slate-600">Distance: {r.distanceKm} km</p>
                  <p className="text-slate-600">Travel Time: {r.travelTimeMin} mins</p>
                  <p className="text-slate-600">Affected Population: {r.affectedPopulation}</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Roadblock indicator if closed */}
        {roadAClosed && (
          <Marker position={[26.4450, 92.0280]} icon={createClosureIcon()}>
            <Popup autoPan={true} autoPanPadding={[50, 50]}>
              <div className="p-1 text-xs text-slate-900">
                <span className="font-black text-red-600 block">ROAD CLOSURE POINT</span>
                <span>Submerged culvert & bridge washout on Route A</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Facility Markers */}
        {facilities.map((fac) => {
          const isOrigin = fac.id === 'fac-hab';
          const icon = isOrigin
            ? createOriginIcon()
            : createFacilityIcon(
                fac.type,
                roadAClosed && fac.id === 'fac-hosp' ? 'INACCESSIBLE' : fac.status
              );

          return (
            <Marker
              key={fac.id}
              position={[fac.lat, fac.lng]}
              icon={icon}
            >
              <Popup className="custom-facility-popup" autoPan={true} autoPanPadding={[50, 50]}>
                <div className="p-1 text-xs space-y-1 min-w-[180px]">
                  <h4 className="font-bold text-slate-900">{fac.name}</h4>
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        roadAClosed && fac.id === 'fac-hosp'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {roadAClosed && fac.id === 'fac-hosp'
                        ? 'ROUTE CUTOFF'
                        : fac.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {fac.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{fac.description}</p>
                  {fac.capacity && (
                    <p className="text-[11px] font-semibold text-slate-700">
                      Capacity: {fac.capacity} Persons
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
