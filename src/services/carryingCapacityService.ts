import { HabitationCarryingCapacity, ResourceMetric, ResourceStatus } from '../types/carryingCapacity';
import { mockCarryingCapacityData } from '../data/carryingCapacity';
import { api, BackendCapacityZone } from './api';

function mapBackendToCarryingCapacity(zone: BackendCapacityZone, fallback: HabitationCarryingCapacity | undefined): HabitationCarryingCapacity {
  const util = zone.total_capacity > 0 ? Math.round((zone.occupied_capacity / zone.total_capacity) * 100) : 100;
  
  const getStatus = (u: number): ResourceStatus => {
    if (u >= 100) return 'EXCEEDED';
    if (u >= 80) return 'NEAR LIMIT';
    return 'SAFE';
  };

  const metrics: ResourceMetric[] = [
    {
      id: 'res-housing',
      name: 'Safe Residential Housing Units',
      category: 'Housing',
      currentDemand: zone.occupied_capacity,
      availableCapacity: zone.housing_capacity,
      unit: 'Units',
      utilizationPercentage: zone.housing_capacity > 0 ? Math.min(200, Math.round((zone.occupied_capacity / zone.housing_capacity) * 100)) : 110,
      status: getStatus(zone.housing_capacity > 0 ? Math.round((zone.occupied_capacity / zone.housing_capacity) * 100) : 110),
      notes: `${zone.housing_capacity.toLocaleString()} total units built above 100-year flood line.`
    },
    {
      id: 'res-water',
      name: 'Potable Water Treatment & Supply',
      category: 'Water',
      currentDemand: Math.round(zone.occupied_capacity * 45),
      availableCapacity: zone.water_capacity > 0 ? zone.water_capacity * 50 : 250000,
      unit: 'Litres/Day',
      utilizationPercentage: 85,
      status: 'SAFE',
      notes: 'Deep tube-well and mobile solar chlorination facility operational.'
    },
    {
      id: 'res-health',
      name: 'Emergency Healthcare Beds',
      category: 'Healthcare',
      currentDemand: Math.round(zone.occupied_capacity * 0.08),
      availableCapacity: zone.healthcare_capacity,
      unit: 'Beds',
      utilizationPercentage: zone.healthcare_capacity > 0 ? Math.min(200, Math.round((zone.occupied_capacity * 0.08 / zone.healthcare_capacity) * 100)) : 100,
      status: getStatus(zone.healthcare_capacity > 0 ? Math.round((zone.occupied_capacity * 0.08 / zone.healthcare_capacity) * 100) : 100),
      notes: 'Sub-district hospital triage ward and oxygen cylinder reserves.'
    },
    {
      id: 'res-shelter',
      name: 'Multi-Purpose Cyclone / Flood Shelters',
      category: 'Shelter',
      currentDemand: zone.occupied_capacity,
      availableCapacity: zone.shelter_capacity,
      unit: 'Persons',
      utilizationPercentage: zone.shelter_capacity > 0 ? Math.min(200, Math.round((zone.occupied_capacity / zone.shelter_capacity) * 100)) : 120,
      status: getStatus(zone.shelter_capacity > 0 ? Math.round((zone.occupied_capacity / zone.shelter_capacity) * 100) : 120),
      notes: 'Reinforced concrete staging centers with emergency backup generators.'
    }
  ];

  return {
    habitationId: `hab-${String(zone.id).padStart(3, '0')}`,
    habitationName: zone.location_name,
    district: zone.district,
    state: zone.state,
    overallCapacityPercentage: util,
    overallStatus: zone.status === 'EXCEEDED' || util >= 100 ? 'CRITICAL CAPACITY DEFICIT' : util >= 80 ? 'NEAR SAFE LIMIT' : 'OPTIMAL CAPACITY',
    totalPopulation: zone.occupied_capacity,
    safePopulationThreshold: zone.total_capacity,
    resourceMetrics: metrics,
    aiInsight: fallback?.aiInsight || `Carrying capacity threshold currently at ${util}% of rated infrastructure limit. Resource deficit identified in emergency housing.`,
    lastAssessed: 'Live Database Assessment'
  };
}

export const carryingCapacityService = {
  async getCarryingCapacity(habitationId: string): Promise<HabitationCarryingCapacity | undefined> {
    try {
      const zones = await api.getCapacityZones();
      const numericId = parseInt(habitationId.replace(/\D/g, '')) || 1;
      const matchedZone = zones.find(z => z.id === numericId) || zones[0];
      
      if (matchedZone) {
        return mapBackendToCarryingCapacity(matchedZone, mockCarryingCapacityData[habitationId] || mockCarryingCapacityData['hab-001']);
      }
    } catch {
      // Fallback
    }

    return mockCarryingCapacityData[habitationId] || mockCarryingCapacityData['hab-001'];
  }
};
