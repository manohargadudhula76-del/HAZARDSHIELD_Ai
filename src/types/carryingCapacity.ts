export type ResourceStatus = 'EXCEEDED' | 'NEAR LIMIT' | 'SAFE';

export interface ResourceMetric {
  id: string;
  name: string;
  category: 'Housing' | 'Water' | 'Healthcare' | 'Shelter' | 'Evacuation' | 'Population';
  currentDemand: number;
  availableCapacity: number;
  unit: string;
  utilizationPercentage: number;
  status: ResourceStatus;
  notes: string;
}

export interface HabitationCarryingCapacity {
  habitationId: string;
  habitationName: string;
  district: string;
  state: string;
  overallCapacityPercentage: number;
  overallStatus: 'CRITICAL CAPACITY DEFICIT' | 'NEAR SAFE LIMIT' | 'OPTIMAL CAPACITY';
  totalPopulation: number;
  safePopulationThreshold: number;
  resourceMetrics: ResourceMetric[];
  aiInsight: string;
  lastAssessed: string;
}
