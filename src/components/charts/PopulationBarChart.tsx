import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DistrictVulnerabilityItem } from '../../types/analytics';
import { useTheme } from '../../context/ThemeContext';

interface PopulationBarChartProps {
  data: DistrictVulnerabilityItem[];
}

export const PopulationBarChart: React.FC<PopulationBarChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
          <XAxis
            dataKey="district"
            stroke={textColor}
            fontSize={11}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis stroke={textColor} fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: '8px',
              color: tooltipText,
              fontSize: '12px'
            }}
          />
          <Bar dataKey="populationAtRisk" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Population at Risk" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
