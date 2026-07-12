import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function ServiceTrendChart({ data, services, loading }) {
  return (
    <ChartCard title="Service Popularity — Month over Month" subtitle="Check-in volume per service, by month" loading={loading} height={320}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {services.map((svc, i) => (
            <Line key={svc} type="monotone" dataKey={svc} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}