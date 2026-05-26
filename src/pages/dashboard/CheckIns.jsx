import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Clock, CheckCircle2, Loader2, AlertCircle, Car, User, DollarSign, MoreVertical, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  checked_in:  { label: 'Checked In',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  waiting:     { label: 'Waiting',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
  in_progress: { label: 'In Progress',  color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ready:       { label: 'Ready',        color: 'bg-green-100 text-green-700 border-green-200' },
  done:        { label: 'Done',         color: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled:   { label: 'Cancelled',    color: 'bg-red-100 text-red-600 border-red-200' },
};

const TABS = ['active', 'ready', 'done', 'all'];

export default function CheckIns() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('wash_crm_location');
    if (saved) setLocation(JSON.parse(saved));
    loadCheckins();
  }, []);

  const loadCheckins = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = { check_in_date: today };
    if (loc) filter.location_id = loc.id;
    const data = await base44.entities.CheckIn.filter(filter, '-created_date', 100);
    setCheckins(data);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const updates = { status };
    if (status === 'done') updates.completed_at = new Date().toISOString();
    await base44.entities.CheckIn.update(id, updates);
    loadCheckins();
  };

  const filtered = checkins.filter(c => {
    if (tab === 'all') return true;
    if (tab === 'active') return ['checked_in', 'waiting', 'in_progress'].includes(c.status);
    if (tab === 'ready') return c.status === 'ready';
    if (tab === 'done') return c.status === 'done';
    return true;
  });

  const activeCount = checkins.filter(c => ['checked_in','waiting','in_progress'].includes(c.status)).length;
  const todayRevenue = checkins.filter(c => c.status === 'done').reduce((sum, c) => sum + (c.service_price || 0), 0);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-ins</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>Active queue: <strong className="text-foreground">{activeCount}</strong></span>
            <span>Today's revenue: <strong className="text-green-600">${todayRevenue.toFixed(2)}</strong></span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadCheckins} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Car className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No check-ins {tab !== 'all' ? `with status "${tab}"` : 'today'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Time','Customer','Vehicle','Service','Queue','Status','Rating','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(ci => {
                  const sc = STATUS_CONFIG[ci.status] || STATUS_CONFIG.checked_in;
                  return (
                    <tr key={ci.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(ci.created_date), 'MM/dd h:mm a')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-sm">{ci.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{ci.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {ci.vehicle_color && <span>{ci.vehicle_color} </span>}
                        {ci.vehicle_make} {ci.vehicle_model}
                        {ci.vehicle_license_plate && <span className="text-xs text-muted-foreground ml-1">({ci.vehicle_license_plate})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">{ci.service_name}</div>
                        <div className="text-xs text-green-600 font-semibold">${ci.service_price?.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-foreground">#{ci.queue_position}</div>
                        {ci.service_duration && <div className="text-xs text-muted-foreground">{ci.service_duration}m wait</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge border ${sc.color}`}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {ci.rating ? (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-amber-400">★</span>
                            <span className="font-medium">{ci.rating}/5</span>
                          </div>
                        ) : <span className="text-muted-foreground text-sm">–</span>}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(ci.id, 'waiting')}>→ Waiting</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(ci.id, 'in_progress')}>→ In Progress</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(ci.id, 'ready')}>→ Ready</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(ci.id, 'done')} className="text-green-600">✓ Mark Done</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(ci.id, 'cancelled')} className="text-destructive">✕ Cancel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}