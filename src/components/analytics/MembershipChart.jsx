import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function MembershipChart({ data, loading }) {
  return (
    <ChartCard title="Membership vs Walk-in" subtitle="Revenue and visit comparison" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="revenue" name="Revenue ($)" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="count" name="Visits" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}