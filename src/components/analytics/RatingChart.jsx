import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function RatingChart({ data, loading }) {
  return (
    <ChartCard title="Customer Ratings" subtitle="Satisfaction distribution" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[(4 - i) % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}