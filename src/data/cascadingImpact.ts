import { CascadeStage, CascadeEventRow, CascadeProgressionStep } from '../types/intelligence';

export const baselineCascadeStages: CascadeStage[] = [
  {
    id: 'stage-1',
    stageNumber: 1,
    title: 'Heavy Rainfall',
    metric: '92% Intensity',
    severity: 'CRITICAL',
    impactDescription: 'Precipitation exceeds 85mm/hr in the upstream catchment basin.',
    affectedPopulation: 4850,
    category: 'HAZARD'
  },
  {
    id: 'stage-2',
    stageNumber: 2,
    title: 'Flood Overflow',
    metric: '86% Probability',
    severity: 'CRITICAL',
    impactDescription: 'River bank overtopping and embankment breach in low-lying sectors.',
    affectedPopulation: 3500,
    category: 'HAZARD'
  },
  {
    id: 'stage-3',
    stageNumber: 3,
    title: 'Road Network Failure',
    metric: '2 Routes Affected',
    severity: 'HIGH',
    impactDescription: 'Main Highway Route A submerged by 0.6m water, cutting off direct corridor.',
    affectedPopulation: 1850,
    category: 'INFRASTRUCTURE'
  },
  {
    id: 'stage-4',
    stageNumber: 4,
    title: 'Evacuation Delay',
    metric: '+18 Minutes',
    severity: 'HIGH',
    impactDescription: 'Displaced convoys diverted to circuitous bypass, causing severe bottlenecks.',
    affectedPopulation: 2400,
    category: 'SERVICE'
  },
  {
    id: 'stage-5',
    stageNumber: 5,
    title: 'Shelter Overload',
    metric: '740 Extra People',
    severity: 'CRITICAL',
    impactDescription: 'Central shelter exceeds rated occupancy by 24%, straining sanitation and supplies.',
    affectedPopulation: 740,
    category: 'SERVICE'
  },
  {
    id: 'stage-6',
    stageNumber: 6,
    title: 'Compounded Population Risk',
    metric: '+23% Net Risk',
    severity: 'CRITICAL',
    impactDescription: 'Prolonged exposure of vulnerable groups to floodwaters and lack of triage.',
    affectedPopulation: 4240,
    category: 'HUMAN_RISK'
  }
];

export const mockCascadeEventTable: CascadeEventRow[] = [
  {
    id: 'ev-1',
    event: 'Heavy Rainfall',
    trigger: 'Monsoon Depressive Vortex (Primary Hazard)',
    impact: 'Rapid catchment saturation & extreme runoff',
    affectedPopulation: 4850,
    severity: 'CRITICAL',
    estimatedDelay: '—'
  },
  {
    id: 'ev-2',
    event: 'Flood',
    trigger: 'Heavy rainfall overflow',
    impact: '2 arterial roads affected, 3 low habitations inundated',
    affectedPopulation: 3500,
    severity: 'CRITICAL',
    estimatedDelay: '—'
  },
  {
    id: 'ev-3',
    event: 'Road Failure',
    trigger: 'River bank flood surge',
    impact: 'Primary Highway Route A impassable to standard vehicles',
    affectedPopulation: 1850,
    severity: 'HIGH',
    estimatedDelay: '+18 min'
  },
  {
    id: 'ev-4',
    event: 'Evacuation Delay',
    trigger: 'Road network failure',
    impact: 'Secondary bypass congestion; shelter intake bottleneck',
    affectedPopulation: 2400,
    severity: 'HIGH',
    estimatedDelay: '+18 min'
  },
  {
    id: 'ev-5',
    event: 'Shelter Overload',
    trigger: 'Diverted evacuation influx',
    impact: '740 displaced persons exceeding capacity threshold',
    affectedPopulation: 740,
    severity: 'CRITICAL',
    estimatedDelay: '+35 min triage'
  }
];

export const baselineProgressionData: CascadeProgressionStep[] = [
  { step: 'Initial Risk', riskScore: 62, label: 'Baseline Exposure' },
  { step: 'After Flood', riskScore: 71, label: 'Inundation Stage' },
  { step: 'After Road Cut', riskScore: 78, label: 'Corridor Disruption' },
  { step: 'After Transit Delay', riskScore: 84, label: 'Egress Bottleneck' },
  { step: 'Final Composite Risk', riskScore: 87, label: 'Cascade Multiplier' }
];

export interface CascadeSimulationConfig {
  rainIntensity: 'NORMAL' | 'HEAVY' | 'EXTREME';
  roadStatus: 'ALL_OPEN' | 'ONE_BLOCKED' | 'ALL_BLOCKED';
  shelterCapacity: 'NORMAL' | 'REDUCED_20' | 'REDUCED_50';
  evacuationStatus: 'CLEAR' | 'CONGESTED' | 'FAILED';
}

