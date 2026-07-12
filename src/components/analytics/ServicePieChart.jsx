import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function ServicePieChart({ data, loading }) {
  return (
    <ChartCard title="Service Distribution" subtitle="By number of check-ins" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={v => [v, 'Check-ins']} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}