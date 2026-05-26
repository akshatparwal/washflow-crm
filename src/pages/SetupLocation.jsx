import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, MapPin, ArrowRight, Loader2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export default function SetupLocation() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', city: '', state: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadLocations(); }, []);

  const loadLocations = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const locs = await base44.entities.Location.filter({ owner_id: user.id });
    if (locs.length === 0) {
      // Check if admin sees all
      if (user.role === 'admin') {
        const all = await base44.entities.Location.list('name', 50);
        setLocations(all);
      } else {
        setLocations([]);
      }
    } else {
      setLocations(locs);
    }
    setLoading(false);
  };

  const selectLocation = (loc) => {
    localStorage.setItem('wash_crm_location', JSON.stringify(loc));
    navigate('/dashboard/checkins');
  };

  const handleCreate = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const loc = await base44.entities.Location.create({ ...form, owner_id: user.id, is_active: true });

    // Create default services
    const defaultServices = [
      { name: 'Basic', description: 'Quick exterior rinse and hand dry', price: 15, duration_minutes: 15, category: 'exterior', sort_order: 1, location_id: loc.id, is_active: true },
      { name: 'Silver', description: 'Full exterior wash, rinse, dry, and tire shine', price: 30, duration_minutes: 30, category: 'exterior', sort_order: 2, location_id: loc.id, is_active: true },
      { name: 'Gold', description: 'Complete wash, interior vacuum, windows, and full detail', price: 50, duration_minutes: 50, category: 'full_detail', sort_order: 3, location_id: loc.id, is_active: true },
    ];
    for (const svc of defaultServices) {
      await base44.entities.Service.create(svc);
    }

    selectLocation(loc);
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen gradient-header flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-header flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">WashCRM</h1>
          <p className="text-muted-foreground mt-1">Select or create your location</p>
        </div>

        {locations.length > 0 && !showForm && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mb-4">
            <h2 className="font-semibold text-foreground mb-4">Your Locations</h2>
            <div className="space-y-2">
              {locations.map(loc => (
                <button key={loc.id} onClick={() => selectLocation(loc)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                  <div className="w-9 h-9 rounded-xl gradient-header flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm">{loc.name}</div>
                    <div className="text-xs text-muted-foreground">{loc.city}{loc.state ? `, ${loc.state}` : ''}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-3 gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Add New Location
            </Button>
          </div>
        )}

        {(showForm || locations.length === 0) && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-semibold text-foreground mb-5">{locations.length > 0 ? 'New Location' : 'Set Up Your First Location'}</h2>
            <div className="space-y-4">
              <div><Label>Business Name *</Label><Input className="mt-1" placeholder="Sunshine Car Wash" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div>
                <Label>URL Slug *</Label>
                <Input className="mt-1" placeholder="sunshine-wash" value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')})} />
                <p className="text-xs text-muted-foreground mt-1">Customers check in at: /checkin?location={form.slug || 'your-slug'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input className="mt-1" placeholder="Houston" value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
                <div><Label>State</Label><Input className="mt-1" placeholder="TX" value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></div>
              </div>
              <div><Label>Phone</Label><Input className="mt-1" placeholder="(555) 000-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>

              <div className="flex gap-2 pt-2">
                {locations.length > 0 && <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Back</Button>}
                <Button onClick={handleCreate} disabled={!form.name || !form.slug || saving} className="flex-1 gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create & Continue
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}