export function simulateCascadeRun(config: CascadeSimulationConfig) {
  let cascadeRisk = 78;
  let secondaryFailures = 4;
  let populationImpacted = 4240;
  let evacuationDelayMin = 18;
  let additionalShelterDemand = 740;

  if (config.rainIntensity === 'EXTREME') {
    cascadeRisk += 8;
    populationImpacted += 600;
  } else if (config.rainIntensity === 'NORMAL') {
    cascadeRisk -= 12;
    populationImpacted -= 1100;
    evacuationDelayMin = 6;
  }

  if (config.roadStatus === 'ALL_BLOCKED') {
    cascadeRisk += 6;
    secondaryFailures += 1;
    evacuationDelayMin += 16;
  } else if (config.roadStatus === 'ALL_OPEN') {
    cascadeRisk -= 8;
    evacuationDelayMin = Math.max(0, evacuationDelayMin - 12);
  }

  if (config.shelterCapacity === 'REDUCED_50') {
    cascadeRisk += 4;
    additionalShelterDemand += 450;
  } else if (config.shelterCapacity === 'NORMAL') {
    additionalShelterDemand = Math.max(200, additionalShelterDemand - 300);
  }

  cascadeRisk = Math.min(98, Math.max(35, cascadeRisk));

  const stages: CascadeStage[] = [
    {
      id: 's-1',
      stageNumber: 1,
      title: config.rainIntensity === 'EXTREME' ? 'Torrential Cloudburst' : config.rainIntensity === 'NORMAL' ? 'Moderate Rainfall' : 'Heavy Rainfall',
      metric: config.rainIntensity === 'EXTREME' ? '98% Intensity' : config.rainIntensity === 'NORMAL' ? '65% Intensity' : '92% Intensity',
      severity: config.rainIntensity === 'EXTREME' ? 'CRITICAL' : config.rainIntensity === 'NORMAL' ? 'MODERATE' : 'CRITICAL',
      impactDescription: config.rainIntensity === 'EXTREME' ? 'Catastrophic cloudburst over upper catchment with torrential runoff.' : 'Catchment saturation and localized water accumulation.',
      affectedPopulation: config.rainIntensity === 'EXTREME' ? 5200 : 3800,
      category: 'HAZARD'
    },
    {
      id: 's-2',
      stageNumber: 2,
      title: 'Flood Inundation',
      metric: `${Math.round(cascadeRisk * 0.95)}% Probability`,
      severity: cascadeRisk > 75 ? 'CRITICAL' : 'HIGH',
      impactDescription: 'Flood surge breaks secondary bunds, inundating peripheral fields.',
      affectedPopulation: Math.round(populationImpacted * 0.8),
      category: 'HAZARD'
    },
    {
      id: 's-3',
      stageNumber: 3,
      title: 'Road Network Integrity',
      metric: config.roadStatus === 'ALL_BLOCKED' ? 'All 3 Routes Cut' : config.roadStatus === 'ALL_OPEN' ? 'Routes Traversable' : '2 Routes Cut',
      severity: config.roadStatus === 'ALL_BLOCKED' ? 'CRITICAL' : config.roadStatus === 'ALL_OPEN' ? 'LOW' : 'HIGH',
      impactDescription: config.roadStatus === 'ALL_BLOCKED' ? 'Complete surface disconnection. All land routes inaccessible.' : 'Arterial bridge closed; traffic rerouted to bypass.',
      affectedPopulation: config.roadStatus === 'ALL_BLOCKED' ? 3200 : 1850,
      category: 'INFRASTRUCTURE'
    },
    {
      id: 's-4',
      stageNumber: 4,
      title: 'Evacuation Transit Delay',
      metric: `+${evacuationDelayMin} Minutes`,
      severity: evacuationDelayMin > 20 ? 'CRITICAL' : evacuationDelayMin > 10 ? 'HIGH' : 'MODERATE',
      impactDescription: `Detour delays first responders and civilian vehicles by ${evacuationDelayMin} minutes.`,
      affectedPopulation: Math.round(populationImpacted * 0.6),
      category: 'SERVICE'
    },
    {
      id: 's-5',
      stageNumber: 5,
      title: 'Relief Shelter Saturation',
      metric: `${additionalShelterDemand} Extra Demand`,
      severity: additionalShelterDemand > 800 ? 'CRITICAL' : 'HIGH',
      impactDescription: `Displaced families crowd staging centers; bed and food rations deficit of ${additionalShelterDemand} units.`,
      affectedPopulation: additionalShelterDemand,
      category: 'SERVICE'
    },
    {
      id: 's-6',
      stageNumber: 6,
      title: 'Compounded Disaster Risk',
      metric: `${cascadeRisk} / 100 Risk`,
      severity: cascadeRisk >= 85 ? 'CRITICAL' : 'HIGH',
      impactDescription: 'Multi-stage failure escalates overall mortality and economic vulnerability.',
      affectedPopulation: populationImpacted,
      category: 'HUMAN_RISK'
    }
  ];

  const progression: CascadeProgressionStep[] = [
    { step: 'Initial Risk', riskScore: Math.round(cascadeRisk * 0.72), label: 'Base Vulnerability' },
    { step: 'After Flood', riskScore: Math.round(cascadeRisk * 0.82), label: 'Flood Impact' },
    { step: 'After Road Cut', riskScore: Math.round(cascadeRisk * 0.90), label: 'Infrastructure Breach' },
    { step: 'After Transit Delay', riskScore: Math.round(cascadeRisk * 0.96), label: 'Service Bottleneck' },
    { step: 'Final Cascade Risk', riskScore: cascadeRisk, label: 'Cumulative Multiplier' }
  ];

  return {
    cascadeRisk,
    secondaryFailures,
    populationImpacted,
    evacuationDelayMin,
    additionalShelterDemand,
    stages,
    progression
  };
}
