import { HabitationCarryingCapacity } from '../types/carryingCapacity';

export const mockCarryingCapacityData: Record<string, HabitationCarryingCapacity> = {
  'hab-001': {
    habitationId: 'hab-001',
    habitationName: 'Rampur Village',
    district: 'Darrang',
    state: 'Assam',
    overallCapacityPercentage: 142,
    overallStatus: 'CRITICAL CAPACITY DEFICIT',
    totalPopulation: 4850,
    safePopulationThreshold: 3400,
    resourceMetrics: [
      {
        id: 'res-pop',
        name: 'Population Density',
        category: 'Population',
        currentDemand: 4850,
        availableCapacity: 3400,
        unit: 'Residents',
        utilizationPercentage: 142,
        status: 'EXCEEDED',
        notes: 'Exceeds environmental threshold by 1,450 residents.'
      },
      {
        id: 'res-house',
        name: 'Housing & Shelter',
        category: 'Housing',
        currentDemand: 1100,
        availableCapacity: 750,
        unit: 'Units',
        utilizationPercentage: 146,
        status: 'EXCEEDED',
        notes: 'Severe congestion in semi-permanent structures.'
      },
      {
        id: 'res-water',
        name: 'Safe Drinking Water',
        category: 'Water',
        currentDemand: 380,
        availableCapacity: 250,
        unit: 'kL/day',
        utilizationPercentage: 152,
        status: 'EXCEEDED',
        notes: 'Contaminated shallow tube wells during flood surge.'
      },
      {
        id: 'res-health',
        name: 'Healthcare Facility Access',
        category: 'Healthcare',
        currentDemand: 4850,
        availableCapacity: 2000,
        unit: 'Patients/Center',
        utilizationPercentage: 242,
        status: 'EXCEEDED',
        notes: 'Primary health sub-center flooded; nearest hospital 18 km away.'
      },
      {
        id: 'res-shelter',
        name: 'Cyclonic / Flood Shelters',
        category: 'Shelter',
        currentDemand: 4850,
        availableCapacity: 1200,
        unit: 'Capacities',
        utilizationPercentage: 404,
        status: 'EXCEEDED',
        notes: 'Critical shortage of high-elevation multipurpose community shelters.'
      },
      {
        id: 'res-evac',
        name: 'Evacuation Route Access',
        category: 'Evacuation',
        currentDemand: 100,
        availableCapacity: 35,
        unit: 'Flow Index',
        utilizationPercentage: 118,
        status: 'NEAR LIMIT',
        notes: 'Single narrow single-lane elevated embankment road.'
      }
    ],
    aiInsight: 'The habitation is operating beyond its safe carrying capacity due to acute population pressure, limited housing availability, insufficient potable water resources during peak monsoon, and inadequate flood evacuation infrastructure.',
    lastAssessed: 'Today at 06:30 AM'
  },
  'hab-002': {
    habitationId: 'hab-002',
    habitationName: 'Devipur',
    district: 'Rudraprayag',
    state: 'Uttarakhand',
    overallCapacityPercentage: 135,
    overallStatus: 'CRITICAL CAPACITY DEFICIT',
    totalPopulation: 2980,
    safePopulationThreshold: 2200,
    resourceMetrics: [
      {
        id: 'res-pop-2',
        name: 'Population Load',
        category: 'Population',
        currentDemand: 2980,
        availableCapacity: 2200,
        unit: 'Residents',
        utilizationPercentage: 135,
        status: 'EXCEEDED',
        notes: 'Slope bearing capacity exceeded.'
      },
      {
        id: 'res-shelter-2',
        name: 'Emergency Shelters',
        category: 'Shelter',
        currentDemand: 2980,
        availableCapacity: 800,
        unit: 'Capacities',
        utilizationPercentage: 372,
        status: 'EXCEEDED',
        notes: 'No earthquake-resistant shelter building in 5 km radius.'
      }
    ],
    aiInsight: 'Geological stability assessments indicate Devipur has exceeded safe habitation load by 35%. Severe road blockade risks compound shelter deficits.',
    lastAssessed: 'Today at 05:45 AM'
  },
  'hab-003': {
    habitationId: 'hab-003',
    habitationName: 'Krishna Nagar',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    overallCapacityPercentage: 118,
    overallStatus: 'CRITICAL CAPACITY DEFICIT',
    totalPopulation: 6200,
    safePopulationThreshold: 5250,
    resourceMetrics: [
      {
        id: 'res-pop-3',
        name: 'Population Density',
        category: 'Population',
        currentDemand: 6200,
        availableCapacity: 5250,
        unit: 'Residents',
        utilizationPercentage: 118,
        status: 'EXCEEDED',
        notes: 'High density living quarters vulnerable to surge.'
      },
      {
        id: 'res-water-3',
        name: 'Potable Water',
        category: 'Water',
        currentDemand: 500,
        availableCapacity: 450,
        unit: 'kL/day',
        utilizationPercentage: 111,
        status: 'EXCEEDED',
        notes: 'Water supply lines partially inundated.'
      },
      {
        id: 'res-health-3',
        name: 'Healthcare Centers',
        category: 'Healthcare',
        currentDemand: 6200,
        availableCapacity: 4000,
        unit: 'Patients/Center',
        utilizationPercentage: 155,
        status: 'EXCEEDED',
        notes: 'Local PHC overwhelmed.'
      },
      {
        id: 'res-shelter-3',
        name: 'Cyclone Shelters',
        category: 'Shelter',
        currentDemand: 6200,
        availableCapacity: 3500,
        unit: 'Capacities',
        utilizationPercentage: 177,
        status: 'EXCEEDED',
        notes: 'Critical gap in safe shelter accommodations.'
      }
    ],
    aiInsight: 'Coastal pressure and cyclone risk have pushed carrying capacity beyond safe limits.',
    lastAssessed: 'Today at 08:00 AM'
  },
  'hab-004': {
    habitationId: 'hab-004',
    habitationName: 'Munnar Hills Settlement',
    district: 'Idukki',
    state: 'Kerala',
    overallCapacityPercentage: 112,
    overallStatus: 'CRITICAL CAPACITY DEFICIT',
    totalPopulation: 3420,
    safePopulationThreshold: 3050,
    resourceMetrics: [
      {
        id: 'res-pop-4',
        name: 'Population Load',
        category: 'Population',
        currentDemand: 3420,
        availableCapacity: 3050,
        unit: 'Residents',
        utilizationPercentage: 112,
        status: 'EXCEEDED',
        notes: 'Soil bearing capacity reached.'
      },
      {
        id: 'res-house-4',
        name: 'Safe Housing',
        category: 'Housing',
        currentDemand: 800,
        availableCapacity: 650,
        unit: 'Units',
        utilizationPercentage: 123,
        status: 'EXCEEDED',
        notes: 'Many houses on precarious slopes.'
      },
      {
        id: 'res-evac-4',
        name: 'Evacuation Routes',
        category: 'Evacuation',
        currentDemand: 100,
        availableCapacity: 80,
        unit: 'Flow Index',
        utilizationPercentage: 125,
        status: 'EXCEEDED',
        notes: 'Roads blocked by minor debris falls.'
      },
      {
        id: 'res-food-4',
        name: 'Food Supply Reserves',
        category: 'Shelter',
        currentDemand: 3420,
        availableCapacity: 3100,
        unit: 'Rations',
        utilizationPercentage: 110,
        status: 'EXCEEDED',
        notes: 'Supply chains disrupted by landslides.'
      }
    ],
    aiInsight: 'Fragile ecosystem unable to support current population density during monsoon.',
    lastAssessed: 'Today at 09:15 AM'
  },
  'hab-005': {
    habitationId: 'hab-005',
    habitationName: 'Brahmapur Coastal Belt',
    district: 'Ganjam',
    state: 'Odisha',
    overallCapacityPercentage: 105,
    overallStatus: 'NEAR SAFE LIMIT',
    totalPopulation: 5100,
    safePopulationThreshold: 4850,
    resourceMetrics: [
      {
        id: 'res-pop-5',
        name: 'Population Load',
        category: 'Population',
        currentDemand: 5100,
        availableCapacity: 4850,
        unit: 'Residents',
        utilizationPercentage: 105,
        status: 'NEAR LIMIT',
        notes: 'Slightly above threshold.'
      },
      {
        id: 'res-water-5',
        name: 'Clean Water',
        category: 'Water',
        currentDemand: 450,
        availableCapacity: 440,
        unit: 'kL/day',
        utilizationPercentage: 102,
        status: 'NEAR LIMIT',
        notes: 'Adequate but strained.'
      },
      {
        id: 'res-health-5',
        name: 'Health Centers',
        category: 'Healthcare',
        currentDemand: 5100,
        availableCapacity: 5000,
        unit: 'Patients/Center',
        utilizationPercentage: 102,
        status: 'NEAR LIMIT',
        notes: 'Managing current load.'
      },
      {
        id: 'res-shelter-5',
        name: 'Cyclone Shelters',
        category: 'Shelter',
        currentDemand: 5100,
        availableCapacity: 4500,
        unit: 'Capacities',
        utilizationPercentage: 113,
        status: 'EXCEEDED',
        notes: 'Additional shelters needed.'
      }
    ],
    aiInsight: 'Operating near safe limits, vulnerable to sudden capacity shocks.',
    lastAssessed: 'Today at 10:00 AM'
  },
  'hab-006': {
    habitationId: 'hab-006',
    habitationName: 'Kinnaur Valley Cluster',
    district: 'Kinnaur',
    state: 'Himachal Pradesh',
    overallCapacityPercentage: 94,
    overallStatus: 'NEAR SAFE LIMIT',
    totalPopulation: 1850,
    safePopulationThreshold: 1960,
    resourceMetrics: [
      {
        id: 'res-pop-6',
        name: 'Population Load',
        category: 'Population',
        currentDemand: 1850,
        availableCapacity: 1960,
        unit: 'Residents',
        utilizationPercentage: 94,
        status: 'SAFE',
        notes: 'Within limits.'
      },
      {
        id: 'res-house-6',
        name: 'Housing',
        category: 'Housing',
        currentDemand: 450,
        availableCapacity: 480,
        unit: 'Units',
        utilizationPercentage: 93,
        status: 'SAFE',
        notes: 'Stable.'
      },
      {
        id: 'res-evac-6',
        name: 'Evacuation Routes',
        category: 'Evacuation',
        currentDemand: 80,
        availableCapacity: 82,
        unit: 'Flow Index',
        utilizationPercentage: 97,
        status: 'NEAR LIMIT',
        notes: 'Road network is sparse.'
      }
    ],
    aiInsight: 'Capacity is stable but geological risks necessitate close monitoring.',
    lastAssessed: 'Today at 07:45 AM'
  },
  'hab-007': {
    habitationId: 'hab-007',
    habitationName: 'Sunderbans Outpost',
    district: 'South 24 Parganas',
    state: 'West Bengal',
    overallCapacityPercentage: 138,
    overallStatus: 'CRITICAL CAPACITY DEFICIT',
    totalPopulation: 4120,
    safePopulationThreshold: 2980,
    resourceMetrics: [
      {
        id: 'res-pop-7',
        name: 'Population Density',
        category: 'Population',
        currentDemand: 4120,
        availableCapacity: 2980,
        unit: 'Residents',
        utilizationPercentage: 138,
        status: 'EXCEEDED',
        notes: 'Overcrowded given land loss.'
      },
      {
        id: 'res-house-7',
        name: 'Safe Housing',
        category: 'Housing',
        currentDemand: 950,
        availableCapacity: 600,
        unit: 'Units',
        utilizationPercentage: 158,
        status: 'EXCEEDED',
        notes: 'Homes destroyed by coastal erosion.'
      },
      {
        id: 'res-water-7',
        name: 'Drinking Water',
        category: 'Water',
        currentDemand: 350,
        availableCapacity: 200,
        unit: 'kL/day',
        utilizationPercentage: 175,
        status: 'EXCEEDED',
        notes: 'Salinity intrusion in fresh water sources.'
      },
      {
        id: 'res-health-7',
        name: 'Healthcare',
        category: 'Healthcare',
        currentDemand: 4120,
        availableCapacity: 2500,
        unit: 'Patients/Center',
        utilizationPercentage: 164,
        status: 'EXCEEDED',
        notes: 'Severe shortage of medical supplies.'
      },
      {
        id: 'res-evac-7',
        name: 'Water Evacuation',
        category: 'Evacuation',
        currentDemand: 100,
        availableCapacity: 40,
        unit: 'Vessels',
        utilizationPercentage: 250,
        status: 'EXCEEDED',
        notes: 'Not enough boats for rapid evacuation.'
      }
    ],
    aiInsight: 'Critical environmental degradation has drastically reduced the safe carrying capacity.',
    lastAssessed: 'Today at 06:15 AM'
  },
  'hab-008': {
    habitationId: 'hab-008',
    habitationName: 'Chiplun Riverine Town',
    district: 'Ratnagiri',
    state: 'Maharashtra',
    overallCapacityPercentage: 88,
    overallStatus: 'OPTIMAL CAPACITY',
    totalPopulation: 7800,
    safePopulationThreshold: 8860,
    resourceMetrics: [
      {
        id: 'res-pop-8',
        name: 'Population Load',
        category: 'Population',
        currentDemand: 7800,
        availableCapacity: 8860,
        unit: 'Residents',
        utilizationPercentage: 88,
        status: 'SAFE',
        notes: 'Well within limits.'
      },
      {
        id: 'res-water-8',
        name: 'Water Supply',
        category: 'Water',
        currentDemand: 650,
        availableCapacity: 750,
        unit: 'kL/day',
        utilizationPercentage: 86,
        status: 'SAFE',
        notes: 'Adequate supply.'
      },
      {
        id: 'res-health-8',
        name: 'Healthcare Facilities',
        category: 'Healthcare',
        currentDemand: 7800,
        availableCapacity: 9000,
        unit: 'Patients/Center',
        utilizationPercentage: 86,
        status: 'SAFE',
        notes: 'Sufficient medical infrastructure.'
      }
    ],
    aiInsight: 'Current infrastructure supports the population well, maintaining an optimal capacity profile.',
    lastAssessed: 'Today at 11:30 AM'
  }
};
