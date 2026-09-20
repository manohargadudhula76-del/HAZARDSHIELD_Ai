import { ExplainableRiskHabitation } from '../types/intelligence';

export const mockExplainableRiskData: Record<string, ExplainableRiskHabitation> = {
  'hab-001': {
    habitationId: 'hab-001',
    name: 'Rampur Village',
    district: 'Darrang',
    state: 'Assam',
    overallRisk: 87,
    riskLevel: 'CRITICAL',
    primaryRiskDriver: 'Flood Exposure',
    secondaryRiskDriver: 'Infrastructure Vulnerability',
    summaryExplanation:
      'Rampur Village has a critical risk score primarily due to high flood exposure, extreme rainfall, dense population concentration and limited evacuation accessibility.',
    contributors: [
      {
        name: 'Flood Severity',
        percentage: 30,
        color: '#EF4444',
        description: 'Brahmaputra tributary backflow and floodplain overflow'
      },
      {
        name: 'Population Exposure',
        percentage: 22,
        color: '#F97316',
        description: 'Dense settlement of 4,850 people within a 12.4 sq km low-lying zone'
      },
      {
        name: 'Infrastructure Risk',
        percentage: 18,
        color: '#F59E0B',
        description: 'Substandard embankments, weak culverts, and unpaved secondary access roads'
      },
      {
        name: 'Vulnerability',
        percentage: 15,
        color: '#8B5CF6',
        description: 'High demographic vulnerability with 1,358 children and 679 elderly residents'
      },
      {
        name: 'Evacuation Risk',
        percentage: 10,
        color: '#06B6D4',
        description: 'Only one primary arterial road crossing low-lying river bridge'
      },
      {
        name: 'Disaster History',
        percentage: 5,
        color: '#64748B',
        description: '14 historical major inundations over the past 25 years'
      }
    ],
    explanationFactors: [
      {
        id: 'f1',
        iconName: 'Waves',
        factor: 'High Flood Exposure',
        severity: 'CRITICAL',
        explanation: 'Located just 0.8 km from the perennial river channel, directly in the 10-year flood zone.'
      },
      {
        id: 'f2',
        iconName: 'Users',
        factor: 'High Population Concentration',
        severity: 'CRITICAL',
        explanation: '4,850 individuals living in tightly clustered kutcha structures with limited flood barriers.'
      },
      {
        id: 'f3',
        iconName: 'NavigationOff',
        factor: 'Poor Evacuation Accessibility',
        severity: 'HIGH',
        explanation: 'Single main arterial connection prone to rapid subversion under >50mm/hr rainfall.'
      },
      {
        id: 'f4',
        iconName: 'History',
        factor: 'Previous Flood Incidents',
        severity: 'HIGH',
        explanation: 'Submerged in 2019, 2021, and 2023 monsoons with prolonged relief dependency.'
      },
      {
        id: 'f5',
        iconName: 'Building2',
        factor: 'Limited Emergency Infrastructure',
        severity: 'HIGH',
        explanation: 'Sub-district civil hospital is 6.2 km away, with no elevated multi-purpose shelter in village core.'
      }
    ],
    hazardProfile: [
      { hazard: 'Flood Risk', score: 82, level: 'HIGH', trend: '+4% vs last season' },
      { hazard: 'Landslide Risk', score: 34, level: 'MODERATE', trend: 'Stable' },
      { hazard: 'Cyclone Risk', score: 15, level: 'LOW', trend: 'Low baseline' },
      { hazard: 'Extreme Rainfall', score: 91, level: 'CRITICAL', trend: '+12% peak monsoon' },
      { hazard: 'Infrastructure Risk', score: 76, level: 'HIGH', trend: 'Aging culverts' },
      { hazard: 'Historical Risk', score: 68, level: 'HIGH', trend: 'Recurrent cycles' }
    ],
    formulaWeights: [
      { factor: 'Flood Severity', rawScore: 89, weight: 0.30, weightedScore: 26.7 },
      { factor: 'Population Exposure', rawScore: 88, weight: 0.22, weightedScore: 19.4 },
      { factor: 'Infrastructure Risk', rawScore: 78, weight: 0.18, weightedScore: 14.0 },
      { factor: 'Vulnerability Index', rawScore: 86, weight: 0.15, weightedScore: 12.9 },
      { factor: 'Evacuation Bottleneck', rawScore: 90, weight: 0.10, weightedScore: 9.0 },
      { factor: 'Historical Disaster Freq', rawScore: 74, weight: 0.05, weightedScore: 3.7 }
    ]
  },
  'hab-002': {
    habitationId: 'hab-002',
    name: 'Devipur',
    district: 'Rudraprayag',
    state: 'Uttarakhand',
    overallRisk: 84,
    riskLevel: 'CRITICAL',
    primaryRiskDriver: 'Slope Instability & Landslides',
    secondaryRiskDriver: 'Road Cutoff Vulnerability',
    summaryExplanation:
      'Devipur faces critical composite risk driven primarily by steep geological slope shear stress, recurrent debris flows, and isolated Himalayan valley access.',
    contributors: [
      { name: 'Slope Instability', percentage: 32, color: '#EF4444', description: 'Active scree slopes and sheared bedrock above settlement' },
      { name: 'Extreme Rainfall', percentage: 24, color: '#F97316', description: 'Cloudburst vulnerability in high-altitude catchment' },
      { name: 'Evacuation Isolation', percentage: 20, color: '#F59E0B', description: 'Single mountain corridor with 3 historical landslide choke points' },
      { name: 'Population Exposure', percentage: 12, color: '#8B5CF6', description: '2,980 residents situated on terraced alluvial fan' },
      { name: 'Infrastructure Fragility', percentage: 8, color: '#06B6D4', description: 'Unreinforced retaining walls along Alaknanda gorge' },
      { name: 'Seismic History', percentage: 4, color: '#64748B', description: 'Zone V seismic susceptibility' }
    ],
    explanationFactors: [
      {
        id: 'f1',
        iconName: 'Mountain',
        factor: 'Steep Landslide Hazard',
        severity: 'CRITICAL',
        explanation: 'Located on 38-degree slope with fractured metamorphic shale and active subsidence.'
      },
      {
        id: 'f2',
        iconName: 'CloudRain',
        factor: 'Flash Flood Catchment',
        severity: 'CRITICAL',
        explanation: 'Upstream micro-catchment subject to sudden high-intensity cloudburst runoff.'
      },
      {
        id: 'f3',
        iconName: 'NavigationOff',
        factor: 'Single Evacuation Corridor',
        severity: 'HIGH',
        explanation: 'NH-107 link can be blocked by rockfalls within 20 minutes of severe precipitation.'
      },
      {
        id: 'f4',
        iconName: 'Activity',
        factor: 'High Seismic Amplification',
        severity: 'HIGH',
        explanation: 'Located in Himalayan Seismic Zone V with high amplification on loose debris.'
      }
    ],
    hazardProfile: [
      { hazard: 'Landslide Risk', score: 94, level: 'CRITICAL', trend: '+8% post-monsoon' },
      { hazard: 'Flash Flood Risk', score: 85, level: 'CRITICAL', trend: '+14% cloudburst index' },
      { hazard: 'Earthquake Risk', score: 78, level: 'HIGH', trend: 'Zone V' },
      { hazard: 'Infrastructure Risk', score: 72, level: 'HIGH', trend: 'Retaining wall creep' },
      { hazard: 'Extreme Rainfall', score: 88, level: 'CRITICAL', trend: 'Intense spells' },
      { hazard: 'Historical Risk', score: 80, level: 'HIGH', trend: '2013 & 2021 precedents' }
    ],
    formulaWeights: [
      { factor: 'Slope Instability', rawScore: 94, weight: 0.32, weightedScore: 30.1 },
      { factor: 'Extreme Rainfall', rawScore: 88, weight: 0.24, weightedScore: 21.1 },
      { factor: 'Evacuation Isolation', rawScore: 90, weight: 0.20, weightedScore: 18.0 },
      { factor: 'Population Exposure', rawScore: 70, weight: 0.12, weightedScore: 8.4 },
      { factor: 'Infrastructure Fragility', rawScore: 72, weight: 0.08, weightedScore: 5.8 },
      { factor: 'Seismic History', rawScore: 78, weight: 0.04, weightedScore: 3.1 }
    ]
  },
  'hab-003': {
    habitationId: 'hab-003',
    name: 'Majuli North Island Ward',
    district: 'Majuli',
    state: 'Assam',
    overallRisk: 81,
    riskLevel: 'CRITICAL',
    primaryRiskDriver: 'Riverine Erosion',
    secondaryRiskDriver: 'Island Water Isolation',
    summaryExplanation:
      'Majuli North Island faces severe risk due to ongoing riverbed erosion, seasonal island cutoff, and ferry dependency for medical evacuations.',
    contributors: [
      { name: 'River Erosion', percentage: 35, color: '#EF4444', description: 'Rapid riverbank loss along the northern Brahmaputra arm' },
      { name: 'Waterway Isolation', percentage: 25, color: '#F97316', description: 'No fixed bridge connection to mainland hospital hubs' },
      { name: 'Flood Inundation', percentage: 20, color: '#F59E0B', description: '80% of ward land below seasonal high flood level' },
      { name: 'Vulnerable Housing', percentage: 12, color: '#8B5CF6', description: 'Traditional bamboo chang-ghar prone to high velocity currents' },
      { name: 'Health Facility Delay', percentage: 8, color: '#06B6D4', description: 'Ferry crossing requires 45+ minutes in clear weather' }
    ],
    explanationFactors: [
      {
        id: 'f1',
        iconName: 'Waves',
        factor: 'Bank Erosion Rate',
        severity: 'CRITICAL',
        explanation: 'Erosion rate exceeds 15 meters per flood cycle, threatening 420 households.'
      },
      {
        id: 'f2',
        iconName: 'Ship',
        factor: 'Ferry Suspension in Storms',
        severity: 'CRITICAL',
        explanation: 'All river transit ceases when wind speed exceeds 35 km/h or river surges.'
      },
      {
        id: 'f3',
        iconName: 'AlertTriangle',
        factor: 'Limited Drinking Water',
        severity: 'HIGH',
        explanation: 'Tube wells frequently salinated or contaminated by silt during peak surge.'
      }
    ],
    hazardProfile: [
      { hazard: 'River Erosion', score: 93, level: 'CRITICAL', trend: '+15m/yr loss' },
      { hazard: 'Flood Risk', score: 86, level: 'CRITICAL', trend: 'Annual inundation' },
      { hazard: 'Isolation Risk', score: 89, level: 'CRITICAL', trend: 'No land bridge' },
      { hazard: 'Extreme Rainfall', score: 79, level: 'HIGH', trend: 'Monsoon surges' },
      { hazard: 'Infrastructure Risk', score: 65, level: 'MODERATE', trend: 'Temporary dykes' },
      { hazard: 'Historical Risk', score: 75, level: 'HIGH', trend: 'Continuous' }
    ],
    formulaWeights: [
      { factor: 'River Erosion', rawScore: 93, weight: 0.35, weightedScore: 32.5 },
      { factor: 'Waterway Isolation', rawScore: 89, weight: 0.25, weightedScore: 22.3 },
      { factor: 'Flood Inundation', rawScore: 86, weight: 0.20, weightedScore: 17.2 },
      { factor: 'Vulnerable Housing', rawScore: 72, weight: 0.12, weightedScore: 8.6 },
      { factor: 'Health Facility Delay', rawScore: 82, weight: 0.08, weightedScore: 6.6 }
    ]
  }
};
