import { RiskLevel } from './habitation';

export interface DisasterAlert {
  id: string;
  habitationId?: string;
  habitationName: string;
  district: string;
  state: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH PRIORITY' | 'MODERATE' | 'INFO';
  riskLevel: RiskLevel;
  description: string;
  populationAtRisk: number;
  actionRequired: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  status?: 'ACTIVE' | 'RESOLVED';
}
