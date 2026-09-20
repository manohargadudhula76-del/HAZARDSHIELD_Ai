import { RelocationRecommendationPlan } from '../types/relocation';

export const mockRelocationPlans: Record<string, RelocationRecommendationPlan> = {
  'hab-001': {
    habitationId: 'hab-001',
    habitationName: 'Rampur Village',
    affectedDistrict: 'Darrang',
    affectedState: 'Assam',
    affectedLat: 26.4521,
    affectedLng: 92.0315,
    currentHazardLevel: 'CRITICAL',
    peopleRequiringRelocation: 3500,
    totalHabitationPopulation: 4850,
    recommendations: [
      {
        id: 'sh-a',
        rank: 1,
        matchType: 'BEST MATCH',
        name: 'Safe Haven Alpha (Mangaldai High Ridge)',
        district: 'Darrang',
        state: 'Assam',
        lat: 26.5120,
        lng: 92.0830,
        safetyScore: 96,
        availableCapacityPeople: 5000,
        distanceKm: 7.2,
        infrastructureGrade: 'Excellent',
        accessibilityLevel: 'High',
        keyStrengths: [
          '35m above flood line',
          'National Highway connectivity',
          'District Civil Hospital 2km away',
          'Existing 3,000-person multi-purpose shelter'
        ],
        shelterCount: 4,
        medicalCentersCount: 2,
        elevationMeters: 62
      },
      {
        id: 'sh-b',
        rank: 2,
        matchType: 'ALTERNATIVE',
        name: 'Safe Haven Beta (Kharupetia Township)',
        district: 'Darrang',
        state: 'Assam',
        lat: 26.5340,
        lng: 92.1450,
        safetyScore: 89,
        availableCapacityPeople: 8000,
        distanceKm: 12.0,
        infrastructureGrade: 'Good',
        accessibilityLevel: 'High',
        keyStrengths: [
          'High capacity commercial infrastructure',
          'Continuous power grid stability',
          'Broad 4-lane access arterial road'
        ],
        shelterCount: 6,
        medicalCentersCount: 3,
        elevationMeters: 58
      },
      {
        id: 'sh-c',
        rank: 3,
        matchType: 'BACKUP LOCATION',
        name: 'Safe Haven Gamma (Sipajhar Plateau)',
        district: 'Darrang',
        state: 'Assam',
        lat: 26.4890,
        lng: 91.9540,
        safetyScore: 82,
        availableCapacityPeople: 4000,
        distanceKm: 9.0,
        infrastructureGrade: 'Moderate',
        accessibilityLevel: 'Medium',
        keyStrengths: [
          'Natural basalt plateau elevation',
          'Low inundation history',
          'Community center conversion ready'
        ],
        shelterCount: 2,
        medicalCentersCount: 1,
        elevationMeters: 51
      }
    ],
    aiAnalysisSummary: 'Safe Haven Alpha (Mangaldai High Ridge) is recommended as the optimal relocation site because it possesses the highest composite safety score (96%), ample available capacity (5,000 people > 3,500 needed), direct four-lane road accessibility, proximity to tertiary medical care, and zero historical inundation markers.',
    comparisonMetrics: [
      {
        locationName: 'Safe Haven Alpha',
        safetyScore: 96,
        capacityScore: 95,
        distanceKm: 7.2,
        infrastructureScore: 92,
        accessibilityScore: 90
      },
      {
        locationName: 'Safe Haven Beta',
        safetyScore: 89,
        capacityScore: 98,
        distanceKm: 12.0,
        infrastructureScore: 85,
        accessibilityScore: 88
      },
      {
        locationName: 'Safe Haven Gamma',
        safetyScore: 82,
        capacityScore: 78,
        distanceKm: 9.0,
        infrastructureScore: 70,
        accessibilityScore: 75
      }
    ],
    generatedAt: '15 minutes ago'
  },
  'hab-002': {
    habitationId: 'hab-002',
    habitationName: 'Devipur',
    affectedDistrict: 'Rudraprayag',
    affectedState: 'Uttarakhand',
    affectedLat: 30.2844,
    affectedLng: 78.9811,
    currentHazardLevel: 'CRITICAL',
    peopleRequiringRelocation: 2100,
    totalHabitationPopulation: 2980,
    recommendations: [
      {
        id: 'sh-eta',
        rank: 1,
        matchType: 'BEST MATCH',
        name: 'Safe Haven Eta (Dehradun Valley Shelter)',
        district: 'Dehradun',
        state: 'Uttarakhand',
        lat: 30.3165,
        lng: 78.0322,
        safetyScore: 94,
        availableCapacityPeople: 5500,
        distanceKm: 85.0,
        infrastructureGrade: 'Excellent',
        accessibilityLevel: 'High',
        keyStrengths: [
          'Geologically stable valley floor',
          'Capital city resource access',
          'Helipad access for rapid transport'
        ],
        shelterCount: 6,
        medicalCentersCount: 3,
        elevationMeters: 450
      },
      {
        id: 'sh-u1',
        rank: 2,
        matchType: 'ALTERNATIVE',
        name: 'Rishikesh Relief Camp',
        district: 'Dehradun',
        state: 'Uttarakhand',
        lat: 30.0869,
        lng: 78.2676,
        safetyScore: 88,
        availableCapacityPeople: 3000,
        distanceKm: 70.0,
        infrastructureGrade: 'Good',
        accessibilityLevel: 'High',
        keyStrengths: [
          'Good road connectivity',
          'Proximity to major hospitals'
        ],
        shelterCount: 4,
        medicalCentersCount: 2,
        elevationMeters: 372
      },
      {
        id: 'sh-u2',
        rank: 3,
        matchType: 'BACKUP LOCATION',
        name: 'Haridwar Temporary Shelter',
        district: 'Haridwar',
        state: 'Uttarakhand',
        lat: 29.9457,
        lng: 78.1642,
        safetyScore: 85,
        availableCapacityPeople: 4000,
        distanceKm: 95.0,
        infrastructureGrade: 'Good',
        accessibilityLevel: 'High',
        keyStrengths: [
          'Large capacity available',
          'Plains area, low landslide risk'
        ],
        shelterCount: 5,
        medicalCentersCount: 2,
        elevationMeters: 314
      }
    ],
    aiAnalysisSummary: 'Safe Haven Eta is chosen as the primary relocation point for Devipur due to its geological stability, sufficient capacity to house 2,100 people, and comprehensive urban medical infrastructure in Dehradun.',
    comparisonMetrics: [
      {
        locationName: 'Safe Haven Eta',
        safetyScore: 94,
        capacityScore: 92,
        distanceKm: 85.0,
        infrastructureScore: 95,
        accessibilityScore: 88
      },
      {
        locationName: 'Rishikesh Relief Camp',
        safetyScore: 88,
        capacityScore: 80,
        distanceKm: 70.0,
        infrastructureScore: 85,
        accessibilityScore: 90
      },
      {
        locationName: 'Haridwar Temp Shelter',
        safetyScore: 85,
        capacityScore: 88,
        distanceKm: 95.0,
        infrastructureScore: 82,
        accessibilityScore: 92
      }
    ],
    generatedAt: '30 minutes ago'
  },
  'hab-007': {
    habitationId: 'hab-007',
    habitationName: 'Sunderbans Outpost',
    affectedDistrict: 'South 24 Parganas',
    affectedState: 'West Bengal',
    affectedLat: 21.9497,
    affectedLng: 88.9007,
    currentHazardLevel: 'CRITICAL',
    peopleRequiringRelocation: 2850,
    totalHabitationPopulation: 4120,
    recommendations: [
      {
        id: 'sh-theta',
        rank: 1,
        matchType: 'BEST MATCH',
        name: 'Safe Haven Theta (Diamond Harbour Relief)',
        district: 'South 24 Parganas',
        state: 'West Bengal',
        lat: 22.1866,
        lng: 88.1923,
        safetyScore: 85,
        availableCapacityPeople: 3500,
        distanceKm: 40.0,
        infrastructureGrade: 'Good',
        accessibilityLevel: 'Medium',
        keyStrengths: [
          'Elevated inland structures',
          'Water purification plants on site',
          'Sturdy multi-purpose shelters'
        ],
        shelterCount: 3,
        medicalCentersCount: 2,
        elevationMeters: 8
      },
      {
        id: 'sh-w1',
        rank: 2,
        matchType: 'ALTERNATIVE',
        name: 'Kolkata Outskirts Camp',
        district: 'Kolkata',
        state: 'West Bengal',
        lat: 22.5726,
        lng: 88.3639,
        safetyScore: 90,
        availableCapacityPeople: 5000,
        distanceKm: 75.0,
        infrastructureGrade: 'Excellent',
        accessibilityLevel: 'High',
        keyStrengths: [
          'Superior medical facilities',
          'Excellent road and rail links'
        ],
        shelterCount: 10,
        medicalCentersCount: 5,
        elevationMeters: 9
      },
      {
        id: 'sh-w2',
        rank: 3,
        matchType: 'BACKUP LOCATION',
        name: 'Canning Inland Shelter',
        district: 'South 24 Parganas',
        state: 'West Bengal',
        lat: 22.3117,
        lng: 88.6534,
        safetyScore: 82,
        availableCapacityPeople: 2000,
        distanceKm: 30.0,
        infrastructureGrade: 'Moderate',
        accessibilityLevel: 'Medium',
        keyStrengths: [
          'Close proximity for rapid evacuation',
          'Local community support'
        ],
        shelterCount: 2,
        medicalCentersCount: 1,
        elevationMeters: 5
      }
    ],
    aiAnalysisSummary: 'Safe Haven Theta at Diamond Harbour offers an optimal balance of proximity (40 km) and enhanced safety against storm surges for the 2,850 relocatees from Sunderbans Outpost, with specialized water purification infrastructure available.',
    comparisonMetrics: [
      {
        locationName: 'Safe Haven Theta',
        safetyScore: 85,
        capacityScore: 88,
        distanceKm: 40.0,
        infrastructureScore: 80,
        accessibilityScore: 75
      },
      {
        locationName: 'Kolkata Outskirts Camp',
        safetyScore: 90,
        capacityScore: 95,
        distanceKm: 75.0,
        infrastructureScore: 95,
        accessibilityScore: 90
      },
      {
        locationName: 'Canning Inland Shelter',
        safetyScore: 82,
        capacityScore: 70,
        distanceKm: 30.0,
        infrastructureScore: 75,
        accessibilityScore: 80
      }
    ],
    generatedAt: '1 hour ago'
  }
};
