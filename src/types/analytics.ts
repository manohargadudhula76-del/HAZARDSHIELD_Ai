export interface RiskDistributionItem {
  name: string;
  count: number;
  color: string;
}

export interface DistrictVulnerabilityItem {
  district: string;
  state: string;
  populationAtRisk: number;
  criticalZonesCount: number;
}

export interface HazardDistributionItem {
  hazardType: string;
  count: number;
  percentage: number;
}

export interface CarryingCapacityStatusItem {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RelocationPriorityItem {
  level: string;
  peopleCount: number;
  habitationsCount: number;
  color: string;
}

export interface MonthlyTrendItem {
  month: string;
  criticalZones: number;
  highRisk: number;
  moderateRisk: number;
  populationAtRisk: number;
}

export interface AnalyticsSummary {
  totalHabitationsAssessed: number;
  highRiskAreas: number;
  totalPopulationExposed: number;
  relocationRequired: number;
  riskDistribution: RiskDistributionItem[];
  districtVulnerability: DistrictVulnerabilityItem[];
  hazardDistribution: HazardDistributionItem[];
  capacityStatus: CarryingCapacityStatusItem[];
  relocationPriority: RelocationPriorityItem[];
  monthlyTrends: MonthlyTrendItem[];
  aiExecutiveSummary: string;
}
