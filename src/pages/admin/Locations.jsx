import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, MapPin, Edit2, Loader2, Building2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700 border-green-200',
  trial: 'bg-blue-100 text-blue-700 border-blue-200',
  expired: 'bg-red-100 text-red-600 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', city: '', state: '', owner_id: '', subscription_status: 'trial', subscription_plan: 'starter' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Location.list('-created_date', 100);
    setLocations(data);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', city: '', state: '', owner_id: '', subscription_status: 'trial', subscription_plan: 'starter' }); setShowForm(true); };
  const openEdit = (l) => { setEditing(l); setForm({ name: l.name, slug: l.slug, city: l.city || '', state: l.state || '', owner_id: l.owner_id || '', subscription_status: l.subscription_status, subscription_plan: l.subscription_plan }); setShowForm(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Location.update(editing.id, form);
    else await base44.entities.Location.create(form);
    setShowForm(false);
    loadData();
  };

  const stats = {
    total: locations.length,
    active: locations.filter(l => l.subscription_status === 'active').length,
    trial: locations.filter(l => l.subscription_status === 'trial').length,
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">{stats.total} locations · {stats.active} active · {stats.trial} on trial</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Location</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Locations', value: stats.total, color: 'bg-blue-100 text-blue-600' },
          { label: 'Active Subscriptions', value: stats.active, color: 'bg-green-100 text-green-600' },
          { label: 'On Trial', value: stats.trial, color: 'bg-amber-100 text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}><Building2 className="w-4 h-4" /></div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Location','Slug','Status','Plan','Created','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {locations.map(loc => (
                <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl gradient-header flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{loc.name}</div>
                        <div className="text-xs text-muted-foreground">{loc.city}{loc.state ? `, ${loc.state}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{loc.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge border ${STATUS_COLORS[loc.subscription_status] || STATUS_COLORS.trial}`}>
                      {loc.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-foreground">{loc.subscription_plan}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(loc.created_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(loc)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No locations yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Business Name *</Label><Input className="mt-1" placeholder="Sparkle Car Wash" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>URL Slug *</Label><Input className="mt-1" placeholder="sparkle-wash" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input className="mt-1" value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
              <div><Label>State</Label><Input className="mt-1" placeholder="TX" value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subscription Status</Label>
                <Select value={form.subscription_status} onValueChange={v => setForm({...form, subscription_status: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['trial','active','expired','cancelled'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Plan</Label>
                <Select value={form.subscription_plan} onValueChange={v => setForm({...form, subscription_plan: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['starter','professional','enterprise'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} className="flex-1" disabled={!form.name || !form.slug}>Save Location</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}