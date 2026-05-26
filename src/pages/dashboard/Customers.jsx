import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, User, Phone, Mail, Star, Gift, CreditCard, ChevronRight, Loader2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import CustomerDetail from '@/components/customers/CustomerDetail';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('wash_crm_location');
    if (saved) setLocation(JSON.parse(saved));
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = {};
    if (loc) filter.location_id = loc.id;
    const data = await base44.entities.Customer.filter(filter, '-created_date', 200);
    setCustomers(data);
    setLoading(false);
  };

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent || 0), 0);
  const newCount = customers.filter(c => c.is_new).length;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {customers.length} total · {newCount} new · ${totalRevenue.toFixed(2)} total revenue
      </p>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{search ? 'No customers found' : 'No customers yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Customer','Contact','Type','Visits','Total Spent','Last Visit','Avg Rating'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-header flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {c.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm">{c.full_name}</div>
                          {c.membership_status === 'active' && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Member</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">{c.phone}</div>
                      {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge border text-xs ${c.is_new ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {c.is_new ? 'New' : 'Returning'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{c.total_visits || 0}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">${(c.total_spent || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {c.last_visit ? format(new Date(c.last_visit), 'MMM d, yyyy') : '–'}
                    </td>
                    <td className="px-4 py-3">
                      {c.avg_rating ? (
                        <span className="flex items-center gap-1 text-sm">
                          <span className="text-amber-400">★</span>
                          {c.avg_rating.toFixed(1)}
                        </span>
                      ) : <span className="text-muted-foreground text-sm">–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <CustomerDetail customer={selected} onClose={() => setSelected(null)} onUpdate={() => { loadCustomers(); setSelected(null); }} />
      )}
    </div>
  );
}