// Types for Explainable Risk
export interface RiskContributor {
  name: string;
  percentage: number;
  color: string;
  description: string;
}

export interface RiskExplanationFactor {
  id: string;
  iconName: string;
  factor: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  explanation: string;
}

export interface HazardProfileItem {
  hazard: string;
  score: number;
  level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  trend: string;
}

export interface FormulaWeightItem {
  factor: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
}

export interface ExplainableRiskHabitation {
  habitationId: string;
  name: string;
  district: string;
  state: string;
  overallRisk: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  primaryRiskDriver: string;
  secondaryRiskDriver: string;
  summaryExplanation: string;
  contributors: RiskContributor[];
  explanationFactors: RiskExplanationFactor[];
  hazardProfile: HazardProfileItem[];
  formulaWeights: FormulaWeightItem[];
}

// Types for Scenario Simulator
export interface ScenarioInputs {
  rainfallChange: number; // -30% to +50%
  populationChange: number; // -10% to +30%
  mainRoadClosed: boolean; // boolean
  hospitalAvailable: boolean; // boolean
  shelterCapacityChange: number; // -50% to +20%
}

export interface ScenarioResultMetrics {
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  populationAtRisk: number;
  evacuationAccess: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL FAILURE';
  shelterCapacityStatus: 'SURPLUS' | 'SUFFICIENT' | 'STRAINED' | 'INSUFFICIENT' | 'CRITICAL DEFICIT';
}

export interface ScenarioImpactBreakdownItem {
  driver: string;
  delta: number;
  description: string;
}

// Types for Evacuation Impact Analysis
export interface EvacuationFacility {
  id: string;
  name: string;
  type: 'HOSPITAL' | 'SHELTER' | 'SAFE_HAVEN' | 'EMERGENCY_CENTER';
  lat: number;
  lng: number;
  capacity?: number;
  status: 'ACCESSIBLE' | 'INACCESSIBLE' | 'CONGESTED';
  description: string;
}

export interface EvacuationRoute {
  id: string;
  name: string;
  from: string;
  toFacilityId: string;
  toFacilityName: string;
  distanceKm: number;
  travelTimeMin: number;
  baseStatus: 'OPEN' | 'CONGESTED' | 'CLOSED' | 'ALTERNATIVE';
  coordinates: [number, number][];
  affectedPopulation: number;
  alternateRouteId?: string;
  elevationProfile?: string;
}

export interface EvacuationImpactSummary {
  affectedPopulation: number;
  routesAffected: number;
  additionalDistanceKm: number;
  additionalTravelTimeMin: number;
  previouslyAccessibleCount: number;
  nowInaccessibleCount: number;
  recommendedAlternative: {
    routeId: string;
    name: string;
    distanceKm: number;
    travelTimeMin: number;
    accessibility: string;
  };
}

// Types for Cascading Impact Analysis
export interface CascadeStage {
  id: string;
  stageNumber: number;
  title: string;
  metric: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  impactDescription: string;
  affectedPopulation?: number;
  category: 'HAZARD' | 'INFRASTRUCTURE' | 'SERVICE' | 'HUMAN_RISK';
}

export interface CascadeEventRow {
  id: string;
  event: string;
  trigger: string;
  impact: string;
  affectedPopulation: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  estimatedDelay: string;
}

export interface CascadeProgressionStep {
  step: string;
  riskScore: number;
  label: string;
}
