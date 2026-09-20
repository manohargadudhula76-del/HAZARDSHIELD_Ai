import L from 'leaflet';
import { RiskLevel } from '../types/habitation';

// Fix default Leaflet marker icon paths for Vite/React Leaflet bundler
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export function createColoredMarkerIcon(riskLevel: RiskLevel): L.DivIcon {
  let colorClass = '#EF4444'; // Red for CRITICAL
  if (riskLevel === 'HIGH') colorClass = '#F97316'; // Orange
  else if (riskLevel === 'MODERATE') colorClass = '#F59E0B'; // Amber
  else if (riskLevel === 'LOW' || riskLevel === 'SAFE') colorClass = '#10B981'; // Green

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${colorClass};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

export function createSafeHavenMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-safe-haven-marker',
    html: `
      <div style="
        background-color: #059669;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
      ">
        🛡️
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

export function createRedZoneMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-red-zone-marker',
    html: `
      <div style="
        background-color: #DC2626;
        width: 30px;
        height: 30px;
        transform: rotate(45deg);
        border: 2px solid #FEE2E2;
        box-shadow: 0 0 12px rgba(220, 38, 38, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(-45deg); color: white; font-size: 13px; font-weight: bold; line-height: 1;">
          ⚠️
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
}


