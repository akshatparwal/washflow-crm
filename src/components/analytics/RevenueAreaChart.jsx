import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard, { CHART_COLORS } from './ChartCard';

export default function RevenueAreaChart({ data, loading }) {
  return (
    <ChartCard title="Revenue Trend" subtitle="Daily revenue over last 30 days" loading={loading}>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
          <Tooltip formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#revGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}