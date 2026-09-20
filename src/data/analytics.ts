import { AnalyticsSummary, MonthlyTrendItem } from '../types/analytics';

export const mockAnalyticsSummary: AnalyticsSummary = {
  totalHabitationsAssessed: 249,
  highRiskAreas: 66,
  totalPopulationExposed: 18450,
  relocationRequired: 6780,
  riskDistribution: [
    { name: 'Critical Red Zone', count: 24, color: '#EF4444' },
    { name: 'High Risk', count: 42, color: '#F97316' },
    { name: 'Moderate Risk', count: 68, color: '#F59E0B' },
    { name: 'Safe / Low Risk', count: 115, color: '#10B981' }
  ],
  districtVulnerability: [
    { district: 'Darrang', state: 'Assam', populationAtRisk: 4850, criticalZonesCount: 4 },
    { district: 'South 24 Parganas', state: 'West Bengal', populationAtRisk: 4120, criticalZonesCount: 5 },
    { district: 'Rudraprayag', state: 'Uttarakhand', populationAtRisk: 2980, criticalZonesCount: 3 },
    { district: 'Krishna', state: 'Andhra Pradesh', populationAtRisk: 2600, criticalZonesCount: 2 },
    { district: 'Idukki', state: 'Kerala', populationAtRisk: 2100, criticalZonesCount: 3 },
    { district: 'Ganjam', state: 'Odisha', populationAtRisk: 1800, criticalZonesCount: 2 },
    { district: 'Kinnaur', state: 'Himachal Pradesh', populationAtRisk: 0, criticalZonesCount: 0 }
  ],
  hazardDistribution: [
    { hazardType: 'Flood', count: 52, percentage: 38 },
    { hazardType: 'Landslide', count: 34, percentage: 25 },
    { hazardType: 'Cyclone', count: 26, percentage: 19 },
    { hazardType: 'Coastal Erosion', count: 15, percentage: 11 },
    { hazardType: 'Earthquake', count: 10, percentage: 7 }
  ],
  capacityStatus: [
    { status: 'Exceeded (>100%)', count: 12, percentage: 40, color: '#EF4444' },
    { status: 'Near Limit (85-100%)', count: 11, percentage: 37, color: '#F59E0B' },
    { status: 'Safe (<85%)', count: 7, percentage: 23, color: '#10B981' }
  ],
  relocationPriority: [
    { level: 'Immediate (Critical)', peopleCount: 6780, habitationsCount: 3, color: '#EF4444' },
    { level: 'High Priority', peopleCount: 4200, habitationsCount: 5, color: '#F97316' },
    { level: 'Moderate Priority', peopleCount: 2100, habitationsCount: 6, color: '#F59E0B' }
  ],
  monthlyTrends: [
    { month: 'Oct', criticalZones: 18, highRisk: 35, moderateRisk: 55, populationAtRisk: 12500 },
    { month: 'Nov', criticalZones: 19, highRisk: 36, moderateRisk: 56, populationAtRisk: 13000 },
    { month: 'Dec', criticalZones: 18, highRisk: 37, moderateRisk: 58, populationAtRisk: 12800 },
    { month: 'Jan', criticalZones: 20, highRisk: 35, moderateRisk: 60, populationAtRisk: 13200 },
    { month: 'Feb', criticalZones: 19, highRisk: 38, moderateRisk: 59, populationAtRisk: 13100 },
    { month: 'Mar', criticalZones: 21, highRisk: 40, moderateRisk: 62, populationAtRisk: 14500 },
    { month: 'Apr', criticalZones: 22, highRisk: 42, moderateRisk: 64, populationAtRisk: 15200 },
    { month: 'May', criticalZones: 24, highRisk: 44, moderateRisk: 67, populationAtRisk: 17000 },
    { month: 'Jun', criticalZones: 28, highRisk: 48, moderateRisk: 72, populationAtRisk: 21000 },
    { month: 'Jul', criticalZones: 27, highRisk: 47, moderateRisk: 70, populationAtRisk: 20500 },
    { month: 'Aug', criticalZones: 26, highRisk: 46, moderateRisk: 69, populationAtRisk: 19800 },
    { month: 'Sep', criticalZones: 24, highRisk: 42, moderateRisk: 68, populationAtRisk: 18450 }
  ],
  aiExecutiveSummary: `EXECUTIVE AI DISASTER INTELLIGENCE BRIEFING (NATIONAL SYNTHESIS)

1. RISK CLUSTER PATTERNS:
- Critical vulnerability is heavily concentrated along eastern riverine floodplains (Assam Brahmaputra basin, West Bengal Sunderbans estuarine delta) and northern active geological thrust zones (Uttarakhand Rudraprayag).

2. CARRYING CAPACITY STRESS:
- 12 habitations are operating significantly beyond safe resource limits (>100% carrying capacity). Emergency medical services and flood shelters in these habitations present severe bottleneck vulnerabilities.

3. IMMEDIATE ACTION REQUIRED:
- Priority 1 immediate relocation is recommended for 6,780 individuals across 3 critical red zone habitations (Rampur Village, Devipur, and Sunderbans Outpost).
- Safe Haven Alpha (Mangaldai) and inland hill reserves have been identified with 94%+ safety scores and sufficient shelter margin to absorb displaced populations.`
};
