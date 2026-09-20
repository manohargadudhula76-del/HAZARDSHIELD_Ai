import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface CapacityComparisonChartProps {
  data: {
    locationName: string;
    safetyScore: number;
    capacityScore: number;
    infrastructureScore: number;
    accessibilityScore: number;
  }[];
}

export const CapacityComparisonChart: React.FC<CapacityComparisonChartProps> = ({ data }) => {
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
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
          <XAxis dataKey="locationName" stroke={textColor} fontSize={11} tickLine={false} />
          <YAxis stroke={textColor} fontSize={11} domain={[0, 100]} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: '8px',
              color: tooltipText,
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {value}
              </span>
            )}
          />
          <Bar dataKey="safetyScore" fill="#10B981" name="Safety Score %" radius={[4, 4, 0, 0]} />
          <Bar dataKey="capacityScore" fill="#3B82F6" name="Capacity Score %" radius={[4, 4, 0, 0]} />
          <Bar dataKey="infrastructureScore" fill="#F59E0B" name="Infra Rating %" radius={[4, 4, 0, 0]} />
          <Bar dataKey="accessibilityScore" fill="#8B5CF6" name="Accessibility %" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
