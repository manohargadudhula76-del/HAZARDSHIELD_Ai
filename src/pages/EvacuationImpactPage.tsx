import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { EvacuationMap } from '../components/intelligence/EvacuationMap';
import { RouteImpactPanel } from '../components/intelligence/RouteImpactPanel';
import { RouteStatusCard } from '../components/intelligence/RouteStatusCard';
import {
  mockEvacuationFacilities,
  mockEvacuationRoutes,
  getEvacuationImpactAnalysis
} from '../data/evacuationImpact';
import { EvacuationRoute } from '../types/intelligence';
import { api, BackendHabitation, EvacuationNetworkResponse } from '../services/api';
import { Navigation, MapPin, Loader2 } from 'lucide-react';

export const EvacuationImpactPage: React.FC = () => {
  const [habitations, setHabitations] = useState<BackendHabitation[]>([]);
  const [selectedHabitationId, setSelectedHabitationId] = useState('1');
  // Road closure simulation state
  const [roadAClosed, setRoadAClosed] = useState(false);
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null);
  const [networkData, setNetworkData] = useState<EvacuationNetworkResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getHabitations().then((res) => {
      if (res && res.length > 0) {
        setHabitations(res);
        setSelectedHabitationId(String(res[0].id));
      }
    }).catch(console.warn);
  }, []);

  useEffect(() => {
    setLoading(true);
    const numericId = parseInt(selectedHabitationId.replace(/\D/g, '')) || 1;
    api.getEvacuationNetwork(numericId, roadAClosed)
      .then((data) => {
        setNetworkData(data);
      })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [selectedHabitationId, roadAClosed]);

  const selectedHabitation = habitations.find(h => String(h.id) === selectedHabitationId) || habitations[0];
  const habitationName = networkData?.habitation_name || selectedHabitation?.name || 'Rampur River Basin';
  const district = networkData?.district || selectedHabitation?.district || 'Darrang';
  const state = networkData?.state || selectedHabitation?.state || 'Assam';
  const population = networkData?.population_affected || selectedHabitation?.population || 4850;

  const impactSummary = getEvacuationImpactAnalysis(roadAClosed);

  // If backend networkData has calculated routes, convert coordinates for EvacuationMap
  const dynamicRoutes: EvacuationRoute[] = networkData?.routes && networkData.routes.length > 0
    ? networkData.routes.map((r, i) => ({
        id: i === 0 ? 'route-a' : 'route-b',
        name: r.route_name,
        from: r.origin,
        toFacilityId: i === 0 ? 'fac-hosp' : 'fac-shelter',
        toFacilityName: r.destination,
        distanceKm: r.distance_km,
        travelTimeMin: r.duration_minutes,
        baseStatus: r.is_closed ? 'CLOSED' : (i === 0 ? 'OPEN' : 'ALTERNATIVE'),
        affectedPopulation: networkData.population_affected || 4850,
        coordinates: r.geometry.coordinates.map((pt) => [pt[1], pt[0]] as [number, number]),
        alternateRouteId: i === 0 ? 'route-b' : undefined
      }))
    : mockEvacuationRoutes;

  const handleToggleRoadA = () => {
    const nextState = !roadAClosed;
    setRoadAClosed(nextState);
    if (!nextState) {
      setHighlightedRouteId(null);
    } else {
      // Auto-focus alternative when closed
      setHighlightedRouteId('route-b');
    }
  };

  const handleSelectAlternative = (routeId: string) => {
    setHighlightedRouteId(prev => (prev === routeId ? null : routeId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Evacuation Route & Road Closure Impact"
        subtitle="Assess how infrastructure failures affect access to hospitals, shelters and safe zones."
        icon={Navigation}
        badgeText="INFRASTRUCTURE INTELLIGENCE"
        actionButton={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              OpenStreetMap OSRM • GIS Network Routing
            </span>
          </div>
        }
      />

      {/* Origin Context Info Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Primary Evacuation Origin
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {habitationName} ({district}, {state})
              </span>
              <span className="text-slate-500 ml-2">
                {population.toLocaleString()} Residents • Low-Lying River Basin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Habitation Selector */}
            <select
              value={selectedHabitationId}
              onChange={(e) => setSelectedHabitationId(e.target.value)}
              className="text-xs font-bold rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {habitations.length > 0 ? (
                habitations.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name} ({h.district})
                  </option>
                ))
              ) : (
                <option value="1">Rampur River Basin</option>
              )}
            </select>
            <span className="px-3 py-1 rounded-full font-black text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              "Can vulnerable people actually reach safety?"
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left GIS Leaflet Map (Light Tiles), Right Impact Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Map Column (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Geospatial Evacuation Network</span>
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Interactive route connectivity to health facilities, shelters, and high-ridge safe havens
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Light OpenStreetMap
              </span>
            </div>

            <EvacuationMap
              facilities={mockEvacuationFacilities}
              routes={dynamicRoutes}
              roadAClosed={roadAClosed}
              highlightedRouteId={highlightedRouteId}
              height="h-[480px]"
            />
          </div>

          {/* Facility Accessibility Status */}
          <RouteStatusCard
            facilities={mockEvacuationFacilities}
            roadAClosed={roadAClosed}
          />
        </div>

        {/* Road Closure Simulation & Impact Panel (5 cols) */}
        <div className="xl:col-span-5">
          <RouteImpactPanel
            impact={impactSummary}
            roadAClosed={roadAClosed}
            onToggleRoadA={handleToggleRoadA}
            onSelectAlternative={handleSelectAlternative}
            isAlternativeSelected={highlightedRouteId === 'route-b'}
          />
        </div>
      </div>
    </div>
  );
};

