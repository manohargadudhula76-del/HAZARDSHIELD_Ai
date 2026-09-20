import { SafeHavenLocation } from '../types/relocation';

export const mockSafeHavens: SafeHavenLocation[] = [
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
  },
  {
    id: 'sh-delta',
    rank: 4,
    matchType: 'BEST MATCH',
    name: 'Safe Haven Delta (Sivasagar Hilltop)',
    district: 'Sivasagar',
    state: 'Assam',
    lat: 26.9825,
    lng: 94.6318,
    safetyScore: 92,
    availableCapacityPeople: 6000,
    distanceKm: 45.0,
    infrastructureGrade: 'Excellent',
    accessibilityLevel: 'High',
    keyStrengths: [
      'Secure elevation',
      'Large open grounds for temporary camps',
      'Proximity to supply depots'
    ],
    shelterCount: 5,
    medicalCentersCount: 2,
    elevationMeters: 110
  },
  {
    id: 'sh-epsilon',
    rank: 5,
    matchType: 'ALTERNATIVE',
    name: 'Safe Haven Epsilon (Kozhikode Coastal Relief)',
    district: 'Kozhikode',
    state: 'Kerala',
    lat: 11.2588,
    lng: 75.7804,
    safetyScore: 88,
    availableCapacityPeople: 4500,
    distanceKm: 30.0,
    infrastructureGrade: 'Good',
    accessibilityLevel: 'High',
    keyStrengths: [
      'Sturdy concrete relief structures',
      'Rapid coastal supply access'
    ],
    shelterCount: 4,
    medicalCentersCount: 1,
    elevationMeters: 15
  },
  {
    id: 'sh-zeta',
    rank: 6,
    matchType: 'BEST MATCH',
    name: 'Safe Haven Zeta (Bhubaneswar SDRF Camp)',
    district: 'Khurda',
    state: 'Odisha',
    lat: 20.2961,
    lng: 85.8245,
    safetyScore: 95,
    availableCapacityPeople: 7500,
    distanceKm: 60.0,
    infrastructureGrade: 'Excellent',
    accessibilityLevel: 'High',
    keyStrengths: [
      'Dedicated SDRF operational base',
      'Advanced medical facilities nearby',
      'Cyclone-proof buildings'
    ],
    shelterCount: 8,
    medicalCentersCount: 4,
    elevationMeters: 45
  },
  {
    id: 'sh-eta',
    rank: 7,
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
    id: 'sh-theta',
    rank: 8,
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
  }
];
