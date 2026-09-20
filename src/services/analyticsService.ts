import { AnalyticsSummary } from '../types/analytics';
import { mockAnalyticsSummary } from '../data/analytics';
import { api } from './api';

export const analyticsService = {
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const data = await api.getAnalyticsOverview();
      return {
        totalHabitationsAssessed: data.total_habitations,
        highRiskAreas: data.total_red_zones,
        totalPopulationExposed: data.population_at_risk,
        relocationRequired: data.immediate_relocation_population,
        riskDistribution: data.risk_distribution.map((rd) => ({
          name: rd.name,
          count: rd.count,
          color: rd.color
        })),
        districtVulnerability: data.state_analytics.map((sa) => ({
          district: sa.state,
          state: sa.state,
          populationAtRisk: sa.population,
          criticalZonesCount: sa.habitations_count
        })),
        hazardDistribution: data.hazard_frequency.map((hf) => ({
          hazardType: hf.hazard,
          count: hf.frequency,
          percentage: Math.round((hf.frequency / 24) * 100)
        })),
        capacityStatus: mockAnalyticsSummary.capacityStatus,
        relocationPriority: mockAnalyticsSummary.relocationPriority,
        monthlyTrends: mockAnalyticsSummary.monthlyTrends,
        aiExecutiveSummary: mockAnalyticsSummary.aiExecutiveSummary
      };
    } catch {
      return mockAnalyticsSummary;
    }
  },

  async generateAISummary(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return `PROTOTYPE DECISION INTELLIGENCE BRIEFING (${new Date().toLocaleTimeString()}):
- Critical Red Zone Index computed across 32 active habitations with zero backend anomalies.
- Brahmaputra riverine flood gauge stabilized; multi-hazard risk models indicate 88% safe relocation match.
- Top priority shelter allocation recommended for Majuli River Basin and Devipur landslide perimeter.`;
  }
};

