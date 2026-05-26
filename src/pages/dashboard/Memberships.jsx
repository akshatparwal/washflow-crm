import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, CreditCard, Edit2, Trash2, Users, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Memberships() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price_monthly: '', visit_limit: '', color: '#1A6FD4' });

  useEffect(() => {
    const saved = localStorage.getItem('wash_crm_location');
    if (saved) setLocation(JSON.parse(saved));
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = {};
    if (loc) filter.location_id = loc.id;
    const data = await base44.entities.Membership.filter(filter, 'price_monthly');
    setPlans(data);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', price_monthly: '', visit_limit: '', color: '#1A6FD4' }); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, description: p.description || '', price_monthly: p.price_monthly, visit_limit: p.visit_limit || '', color: p.color || '#1A6FD4' }); setShowForm(true); };

  const handleSave = async () => {
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const data = { ...form, price_monthly: parseFloat(form.price_monthly), visit_limit: form.visit_limit ? parseInt(form.visit_limit) : null };
    if (loc) data.location_id = loc.id;
    if (editing) await base44.entities.Membership.update(editing.id, data);
    else await base44.entities.Membership.create(data);
    setShowForm(false);
    loadPlans();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this membership plan?')) {
      await base44.entities.Membership.delete(id);
      loadPlans();
    }
  };

  const COLORS = ['#1A6FD4', '#0EB5C1', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Membership Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage subscription plans for your customers</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Membership Plans</h3>
          <p className="text-muted-foreground mb-4">Create your first membership plan to offer customers a subscription.</p>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Create First Plan</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div key={plan.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden card-hover">
              <div className="h-2" style={{ background: plan.color || '#1A6FD4' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                    {plan.description && <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(plan)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold" style={{ color: plan.color || '#1A6FD4' }}>${plan.price_monthly?.toFixed(2)}</span>
                  <span className="text-muted-foreground text-sm mb-1">/month</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{plan.visit_limit ? `Up to ${plan.visit_limit} visits/month` : 'Unlimited visits'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Priority queue access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Loyalty points on visits</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Plan' : 'Create Membership Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Plan Name *</Label><Input className="mt-1" placeholder="e.g. Gold Monthly" autoComplete="off" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Description</Label><Textarea className="mt-1" placeholder="What's included..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly Price ($) *</Label><Input className="mt-1" type="number" placeholder="29.99" value={form.price_monthly} onChange={e => setForm({...form, price_monthly: e.target.value})} /></div>
              <div><Label>Visit Limit/Month</Label><Input className="mt-1" type="number" placeholder="Unlimited" value={form.visit_limit} onChange={e => setForm({...form, visit_limit: e.target.value})} /></div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({...form, color: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} className="flex-1" disabled={!form.name.trim() || !String(form.price_monthly).trim()}>Save Plan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}