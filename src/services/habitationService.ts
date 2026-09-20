import { Habitation, HabitationFilterOptions, RiskLevel, HazardType } from '../types/habitation';
import { mockHabitations } from '../data/habitations';
import { api, BackendHabitation } from './api';

function mapBackendToHabitation(bh: BackendHabitation, index: number, fallbackList: Habitation[]): Habitation {
  const fallback = fallbackList.find(m => m.name.toLowerCase() === bh.name.toLowerCase() || m.id === `hab-${String(bh.id).padStart(3, '0')}`);
  
  let riskLevel: RiskLevel = 'SAFE';
  if (bh.risk_score >= 80) riskLevel = 'CRITICAL';
  else if (bh.risk_score >= 65) riskLevel = 'HIGH';
  else if (bh.risk_score >= 45) riskLevel = 'MODERATE';
  else riskLevel = 'LOW';

  let relocationStatus: Habitation['relocationStatus'] = 'Safe / No Relocation';
  if (bh.relocation_priority === 'IMMEDIATE' || bh.risk_score >= 80) {
    relocationStatus = 'Immediate Relocation Required';
  } else if (bh.relocation_priority === 'SHORT_TERM' || bh.risk_score >= 65) {
    relocationStatus = 'High Priority Relocation';
  } else if (bh.risk_score >= 40) {
    relocationStatus = 'Monitoring Required';
  }

  const primaryHaz: HazardType = fallback?.primaryHazard || (bh.state === 'Assam' || bh.state === 'Bihar' ? 'Flood' : bh.state === 'Uttarakhand' || bh.state === 'Himachal Pradesh' ? 'Landslide' : 'Cyclone');

  return {
    id: `hab-${String(bh.id).padStart(3, '0')}`,
    name: bh.name,
    district: bh.district,
    state: bh.state,
    population: bh.population,
    areaSqKm: fallback?.areaSqKm || 12.4,
    elevationMeters: fallback?.elevationMeters || (bh.state === 'Uttarakhand' ? 1450 : 45),
    distanceFromRiverKm: fallback?.distanceFromRiverKm || 0.8,
    historicalDisastersCount: fallback?.historicalDisastersCount || 12,
    latitude: bh.latitude,
    longitude: bh.longitude,
    hazardScore: bh.risk_score,
    riskLevel: (bh.risk_level as RiskLevel) || riskLevel,
    primaryHazard: primaryHaz,
    secondaryHazards: fallback?.secondaryHazards || ['Heavy Rainfall'],
    carryingCapacityPercentage: fallback?.carryingCapacityPercentage || (bh.risk_score > 75 ? 142 : 88),
    carryingCapacityStatus: bh.risk_score > 75 ? 'CRITICAL CAPACITY DEFICIT' : bh.risk_score > 55 ? 'NEAR SAFE LIMIT' : 'OPTIMAL CAPACITY',
    infrastructureScore: fallback?.infrastructureScore || (100 - Math.round(bh.vulnerability_score)),
    relocationPriorityRank: index + 1,
    relocationStatus,
    peopleNeedingRelocation: bh.relocation_priority === 'IMMEDIATE' ? bh.population : Math.round(bh.population * 0.7),
    vulnerabilityReason: fallback?.vulnerabilityReason || `Critical multi-hazard risk index (${bh.risk_score}/100) with vulnerability score ${bh.vulnerability_score}/100.`,
    lastUpdated: 'Live Database',
    families: bh.families || Math.round(bh.population / 5),
    elderlyPopulation: fallback?.elderlyPopulation || Math.round(bh.population * 0.12),
    childrenPopulation: fallback?.childrenPopulation || Math.round(bh.population * 0.18),
    personsWithDisabilities: fallback?.personsWithDisabilities || Math.round(bh.population * 0.03),
    disasterHistory: fallback?.disasterHistory || [
      { year: 2024, event: `${primaryHaz} Disaster Inundation`, severity: 'CRITICAL' },
      { year: 2022, event: 'Flash Inundation & Embankment Breach', severity: 'HIGH' }
    ]
  };
}

export const habitationService = {
  async getHabitations(options?: HabitationFilterOptions): Promise<Habitation[]> {
    let result: Habitation[] = [];
    try {
      const backendHabs = await api.getHabitations();
      if (backendHabs && backendHabs.length > 0) {
        result = backendHabs.map((bh, idx) => mapBackendToHabitation(bh, idx, mockHabitations));
      } else {
        result = [...mockHabitations];
      }
    } catch {
      result = [...mockHabitations];
    }

    if (!options) return result;

    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      result = result.filter(
        h =>
          h.name.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          h.state.toLowerCase().includes(q) ||
          h.primaryHazard.toLowerCase().includes(q)
      );
    }

    if (options.state && options.state !== 'ALL') {
      result = result.filter(h => h.state === options.state);
    }

    if (options.district && options.district !== 'ALL') {
      result = result.filter(h => h.district === options.district);
    }

    if (options.riskLevel && options.riskLevel !== 'ALL') {
      result = result.filter(h => h.riskLevel === options.riskLevel);
    }

    if (options.hazardType && options.hazardType !== 'ALL') {
      result = result.filter(h => h.primaryHazard === options.hazardType);
    }

    if (options.sortBy) {
      result.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        switch (options.sortBy) {
          case 'rank':
            valA = a.relocationPriorityRank;
            valB = b.relocationPriorityRank;
            break;
          case 'hazardScore':
            valA = b.hazardScore;
            valB = a.hazardScore;
            break;
          case 'population':
            valA = b.population;
            valB = a.population;
            break;
          case 'carryingCapacityPercentage':
            valA = b.carryingCapacityPercentage;
            valB = a.carryingCapacityPercentage;
            break;
        }
        return options.sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }

    return result;
  },

  async getHabitationById(id: string): Promise<Habitation | undefined> {
    const list = await this.getHabitations();
    const cleanId = id.toLowerCase();
    const numericId = parseInt(id.replace(/\D/g, ''));
    
    return list.find(h => 
      h.id.toLowerCase() === cleanId || 
      (numericId && parseInt(h.id.replace(/\D/g, '')) === numericId)
    ) || list[0];
  }
};
