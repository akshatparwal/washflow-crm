import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, Car, Users, Star, TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

function StatCard({ title, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs last week
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  useEffect(() => { loadData(); }, [range]);

  const loadData = async () => {
    setLoading(true);
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = {};
    if (loc) filter.location_id = loc.id;
    const data = await base44.entities.CheckIn.filter(filter, '-created_date', 500);
    setCheckins(data);
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayCheckins = checkins.filter(c => c.check_in_date === today);
  const todayRevenue = todayCheckins.filter(c => c.payment_status === 'paid' || c.status === 'done').reduce((s, c) => s + (c.service_price || 0), 0);
  const activeQueue = checkins.filter(c => c.check_in_date === today && ['checked_in','waiting','in_progress'].includes(c.status)).length;
  const ratings = checkins.filter(c => c.rating).map(c => c.rating);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
  const customersToday = [...new Set(todayCheckins.map(c => c.customer_phone))].length;

  // Week over week
  const thisWeekStart = startOfWeek(new Date());
  const lastWeekStart = subDays(thisWeekStart, 7);
  const thisWeekCheckins = checkins.filter(c => new Date(c.created_date) >= thisWeekStart);
  const lastWeekCheckins = checkins.filter(c => new Date(c.created_date) >= lastWeekStart && new Date(c.created_date) < thisWeekStart);
  const thisWeekRev = thisWeekCheckins.filter(c => c.payment_status === 'paid' || c.status === 'done').reduce((s, c) => s + (c.service_price || 0), 0);
  const lastWeekRev = lastWeekCheckins.filter(c => c.payment_status === 'paid' || c.status === 'done').reduce((s, c) => s + (c.service_price || 0), 0);
  const revTrend = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0;

  // Daily chart data (last 7 days)
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayCheckins = checkins.filter(c => c.check_in_date === dateStr);
    return {
      date: format(d, 'EEE'),
      revenue: dayCheckins.filter(c => c.payment_status === 'paid' || c.status === 'done').reduce((s, c) => s + (c.service_price || 0), 0),
      customers: [...new Set(dayCheckins.map(c => c.customer_phone))].length,
    };
  });

  // Top services
  const serviceMap = {};
  checkins.forEach(c => {
    if (!c.service_name) return;
    if (!serviceMap[c.service_name]) serviceMap[c.service_name] = { name: c.service_name, count: 0, revenue: 0 };
    serviceMap[c.service_name].count++;
    if (c.payment_status === 'paid' || c.status === 'done') serviceMap[c.service_name].revenue += (c.service_price || 0);
  });
  const topServices = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const COLORS = ['#1A6FD4', '#0EB5C1', '#6366f1', '#f59e0b', '#10b981'];

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard title="Today's Revenue" value={`$${todayRevenue.toFixed(2)}`} icon={DollarSign} color="bg-blue-100 text-blue-600" trend={revTrend} />
            <StatCard title="Check-ins Today" value={todayCheckins.length} icon={Car} color="bg-teal-100 text-teal-600" />
            <StatCard title="Current Queue" value={activeQueue} icon={Car} color="bg-purple-100 text-purple-600" sub="active vehicles" />
            <StatCard title="Avg Rating" value={`${avgRating.toFixed(1)} ★`} icon={Star} color="bg-amber-100 text-amber-600" />
            <StatCard title="Customers Today" value={customersToday} icon={Users} color="bg-green-100 text-green-600" />
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            {/* Revenue chart */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Revenue — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => [`$${v.toFixed(2)}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#1A6FD4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Customers chart */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Customers — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="customers" fill="#0EB5C1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Top services */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Top Services by Revenue</h3>
              {topServices.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topServices.map((svc, i) => (
                    <div key={svc.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{svc.name}</span>
                          <span className="text-sm font-semibold text-green-600 ml-2">${svc.revenue.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(svc.revenue / (topServices[0]?.revenue || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New vs returning */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Today's Customer Breakdown</h3>
              <div className="flex items-center justify-around py-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{todayCheckins.filter(c => !c.returning).length}</div>
                  <div className="text-sm text-muted-foreground mt-1">New Customers</div>
                  <div className="text-xs text-muted-foreground">First-time visitors</div>
                </div>
                <div className="w-px h-16 bg-border" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">{todayCheckins.filter(c => c.returning).length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Returning</div>
                  <div className="text-xs text-muted-foreground">Previous visitors</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-semibold text-foreground">${thisWeekRev.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Last Week</span>
                  <span className="font-semibold text-foreground">${lastWeekRev.toFixed(2)}</span>
                </div>
                <div className={`flex items-center justify-between text-sm mt-1 font-semibold ${revTrend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  <span>Change</span>
                  <span>{revTrend >= 0 ? '+' : ''}{revTrend.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}