import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Maximize2,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';

interface MapPanZoomControllerProps {
  initialCenter: [number, number];
  initialZoom: number;
  focusCenter?: [number, number] | null;
  focusZoom?: number;
  fitBoundsCoords?: [number, number][];
  showNavigationControls?: boolean;
}

export const MapPanZoomController: React.FC<MapPanZoomControllerProps> = ({
  initialCenter,
  initialZoom,
  focusCenter,
  focusZoom,
  fitBoundsCoords,
  showNavigationControls = true
}) => {
  const map = useMap();

  // 1. Ensure Leaflet Dragging & Multi-Touch Gestures are unconditionally active
  useEffect(() => {
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();

    // Auto-invalidate map size on container resize (sidebar collapse, screen orientation change, etc.)
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  // 2. Smoothly fly to focused location when explicitly selected
  useEffect(() => {
    if (focusCenter && focusCenter[0] && focusCenter[1]) {
      map.flyTo(focusCenter, focusZoom || Math.max(map.getZoom(), 10), {
        duration: 1.0,
        easeLinearity: 0.25
      });
    }
  }, [focusCenter, focusZoom, map]);

  // 3. Pan Helper Functions
  const handlePan = (dLat: number, dLng: number) => {
    const currentCenter = map.getCenter();
    const zoom = map.getZoom();
    // Scale pan distance according to current zoom level
    const factor = 1.0 / Math.pow(2, zoom - 6);
    map.panTo([currentCenter.lat + dLat * factor, currentCenter.lng + dLng * factor], {
      animate: true,
      duration: 0.25
    });
  };

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();

  const handleRecenter = () => {
    map.flyTo(initialCenter, initialZoom, {
      duration: 0.8,
      easeLinearity: 0.25
    });
  };

  const handleFitBounds = () => {
    if (fitBoundsCoords && fitBoundsCoords.length > 0) {
      const bounds = L.latLngBounds(fitBoundsCoords.map(c => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
    } else {
      handleRecenter();
    }
  };

  if (!showNavigationControls) return null;

  return (
    <div className="leaflet-top leaflet-right pointer-events-none p-3 z-[1000]">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* On-Map Quick Pan & Zoom HUD */}
        <div className="flex flex-col bg-white/95 dark:bg-[#151B2B]/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-[#263246] p-1.5 shadow-xl text-slate-700 dark:text-slate-200">
          {/* D-Pad Pan Controls */}
          <div className="grid grid-cols-3 gap-0.5 p-0.5 items-center justify-items-center mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">
            <div />
            <button
              type="button"
              title="Pan Up (or click-drag map)"
              onClick={() => handlePan(1.5, 0)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <div />

            <button
              type="button"
              title="Pan Left (or click-drag map)"
              onClick={() => handlePan(0, -2.0)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Reset / Recenter Initial View"
              onClick={handleRecenter}
              className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              type="button"
              title="Pan Right (or click-drag map)"
              onClick={() => handlePan(0, 2.0)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <div />
            <button
              type="button"
              title="Pan Down (or click-drag map)"
              onClick={() => handlePan(-1.5, 0)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div />
          </div>

          {/* Action Buttons: Zoom & Fit */}
          <div className="flex items-center justify-between gap-1 px-1 pt-0.5">
            <button
              type="button"
              title="Zoom In"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Zoom Out"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Fit All Locations & Bounds"
              onClick={handleFitBounds}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
