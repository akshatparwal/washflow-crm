import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Car, DollarSign, Star, Gift, Clock, Edit2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function CustomerDetail({ customer, onClose, onUpdate }) {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(customer.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    loadHistory();
  }, [customer.id]);

  const loadHistory = async () => {
    setLoading(true);
    let data = await base44.entities.CheckIn.filter({ customer_id: customer.id }, '-created_date', 50);
    // Fallback: search by phone for legacy/demo records not linked by customer_id
    if (data.length === 0 && customer.phone) {
      data = await base44.entities.CheckIn.filter({ customer_phone: customer.phone }, '-created_date', 50);
    }
    setCheckins(data);
    setLoading(false);
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await base44.entities.Customer.update(customer.id, { notes });
    setSavingNotes(false);
    setEditingNotes(false);
  };

  const STATUS_COLORS = {
    done: 'bg-green-100 text-green-700',
    in_progress: 'bg-purple-100 text-purple-700',
    checked_in: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-600',
    waiting: 'bg-amber-100 text-amber-700',
    ready: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="bg-card h-full w-full max-w-lg shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gradient-header flex items-center justify-center text-white font-bold text-lg">
              {customer.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-foreground">{customer.full_name}</h2>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-4">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Car className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="font-bold text-foreground">{customer.total_visits || 0}</div>
            <div className="text-xs text-muted-foreground">Visits</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <div className="font-bold text-foreground">${(customer.total_spent || 0).toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Spent</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Gift className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <div className="font-bold text-foreground">{customer.loyalty_points || 0}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
        </div>

        {/* Status badges */}
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {customer.email && <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{customer.email}</span>}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${customer.is_new ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {customer.is_new ? '✦ New Customer' : '↩ Returning'}
          </span>
          {customer.membership_status === 'active' && (
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">✓ Member</span>
          )}
          {customer.avg_rating && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">★ {customer.avg_rating.toFixed(1)} avg rating</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 mb-4 bg-muted p-1 rounded-lg mx-4">
          {['history', 'notes'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {t === 'history' ? 'Visit History' : 'Notes'}
            </button>
          ))}
        </div>

        {activeTab === 'history' && (
          <div className="px-4">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : checkins.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No visit history</div>
            ) : (
              <div className="space-y-3">
                {checkins.map(ci => (
                  <div key={ci.id} className="bg-muted/30 rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-foreground text-sm">{ci.service_name}</div>
                        <div className="text-xs text-muted-foreground">{ci.vehicle_color} {ci.vehicle_make} {ci.vehicle_model}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-sm">${ci.service_price?.toFixed(2)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[ci.status] || 'bg-gray-100 text-gray-600'}`}>{ci.status?.replace('_',' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(ci.created_date), 'MMM d, yyyy h:mm a')}</span>
                      {ci.rating && <span className="text-amber-500">★ {ci.rating}/5</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="px-4">
            {editingNotes ? (
              <div>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} className="mb-3" placeholder="Add notes about this customer..." />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)} className="flex-1">Cancel</Button>
                  <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="flex-1">
                    {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-muted/30 rounded-xl p-4 border border-border min-h-24 mb-3">
                  {notes ? <p className="text-sm text-foreground">{notes}</p> : <p className="text-sm text-muted-foreground italic">No notes yet.</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)} className="gap-2">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Notes
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}