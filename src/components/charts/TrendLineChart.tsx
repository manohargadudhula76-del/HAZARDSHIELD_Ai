import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export interface TrendDataPoint {
  month: string;
  criticalZones: number;
  highRisk: number;
  moderateRisk: number;
}

export interface TrendLineChartProps {
  data: TrendDataPoint[];
  height?: number;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ data, height = 300 }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#263246' : '#E2E8F0';
  const tooltipBg = isDark ? '#151B2B' : '#FFFFFF';
  const tooltipBorder = isDark ? '#263246' : '#E2E8F0';

  return (
    <div style={{ width: '100%', height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              borderColor: tooltipBorder,
              color: isDark ? '#FFFFFF' : '#0F172A',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: isDark ? '#E2E8F0' : '#334155' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="criticalZones" 
            name="Critical Zones" 
            stroke="#EF4444" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="highRisk" 
            name="High Risk" 
            stroke="#F97316" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="moderateRisk" 
            name="Moderate Risk" 
            stroke="#F59E0B" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
