import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function WeeklyTrafficChart({ data, loading }) {
  return (
    <ChartCard title="Traffic by Day of Week" subtitle="When are you busiest?" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="day" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis tick={{ fontSize: 10 }} />
          <Radar dataKey="count" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.4} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}