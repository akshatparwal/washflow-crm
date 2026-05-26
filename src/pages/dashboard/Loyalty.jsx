import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, TrendingUp, Star, Loader2, Search, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function Loyalty() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('wash_crm_location');
    if (saved) {
      const loc = JSON.parse(saved);
      setLocation(loc);
    }
    loadData();
  }, []);

  // Derive earn rate directly from loaded customers' location if state is missing


  const loadData = async () => {
    setLoading(true);
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = {};
    if (loc) filter.location_id = loc.id;
    const [custs, txns] = await Promise.all([
      base44.entities.Customer.filter(filter, '-loyalty_points', 100),
      base44.entities.LoyaltyTransaction.filter(filter, '-created_date', 50)
    ]);
    setCustomers(custs);
    setTransactions(txns);
    setLoading(false);
  };

  const topCustomers = customers.filter(c => (c.loyalty_points || 0) > 0).slice(0, 10);
  const totalPointsIssued = transactions.filter(t => t.type === 'earned').reduce((s, t) => s + t.points, 0);
  const totalPointsRedeemed = transactions.filter(t => t.type === 'redeemed').reduce((s, t) => s + Math.abs(t.points), 0);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  // Recompute totalPointsIssued from customer loyalty_points as fallback when no transactions exist
  const totalPointsIssuedFallback = transactions.length === 0
    ? customers.reduce((s, c) => s + (c.loyalty_points || 0), 0)
    : totalPointsIssued;

  const loc = location;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Loyalty Program</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage customer loyalty points</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <Gift className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{totalPointsIssuedFallback.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Points Issued</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <Award className="w-5 h-5 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{totalPointsRedeemed.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Points Redeemed</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{customers.filter(c => (c.loyalty_points || 0) > 0).length}</div>
          <div className="text-xs text-muted-foreground">Active Members</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <Star className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{loc ? `${loc.loyalty_points_per_dollar || 1}pt/$` : '–'}</div>
          <div className="text-xs text-muted-foreground">Earn Rate</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Leaderboard */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Top Loyalty Members</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : topCustomers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No loyalty points earned yet</div>
          ) : (
            <div className="divide-y divide-border">
              {topCustomers.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground'
                  }`}>{i + 1}</div>
                  <div className="w-8 h-8 rounded-full gradient-header flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.full_name}</div>
                    <div className="text-xs text-muted-foreground">{c.total_visits || 0} visits</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600">{(c.loyalty_points || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Transactions</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    t.type === 'earned' ? 'bg-green-100' : t.type === 'redeemed' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <Gift className={`w-4 h-4 ${t.type === 'earned' ? 'text-green-600' : t.type === 'redeemed' ? 'text-red-500' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.description || t.type}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(t.created_date), 'MMM d, h:mm a')}</div>
                  </div>
                  <div className={`font-bold text-sm ${t.type === 'earned' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'earned' ? '+' : '-'}{Math.abs(t.points)} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All customers loyalty table */}
      <div className="mt-5 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <h3 className="font-semibold text-foreground flex-1">All Customers</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-8 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Customer','Phone','Total Visits','Total Spent','Points Balance','Last Visit'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 20).map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-header flex items-center justify-center text-white text-xs font-bold">{c.full_name?.[0]}</div>
                      <span className="text-sm font-medium">{c.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-sm font-medium">{c.total_visits || 0}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">${(c.total_spent || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-amber-600">{(c.loyalty_points || 0).toLocaleString()} pts</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {c.last_visit ? format(new Date(c.last_visit), 'MMM d, yyyy') : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}