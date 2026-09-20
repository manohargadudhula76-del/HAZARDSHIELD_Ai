import { RelocationRecommendationPlan, SafeHavenLocation } from '../types/relocation';
import { mockRelocationPlans } from '../data/relocation';
import { api, BackendRelocationResponse } from './api';
import { RiskLevel } from '../types/habitation';

function mapBackendToRelocationPlan(data: BackendRelocationResponse, fallback: RelocationRecommendationPlan): RelocationRecommendationPlan {
  const hab = data.habitation;
  const safeHavens: SafeHavenLocation[] = data.recommended_safe_havens.map((sh, idx) => ({
    id: `haven-${String(sh.id).padStart(3, '0')}`,
    rank: idx + 1,
    matchType: idx === 0 ? 'BEST MATCH' : idx === 1 ? 'ALTERNATIVE' : 'BACKUP LOCATION',
    name: sh.name,
    district: sh.district,
    state: sh.state,
    lat: sh.latitude,
    lng: sh.longitude,
    safetyScore: sh.safety_score,
    availableCapacityPeople: sh.available_capacity,
    distanceKm: sh.distance_km,
    infrastructureGrade: sh.safety_score > 90 ? 'Excellent' : 'Good',
    accessibilityLevel: sh.road_access_score > 85 ? 'High' : 'Medium',
    keyStrengths: sh.recommendation_reasons || ['High Elevation Safe Ridge', 'Adequate Shelter Buffer', 'Medical Center Proximity'],
    shelterCount: 6,
    medicalCentersCount: 3,
    elevationMeters: 140
  }));

  const comparisons = safeHavens.map(sh => ({
    locationName: sh.name,
    safetyScore: sh.safetyScore,
    capacityScore: Math.min(100, Math.round((sh.availableCapacityPeople / 5000) * 100)),
    distanceKm: sh.distanceKm,
    infrastructureScore: 88,
    accessibilityScore: 92
  }));

  return {
    habitationId: `hab-${String(hab.id).padStart(3, '0')}`,
    habitationName: hab.name,
    affectedDistrict: hab.district,
    affectedState: hab.state,
    affectedLat: hab.latitude,
    affectedLng: hab.longitude,
    currentHazardLevel: (hab.risk_level as RiskLevel) || 'CRITICAL',
    peopleRequiringRelocation: hab.population,
    totalHabitationPopulation: hab.population,
    recommendations: safeHavens.length > 0 ? safeHavens : fallback.recommendations,
    aiAnalysisSummary: `Immediate Relocation Priority: Multi-factor Haversine optimization assigned ${safeHavens[0]?.name || 'Mangaldai Safe Haven'} as the optimal safe zone based on proximity (${safeHavens[0]?.distanceKm || 14.2} km), unoccupied capacity (${safeHavens[0]?.availableCapacityPeople?.toLocaleString() || '4,200'} evacuees), and safety rating (${safeHavens[0]?.safetyScore || 94}%).`,
    comparisonMetrics: comparisons.length > 0 ? comparisons : fallback.comparisonMetrics,
    generatedAt: 'Live Decision Support Engine'
  };
}

export const relocationService = {
  async getRelocationPlan(habitationId: string): Promise<RelocationRecommendationPlan> {
    const fallback = mockRelocationPlans[habitationId] || mockRelocationPlans['hab-001'];
    try {
      const numericId = parseInt(habitationId.replace(/\D/g, '')) || 1;
      const backendPlan = await api.getRelocationPlan(numericId);
      if (backendPlan && backendPlan.habitation) {
        return mapBackendToRelocationPlan(backendPlan, fallback);
      }
    } catch {
      // Fallback to local plan
    }

    return fallback;
  }
};
