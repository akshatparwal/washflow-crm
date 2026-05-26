import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, UserCheck, Clock, Edit2, Trash2, Loader2, PlayCircle, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, differenceInMinutes } from 'date-fns';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'technician', hourly_rate: '' });
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const filter = loc ? { location_id: loc.id } : {};
    const s = await base44.entities.Staff.filter(filter, 'full_name');
    setStaff(s);
    // Fetch shifts filtered by location_id directly
    const shiftFilter = loc ? { location_id: loc.id } : {};
    const sh = await base44.entities.Shift.filter(shiftFilter, '-created_date', 100);
    setShifts(sh);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ full_name: '', email: '', phone: '', role: 'technician', hourly_rate: '' }); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setForm({ full_name: s.full_name, email: s.email || '', phone: s.phone || '', role: s.role, hourly_rate: s.hourly_rate || '' }); setShowForm(true); };

  const handleSave = async () => {
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    const data = { ...form, hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null };
    if (loc) data.location_id = loc.id;
    if (editing) await base44.entities.Staff.update(editing.id, data);
    else await base44.entities.Staff.create(data);
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (confirm('Remove this staff member?')) { await base44.entities.Staff.delete(id); loadData(); }
  };

  const clockIn = async (s) => {
    const saved = localStorage.getItem('wash_crm_location');
    const loc = saved ? JSON.parse(saved) : null;
    await base44.entities.Shift.create({
      location_id: loc?.id,
      staff_id: s.id,
      staff_name: s.full_name,
      clock_in: new Date().toISOString(),
      status: 'active'
    });
    loadData();
  };

  const clockOut = async (shift) => {
    const clockOut = new Date().toISOString();
    const mins = differenceInMinutes(new Date(), new Date(shift.clock_in));
    await base44.entities.Shift.update(shift.id, { clock_out: clockOut, hours_worked: mins / 60, status: 'completed' });
    loadData();
  };

  const getActiveShift = (staffId) => shifts.find(sh => sh.staff_id === staffId && sh.status === 'active');

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your team and track shifts</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Staff</Button>
      </div>

      <div className="flex gap-1 mb-5 bg-muted p-1 rounded-lg w-fit">
        {['staff', 'shifts'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'staff' ? 'Team Members' : 'Shift History'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : activeTab === 'staff' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => {
            const activeShift = getActiveShift(s.id);
            return (
              <div key={s.id} className="bg-card rounded-xl border border-border shadow-sm p-5 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-header flex items-center justify-center text-white font-bold text-lg">
                      {s.full_name?.[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{s.full_name}</div>
                      <div className={`text-xs font-medium mt-0.5 capitalize px-2 py-0.5 rounded-full inline-block ${
                        s.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>{s.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(s)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                {s.email && <div className="text-xs text-muted-foreground mb-1">{s.email}</div>}
                {s.phone && <div className="text-xs text-muted-foreground mb-3">{s.phone}</div>}
                {s.hourly_rate && <div className="text-xs text-muted-foreground mb-3">${s.hourly_rate}/hr</div>}
                {activeShift ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-green-700">Clocked in {format(new Date(activeShift.clock_in), 'h:mm a')}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => clockOut(activeShift)}>
                      <StopCircle className="w-4 h-4" /> Clock Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => clockIn(s)}>
                    <PlayCircle className="w-4 h-4" /> Clock In
                  </Button>
                )}
              </div>
            );
          })}
          {staff.length === 0 && (
            <div className="col-span-full text-center py-16">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No staff added yet</p>
              <Button onClick={openCreate} className="mt-3"><Plus className="w-4 h-4 mr-2" /> Add First Staff Member</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Staff','Clock In','Clock Out','Hours','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shifts.map(sh => (
                <tr key={sh.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-sm">{sh.staff_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(sh.clock_in), 'MMM d, h:mm a')}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{sh.clock_out ? format(new Date(sh.clock_out), 'h:mm a') : '–'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{sh.hours_worked ? `${sh.hours_worked.toFixed(1)}h` : '–'}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge border ${sh.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {sh.status === 'active' ? 'Active' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No shifts recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Full Name *</Label><Input className="mt-1" placeholder="John Smith" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input className="mt-1" type="email" placeholder="john@wash.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><Label>Phone</Label><Input className="mt-1" placeholder="(555) 000-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role *</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Hourly Rate ($)</Label><Input className="mt-1" type="number" placeholder="15.00" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} className="flex-1" disabled={!form.full_name}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}