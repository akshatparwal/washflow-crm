import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, MapPin, Link, Loader2, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Settings() {
  const [location, setLocation] = useState(null);
  const [originalSlug, setOriginalSlug] = useState('');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me().catch(() => null);
      setUser(me);
      // Always load fresh from DB — localStorage may have stale/partial data
      const allLocs = await base44.entities.Location.list('name').catch(() => []);
      setAllLocations(allLocs);

      const saved = localStorage.getItem('wash_crm_location');
      let activeLoc = null;
      if (saved) {
        const cached = JSON.parse(saved);
        activeLoc = allLocs.find(l => l.id === cached.id) || allLocs[0];
      } else if (me) {
        activeLoc = allLocs.find(l => l.owner_id === me.id) || allLocs[0];
      } else {
        activeLoc = allLocs[0];
      }
      if (activeLoc) {
        localStorage.setItem('wash_crm_location', JSON.stringify(activeLoc));
        setLocation(activeLoc);
        populateForm(activeLoc);
      }
    };
    init();
  }, []);

  const populateForm = (loc) => {
    setOriginalSlug(loc.slug || '');
    setForm({
      name: loc.name || '', slug: loc.slug || '', address: loc.address || '',
      city: loc.city || '', state: loc.state || '', zip: loc.zip || '',
      phone: loc.phone || '', email: loc.email || '',
      loyalty_points_per_dollar: loc.loyalty_points_per_dollar ?? 1,
      loyalty_redemption_rate: loc.loyalty_redemption_rate ?? 100,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    if (location?.id) {
      const updated = await base44.entities.Location.update(location.id, form);
      localStorage.setItem('wash_crm_location', JSON.stringify(updated));
      setLocation(updated);
    }
    setSaving(false);
    toast.success('Settings saved!');
  };

  const selectLocation = (loc) => {
    localStorage.setItem('wash_crm_location', JSON.stringify(loc));
    setLocation(loc);
    populateForm(loc);
  };

  const checkinUrl = location ? `${window.location.origin}/checkin?location=${location.slug}` : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      {/* Location selector */}
      {allLocations.length > 1 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-foreground mb-3">Switch Location</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {allLocations.map(loc => (
              <button key={loc.id} onClick={() => selectLocation(loc)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${location?.id === loc.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">{loc.name}</div>
                  <div className="text-xs text-muted-foreground">{loc.city}, {loc.state}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Check-in URL */}
      {checkinUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
          <h2 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Link className="w-4 h-4" /> Customer Check-In URL</h2>
          <p className="text-sm text-blue-600 mb-3">Share this link with your customers to let them check in.</p>
          <div className="flex items-center gap-2">
            <Input readOnly value={checkinUrl} className="bg-white text-sm font-mono" />
            <Button variant="outline" size="sm" onClick={copyUrl} className="gap-1.5 flex-shrink-0">
              {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(checkinUrl, '_blank')} className="flex-shrink-0">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Location info */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 mb-5">
        <h2 className="font-semibold text-foreground mb-4">Location Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Business Name *</Label><Input className="mt-1" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div>
              <Label>URL Slug *</Label>
              <Input className="mt-1" placeholder="my-car-wash" value={form.slug || ''} onChange={e => setForm({...form, slug: e.target.value})} />
              {form.slug && form.slug !== originalSlug && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Changing your slug will break all existing check-in links and QR codes.</span>
                </div>
              )}
            </div>
          </div>
          <div><Label>Address</Label><Input className="mt-1" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>City</Label><Input className="mt-1" value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} /></div>
            <div><Label>State</Label><Input className="mt-1" placeholder="TX" value={form.state || ''} onChange={e => setForm({...form, state: e.target.value})} /></div>
            <div><Label>ZIP</Label><Input className="mt-1" value={form.zip || ''} onChange={e => setForm({...form, zip: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Phone</Label><Input className="mt-1" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><Label>Email</Label><Input className="mt-1" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></div>
          </div>
        </div>
      </div>

      {/* Loyalty settings */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 mb-5">
        <h2 className="font-semibold text-foreground mb-4">Loyalty Program Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Points Earned per $1 Spent</Label>
            <Input className="mt-1" type="number" value={form.loyalty_points_per_dollar || 1} onChange={e => setForm({...form, loyalty_points_per_dollar: parseFloat(e.target.value)})} />
          </div>
          <div>
            <Label>Points Needed per $1 Off</Label>
            <Input className="mt-1" type="number" value={form.loyalty_redemption_rate || 100} onChange={e => setForm({...form, loyalty_redemption_rate: parseInt(e.target.value)})} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </Button>
    </div>
  );
}