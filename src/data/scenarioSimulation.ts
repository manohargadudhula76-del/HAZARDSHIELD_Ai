import { ScenarioInputs, ScenarioResultMetrics, ScenarioImpactBreakdownItem } from '../types/intelligence';

export const BASELINE_SCENARIO: {
  habitationName: string;
  district: string;
  state: string;
  inputs: ScenarioInputs;
  metrics: ScenarioResultMetrics;
} = {
  habitationName: 'Rampur Village',
  district: 'Darrang',
  state: 'Assam',
  inputs: {
    rainfallChange: 0,
    populationChange: 0,
    mainRoadClosed: false,
    hospitalAvailable: true,
    shelterCapacityChange: 0
  },
  metrics: {
    riskScore: 72,
    riskLevel: 'HIGH',
    populationAtRisk: 4200,
    evacuationAccess: 'GOOD',
    shelterCapacityStatus: 'SUFFICIENT'
  }
};

export function calculateScenarioSimulation(inputs: ScenarioInputs): {
  metrics: ScenarioResultMetrics;
  breakdown: ScenarioImpactBreakdownItem[];
  riskDelta: number;
  percentageChange: number;
  explanation: string;
} {
  const baseRisk = 72;
  const basePop = 4200;

  // 1. Rainfall impact: -30% to +50% -> roughly -6 to +12 risk pts
  const rainDelta = Math.round((inputs.rainfallChange / 50) * 12);

  // 2. Population impact: -10% to +30% -> roughly -2 to +6 risk pts
  const popRiskDelta = Math.round((inputs.populationChange / 30) * 6);

  // 3. Road closure impact: +8 risk pts if closed
  const roadDelta = inputs.mainRoadClosed ? 8 : 0;

  // 4. Hospital unavailable impact: +3 risk pts if unavailable
  const hospitalDelta = !inputs.hospitalAvailable ? 3 : 0;

  // 5. Shelter capacity change impact: -50% to +20% -> lower capacity = higher risk (+6 to -2)
  const shelterDelta = Math.round((-inputs.shelterCapacityChange / 50) * 5);

  const breakdown: ScenarioImpactBreakdownItem[] = [
    {
      driver: 'Rainfall Variation',
      delta: rainDelta,
      description: inputs.rainfallChange >= 0
        ? `+${inputs.rainfallChange}% precipitation increases surface runoff & river water stage`
        : `${inputs.rainfallChange}% reduced precipitation lowers hydrological stress`
    },
    {
      driver: 'Main Evacuation Road',
      delta: roadDelta,
      description: inputs.mainRoadClosed
        ? 'Closure of arterial NH connector blocks primary egress, forcing detour'
        : 'Primary evacuation route remains completely unobstructed'
    },
    {
      driver: 'Population Exposure Change',
      delta: popRiskDelta,
      description: inputs.populationChange >= 0
        ? `+${inputs.populationChange}% population density adds strain on rapid transit and shelters`
        : `${inputs.populationChange}% lower density facilitates faster orderly dispersal`
    },
    {
      driver: 'Hospital Service Status',
      delta: hospitalDelta,
      description: !inputs.hospitalAvailable
        ? 'Mangaldai Civil Hospital cut off or overloaded, delaying emergency medical triage'
        : 'District healthcare facilities operating at normal reception readiness'
    },
    {
      driver: 'Shelter Capacity Change',
      delta: shelterDelta,
      description: inputs.shelterCapacityChange < 0
        ? `${inputs.shelterCapacityChange}% reduction in emergency shelter beds risks overcrowding`
        : `+${inputs.shelterCapacityChange}% expanded shelter cushion improves humanitarian buffer`
    }
  ];

  // Calculate final score bounded between 10 and 99
  const netDelta = rainDelta + roadDelta + popRiskDelta + hospitalDelta + shelterDelta;
  const simulatedRisk = Math.min(99, Math.max(15, baseRisk + netDelta));
  const riskDelta = simulatedRisk - baseRisk;
  const percentageChange = Number(((riskDelta / baseRisk) * 100).toFixed(1));

  // Determine risk level
  let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'HIGH';
  if (simulatedRisk >= 85) riskLevel = 'CRITICAL';
  else if (simulatedRisk >= 70) riskLevel = 'HIGH';
  else if (simulatedRisk >= 50) riskLevel = 'MODERATE';
  else riskLevel = 'LOW';

  // Calculate simulated population at risk
  const popFactor = 1 + (inputs.populationChange / 100);
  const rainPopFactor = inputs.rainfallChange > 0 ? (inputs.rainfallChange / 100) * 0.25 : 0;
  const roadPopFactor = inputs.mainRoadClosed ? 0.15 : 0;
  const simulatedPop = Math.round(basePop * (popFactor + rainPopFactor + roadPopFactor));

  // Determine evacuation access
  let evacuationAccess: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL FAILURE' = 'GOOD';
  if (inputs.mainRoadClosed && inputs.rainfallChange >= 30) evacuationAccess = 'CRITICAL FAILURE';
  else if (inputs.mainRoadClosed || inputs.rainfallChange >= 35) evacuationAccess = 'POOR';
  else if (inputs.rainfallChange >= 15 || inputs.populationChange >= 20) evacuationAccess = 'MODERATE';
  else if (inputs.rainfallChange <= -15) evacuationAccess = 'EXCELLENT';
  else evacuationAccess = 'GOOD';

  // Determine shelter capacity status
  let shelterStatus: 'SURPLUS' | 'SUFFICIENT' | 'STRAINED' | 'INSUFFICIENT' | 'CRITICAL DEFICIT' = 'SUFFICIENT';
  const shelterStress = inputs.shelterCapacityChange - (inputs.populationChange * 0.8) - (inputs.rainfallChange * 0.5);
  if (shelterStress <= -40) shelterStatus = 'CRITICAL DEFICIT';
  else if (shelterStress <= -20) shelterStatus = 'INSUFFICIENT';
  else if (shelterStress < 0) shelterStatus = 'STRAINED';
  else if (shelterStress > 15) shelterStatus = 'SURPLUS';
  else shelterStatus = 'SUFFICIENT';

  // Generate dynamic explanation
  const reasons: string[] = [];
  if (inputs.rainfallChange > 0) reasons.push(`rainfall increased by ${inputs.rainfallChange}%`);
  else if (inputs.rainfallChange < 0) reasons.push(`rainfall decreased by ${Math.abs(inputs.rainfallChange)}%`);

  if (inputs.mainRoadClosed) reasons.push('the main evacuation road was closed');
  if (!inputs.hospitalAvailable) reasons.push('the primary district hospital became inaccessible');
  if (inputs.populationChange > 0) reasons.push(`population density increased by ${inputs.populationChange}%`);
  if (inputs.shelterCapacityChange < 0) reasons.push(`shelter capacity decreased by ${Math.abs(inputs.shelterCapacityChange)}%`);
  else if (inputs.shelterCapacityChange > 0) reasons.push(`shelter capacity was augmented by ${inputs.shelterCapacityChange}%`);

  let explanation = '';
  if (reasons.length === 0) {
    explanation = 'Baseline conditions maintained with no simulated hazard or infrastructure alterations applied.';
  } else if (riskDelta > 0) {
    const formattedReasons = reasons.length === 1 ? reasons[0] : `${reasons.slice(0, -1).join(', ')}, and ${reasons[reasons.length - 1]}`;
    explanation = `Risk increased by ${riskDelta} points (+${percentageChange}%) primarily because ${formattedReasons}.`;
  } else if (riskDelta < 0) {
    const formattedReasons = reasons.length === 1 ? reasons[0] : `${reasons.slice(0, -1).join(', ')}, and ${reasons[reasons.length - 1]}`;
    explanation = `Risk decreased by ${Math.abs(riskDelta)} points (${percentageChange}%) because ${formattedReasons}, creating a protective stabilization buffer.`;
  } else {
    explanation = 'Counterbalancing factors resulted in no net change to composite risk score.';
  }

  return {
    metrics: {
      riskScore: simulatedRisk,
      riskLevel,
      populationAtRisk: simulatedPop,
      evacuationAccess,
      shelterCapacityStatus: shelterStatus
    },
    breakdown,
    riskDelta,
    percentageChange,
    explanation
  };
}
