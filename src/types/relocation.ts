import { RiskLevel } from './habitation';

export interface SafeHavenLocation {
  id: string;
  rank: number;
  matchType: 'BEST MATCH' | 'ALTERNATIVE' | 'BACKUP LOCATION';
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  safetyScore: number; // e.g. 96%
  availableCapacityPeople: number;
  distanceKm: number;
  infrastructureGrade: 'Excellent' | 'Good' | 'Moderate' | 'Basic';
  accessibilityLevel: 'High' | 'Medium' | 'Low';
  keyStrengths: string[];
  shelterCount: number;
  medicalCentersCount: number;
  elevationMeters: number;
}

export interface RelocationRecommendationPlan {
  habitationId: string;
  habitationName: string;
  affectedDistrict: string;
  affectedState: string;
  affectedLat: number;
  affectedLng: number;
  currentHazardLevel: RiskLevel;
  peopleRequiringRelocation: number;
  totalHabitationPopulation: number;
  recommendations: SafeHavenLocation[];
  aiAnalysisSummary: string;
  comparisonMetrics: {
    locationName: string;
    safetyScore: number;
    capacityScore: number; // 0 - 100 normalized
    distanceKm: number;
    infrastructureScore: number;
    accessibilityScore: number;
  }[];
  generatedAt: string;
}
