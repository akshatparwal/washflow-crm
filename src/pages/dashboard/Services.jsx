import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Star, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

const CATEGORIES = { exterior: 'Exterior', interior: 'Interior', full_detail: 'Full Detail', add_on: 'Add-On', other: 'Other' };

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration_minutes: '', category: 'exterior', sort_order: '0' });

  useEffect(() => {
    const saved = localStorage.getItem('wash_crm_location');
    if (saved) setLocation(JSON.parse(saved));
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = {};
    if (loc) filter.location_id = loc.id;
    const data = await base44.entities.Service.filter(filter, 'sort_order');
    setServices(data);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', price: '', duration_minutes: '', category: 'exterior', sort_order: '0' }); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, description: s.description || '', price: s.price, duration_minutes: s.duration_minutes || '', category: s.category || 'exterior', sort_order: s.sort_order || 0 }); setShowForm(true); };

  const handleSave = async () => {
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const data = { ...form, price: parseFloat(form.price), duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null, sort_order: parseInt(form.sort_order) || 0 };
    if (loc) data.location_id = loc.id;
    if (editing) await base44.entities.Service.update(editing.id, data);
    else await base44.entities.Service.create(data);
    setShowForm(false);
    loadServices();
  };

  const toggleActive = async (svc) => {
    await base44.entities.Service.update(svc.id, { is_active: !svc.is_active });
    loadServices();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this service?')) { await base44.entities.Service.delete(id); loadServices(); }
  };

  const checkinUrl = location ? `${window.location.origin}/checkin?location=${location.slug}` : '';

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your service menu</p>
        </div>
        <div className="flex gap-2">
          {checkinUrl && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(checkinUrl, '_blank')}>
              <ExternalLink className="w-4 h-4" /> Check-In Page
            </Button>
          )}
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Service</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
          <p className="text-muted-foreground mb-4">Add your car wash services to get started.</p>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add First Service</Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Service','Category','Price','Duration','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map(svc => (
                <tr key={svc.id} className={`hover:bg-muted/30 transition-colors ${!svc.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">{svc.name}</div>
                    {svc.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{svc.description}</div>}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                      {CATEGORIES[svc.category] || svc.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-green-600">${svc.price?.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{svc.duration_minutes ? `${svc.duration_minutes} min` : '–'}</td>
                  <td className="px-4 py-4">
                    <Switch checked={svc.is_active} onCheckedChange={() => toggleActive(svc)} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(svc)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(svc.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Service Name *</Label><Input className="mt-1" placeholder="e.g. Gold Wash" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Description</Label><Textarea className="mt-1" placeholder="What's included..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price ($) *</Label><Input className="mt-1" type="number" placeholder="25.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div><Label>Duration (min)</Label><Input className="mt-1" type="number" placeholder="30" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Sort Order</Label><Input className="mt-1" type="number" placeholder="0" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} className="flex-1" disabled={!form.name || !form.price}>Save Service</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}