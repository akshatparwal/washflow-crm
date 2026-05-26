import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Clock, Loader2, Car, DollarSign, MoreVertical, Copy, Check, ExternalLink, Link } from 'lucide-react';
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

function StatusActions({ ci, onUpdate }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onUpdate(ci.id, 'waiting')}>→ Waiting</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdate(ci.id, 'in_progress')}>→ In Progress</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdate(ci.id, 'ready')}>→ Ready</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdate(ci.id, 'done')} className="text-green-600">✓ Mark Done</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdate(ci.id, 'cancelled')} className="text-destructive">✕ Cancel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CheckIns() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [location, setLocation] = useState(null);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('wash_crm_location');
    if (saved) setLocation(JSON.parse(saved));
    loadCheckins();

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(loadCheckins, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const loadCheckins = async () => {
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
  const checkinUrl = location ? `${window.location.origin}/checkin?location=${location.slug}` : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Check-in URL banner */}
      {checkinUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex flex-col sm:flex-row sm:items-center gap-2">
          <Link className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-700 font-medium flex-shrink-0">Customer check-in link:</span>
          <span className="text-xs text-blue-600 font-mono truncate flex-1">{checkinUrl}</span>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={copyUrl} className="h-7 gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-100">
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.open(checkinUrl, '_blank')} className="h-7 border-blue-300 text-blue-700 hover:bg-blue-100">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

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
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {t}
          </button>
        ))}
      </div>

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
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
                          {format(new Date(ci.created_date), 'h:mm a')}
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
                          {ci.service_duration && <div className="text-xs text-muted-foreground">{ci.service_duration}m</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-badge border ${sc.color}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          {ci.rating ? (
                            <span className="text-sm text-amber-500 font-medium">★ {ci.rating}</span>
                          ) : <span className="text-muted-foreground text-sm">–</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusActions ci={ci} onUpdate={updateStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(ci => {
              const sc = STATUS_CONFIG[ci.status] || STATUS_CONFIG.checked_in;
              return (
                <div key={ci.id} className="bg-card rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-foreground">{ci.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{ci.customer_phone}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-badge border ${sc.color}`}>{sc.label}</span>
                      <StatusActions ci={ci} onUpdate={updateStatus} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Service</span>
                      <div className="font-medium text-foreground">{ci.service_name}</div>
                      <div className="text-green-600 font-semibold text-xs">${ci.service_price?.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Vehicle</span>
                      <div className="font-medium text-foreground text-xs">{ci.vehicle_color} {ci.vehicle_make} {ci.vehicle_model}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                    <span>#{ci.queue_position} · {format(new Date(ci.created_date), 'h:mm a')}</span>
                    {ci.rating && <span className="text-amber-500">★ {ci.rating}/5</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}