import { EvacuationFacility, EvacuationRoute, EvacuationImpactSummary } from '../types/intelligence';

export const mockEvacuationFacilities: EvacuationFacility[] = [
  {
    id: 'fac-hab',
    name: 'Rampur Village (Origin)',
    type: 'EMERGENCY_CENTER', // Rendered as vulnerable origin
    lat: 26.4521,
    lng: 92.0315,
    status: 'ACCESSIBLE',
    description: 'Vulnerable habitation with 4,850 residents situated in low-lying floodplain.'
  },
  {
    id: 'fac-hosp',
    name: 'Mangaldai District Civil Hospital',
    type: 'HOSPITAL',
    lat: 26.4380,
    lng: 92.0250,
    capacity: 250,
    status: 'ACCESSIBLE',
    description: 'Primary critical care hospital with 24/7 trauma and emergency wing.'
  },
  {
    id: 'fac-shelter',
    name: 'Mangaldai Multi-Purpose Relief Shelter',
    type: 'SHELTER',
    lat: 26.4680,
    lng: 92.0450,
    capacity: 3500,
    status: 'ACCESSIBLE',
    description: 'Raised concrete multi-level relief facility with generator backup and water filtration.'
  },
  {
    id: 'fac-safehaven',
    name: 'Safe Haven Alpha (Mangaldai High Ridge)',
    type: 'SAFE_HAVEN',
    lat: 26.5120,
    lng: 92.0830,
    capacity: 5000,
    status: 'ACCESSIBLE',
    description: 'High-elevation elevated ridge plateau designated as primary regional relocation hub.'
  },
  {
    id: 'fac-emergency',
    name: 'River Bank Emergency Sub-Center',
    type: 'EMERGENCY_CENTER',
    lat: 26.4430,
    lng: 92.0150,
    capacity: 400,
    status: 'ACCESSIBLE',
    description: 'Rapid response boat depot and primary medical triage tent post.'
  }
];

export const mockEvacuationRoutes: EvacuationRoute[] = [
  {
    id: 'route-a',
    name: 'Route A (Main Arterial NH-15 Connector)',
    from: 'Rampur Village',
    toFacilityId: 'fac-hosp',
    toFacilityName: 'Mangaldai District Civil Hospital',
    distanceKm: 6.2,
    travelTimeMin: 12,
    baseStatus: 'OPEN',
    affectedPopulation: 1240,
    alternateRouteId: 'route-b',
    coordinates: [
      [26.4521, 92.0315],
      [26.4490, 92.0300],
      [26.4450, 92.0280],
      [26.4410, 92.0260],
      [26.4380, 92.0250]
    ]
  },
  {
    id: 'route-b',
    name: 'Route B (High Ridge Bypass Corridor)',
    from: 'Rampur Village',
    toFacilityId: 'fac-shelter',
    toFacilityName: 'Mangaldai Relief Shelter & Bypass Hub',
    distanceKm: 11.0,
    travelTimeMin: 23,
    baseStatus: 'OPEN',
    affectedPopulation: 650,
    coordinates: [
      [26.4521, 92.0315],
      [26.4560, 92.0380],
      [26.4620, 92.0420],
      [26.4680, 92.0450],
      [26.4580, 92.0330],
      [26.4420, 92.0290],
      [26.4380, 92.0250]
    ]
  },
  {
    id: 'route-c',
    name: 'Route C (North Elevated Relief Link)',
    from: 'Rampur Village',
    toFacilityId: 'fac-safehaven',
    toFacilityName: 'Safe Haven Alpha (High Ridge)',
    distanceKm: 8.4,
    travelTimeMin: 16,
    baseStatus: 'OPEN',
    affectedPopulation: 320,
    coordinates: [
      [26.4521, 92.0315],
      [26.4650, 92.0450],
      [26.4800, 92.0600],
      [26.4980, 92.0720],
      [26.5120, 92.0830]
    ]
  }
];

export const mockRoutePopulationData = [
  { name: 'Route A (Main Arterial)', population: 1240, color: '#EF4444' },
  { name: 'Route B (Ridge Bypass)', population: 650, color: '#3B82F6' },
  { name: 'Route C (North Link)', population: 320, color: '#10B981' }
];

export function getEvacuationImpactAnalysis(roadAClosed: boolean): EvacuationImpactSummary {
  if (roadAClosed) {
    return {
      affectedPopulation: 1240,
      routesAffected: 2,
      additionalDistanceKm: 4.8,
      additionalTravelTimeMin: 11,
      previouslyAccessibleCount: 4,
      nowInaccessibleCount: 1,
      recommendedAlternative: {
        routeId: 'route-b',
        name: 'Route B (High Ridge Bypass)',
        distanceKm: 11.0,
        travelTimeMin: 23,
        accessibility: 'GOOD'
      }
    };
  }

  return {
    affectedPopulation: 0,
    routesAffected: 0,
    additionalDistanceKm: 0,
    additionalTravelTimeMin: 0,
    previouslyAccessibleCount: 5,
    nowInaccessibleCount: 0,
    recommendedAlternative: {
      routeId: 'route-a',
      name: 'Route A (Direct Highway)',
      distanceKm: 6.2,
      travelTimeMin: 12,
      accessibility: 'OPTIMAL'
    }
  };
}
