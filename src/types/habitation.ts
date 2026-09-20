export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SAFE';

export type HazardType = 'Flood' | 'Landslide' | 'Cyclone' | 'Earthquake' | 'Heavy Rainfall' | 'Coastal Risk';

export interface Habitation {
  id: string;
  name: string;
  district: string;
  state: string;
  population: number;
  areaSqKm: number;
  elevationMeters: number;
  distanceFromRiverKm: number;
  historicalDisastersCount: number;
  latitude: number;
  longitude: number;
  hazardScore: number; // 0 - 100
  riskLevel: RiskLevel;
  primaryHazard: HazardType;
  secondaryHazards: HazardType[];
  carryingCapacityPercentage: number; // e.g., 142% means exceeded by 42%
  carryingCapacityStatus: 'CRITICAL CAPACITY DEFICIT' | 'NEAR SAFE LIMIT' | 'OPTIMAL CAPACITY';
  infrastructureScore: number; // 0 - 100
  relocationPriorityRank: number;
  relocationStatus: 'Immediate Relocation Required' | 'High Priority Relocation' | 'Monitoring Required' | 'Safe / No Relocation';
  peopleNeedingRelocation: number;
  vulnerabilityReason: string;
  lastUpdated: string;
  families?: number;
  elderlyPopulation?: number;
  childrenPopulation?: number;
  personsWithDisabilities?: number;
  disasterHistory?: { year: number; event: string; severity: string }[];
}

export interface HabitationFilterOptions {
  searchQuery?: string;
  state?: string;
  district?: string;
  riskLevel?: RiskLevel | 'ALL';
  hazardType?: HazardType | 'ALL';
  sortBy?: 'rank' | 'hazardScore' | 'population' | 'carryingCapacityPercentage';
  sortOrder?: 'asc' | 'desc';
}
