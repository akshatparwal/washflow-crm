import { DollarSign, Car, Star, Users, Clock, Receipt, TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <StatCard title="Revenue (30d)" value={`$${stats.totalRevenue.toFixed(0)}`} icon={DollarSign} color="bg-blue-100 text-blue-600" trend={stats.trends?.revenue} />
      <StatCard title="Check-ins (30d)" value={stats.totalCheckins} icon={Car} color="bg-teal-100 text-teal-600" trend={stats.trends?.checkins} />
      <StatCard title="Avg Ticket" value={`$${stats.avgTicket.toFixed(2)}`} icon={Receipt} color="bg-purple-100 text-purple-600" sub="per visit" />
      <StatCard title="Avg Rating" value={`${stats.avgRating.toFixed(1)} ★`} icon={Star} color="bg-amber-100 text-amber-600" sub={`${stats.totalRatings} reviews`} />
      <StatCard title="Active Queue" value={stats.activeQueue} icon={Clock} color="bg-indigo-100 text-indigo-600" sub="in progress" />
      <StatCard title="Customers" value={stats.uniqueCustomers} icon={Users} color="bg-green-100 text-green-600" trend={stats.trends?.customers} />
    </div>
  );
}