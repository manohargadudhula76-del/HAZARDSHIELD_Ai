import { RiskLevel, HazardType } from './habitation';

export interface FactorScore {
  factorName: string;
  score: number; // 0 - 100
  weight: number; // percentage
  status: 'Critical' | 'High' | 'Moderate' | 'Low';
  description: string;
}

export interface HazardAssessmentInput {
  habitationName: string;
  district: string;
  state: string;
  totalPopulation: number;
  areaSqKm: number;
  averageRainfallMm: number;
  distanceFromRiverKm: number;
  elevationMeters: number;
  historicalDisasterFrequency: number;
  populationDensity: number;
  infrastructureScore: number;
}

export interface HazardAssessmentResult {
  habitationId?: string;
  habitationName: string;
  overallHazardScore: number;
  riskLevel: RiskLevel;
  primaryHazard: HazardType;
  factors: {
    floodRisk: number;
    landslideRisk: number;
    cycloneRisk: number;
    rainfallRisk: number;
    infrastructureRisk: number;
    populationExposure: number;
  };
  factorDetails: FactorScore[];
  aiExplanation: string;
  recommendationSummary: string;
  assessedAt: string;
}

export interface MapLocationMarker {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  hazardScore: number;
  riskLevel: RiskLevel;
  hazardType: HazardType;
  population: number;
  carryingCapacityPercentage: number;
  status: string;
}
