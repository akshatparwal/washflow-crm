import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function VolumeBarChart({ data, loading }) {
  return (
    <ChartCard title="Check-in Volume" subtitle="Daily check-ins over last 30 days" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="checkins" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}