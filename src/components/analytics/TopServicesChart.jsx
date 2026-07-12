import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function TopServicesChart({ data, loading }) {
  return (
    <ChartCard title="Top Services by Revenue" subtitle="Highest-grossing services" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
          <Tooltip formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}