import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, CheckCircle, Clock, Star, Gift, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckInPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('location') || window.location.pathname.split('/checkin/')[1];

  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // form | confirm | success
  const [queuePos, setQueuePos] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  const [form, setForm] = useState({
    full_name: '', phone: '', email: '',
    vehicle_make: '', vehicle_model: '', vehicle_color: '', vehicle_license_plate: '',
    service_id: '', payment_method: 'in_person', notes: ''
  });

  useEffect(() => {
    loadLocationData();
  }, []);

  const loadLocationData = async () => {
    setLoading(true);
    try {
      const locations = await base44.entities.Location.filter({ slug: slug || 'demo', is_active: true });
      if (locations.length > 0) {
        const loc = locations[0];
        setLocation(loc);
        const svcs = await base44.entities.Service.filter({ location_id: loc.id, is_active: true }, 'sort_order');
        setServices(svcs);
      }
    } catch (e) {
      // silently handle auth/network errors — location will be null and show "Not Found"
    }
    setLoading(false);
  };

  const selectedService = services.find(s => s.id === form.service_id);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
    // Find or create customer
    let customer = null;
    const existing = await base44.entities.Customer.filter({ phone: form.phone, location_id: location.id });
    if (existing.length > 0) {
      customer = existing[0];
      await base44.entities.Customer.update(customer.id, { is_new: false, last_visit: new Date().toISOString() });
    } else {
      customer = await base44.entities.Customer.create({
        full_name: form.full_name, phone: form.phone, email: form.email,
        location_id: location.id, is_new: true, last_visit: new Date().toISOString()
      });
    }

    // Get queue position
    const activeCheckins = await base44.entities.CheckIn.filter({
      location_id: location.id,
      check_in_date: new Date().toISOString().split('T')[0]
    });
    const active = activeCheckins.filter(c => !['done','cancelled'].includes(c.status));
    const pos = active.length + 1;
    setQueuePos(pos);

    const pts = Math.round((selectedService?.price || 0) * (location.loyalty_points_per_dollar || 1));
    setPointsEarned(pts);

    await base44.entities.CheckIn.create({
      location_id: location.id,
      customer_id: customer.id,
      customer_name: form.full_name,
      customer_phone: form.phone,
      customer_email: form.email,
      vehicle_make: form.vehicle_make,
      vehicle_model: form.vehicle_model,
      vehicle_color: form.vehicle_color,
      vehicle_license_plate: form.vehicle_license_plate,
      service_id: form.service_id,
      service_name: selectedService?.name,
      service_price: selectedService?.price,
      service_duration: selectedService?.duration_minutes,
      status: 'checked_in',
      queue_position: pos,
      payment_method: form.payment_method,
      payment_status: form.payment_method === 'online' ? 'paid' : 'pending',
      loyalty_points_earned: pts,
      notes: form.notes,
      check_in_date: new Date().toISOString().split('T')[0]
    });

    // Update customer loyalty
    const newPoints = (customer.loyalty_points || 0) + pts;
    if (customer) {
      await base44.entities.Customer.update(customer.id, {
        total_visits: (customer.total_visits || 0) + 1,
        total_spent: (customer.total_spent || 0) + (selectedService?.price || 0),
        loyalty_points: newPoints
      });
    }

    // Write loyalty transaction so reporting works
    if (pts > 0) {
      await base44.entities.LoyaltyTransaction.create({
        location_id: location.id,
        customer_id: customer.id,
        type: 'earned',
        points: pts,
        description: `${selectedService?.name} — check-in`,
        balance_after: newPoints
      });
    }

    setSubmitting(false);
    setStep('success');
    } catch (e) {
      setSubmitting(false);
      alert('Something went wrong saving your check-in. Please ask staff to check you in manually.');
    }
  };

  const isFormValid = form.full_name && form.phone && form.vehicle_make && form.vehicle_model && form.vehicle_color && form.service_id;

  if (loading) return (
    <div className="min-h-screen gradient-header flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );

  if (!location) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground mb-2">Location Not Found</h2>
        <p className="text-muted-foreground">This check-in link is invalid or expired.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-header py-8 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Car className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{location.name}</h1>
        <p className="text-white/80 text-sm mt-1">Professional Car Wash & Detailing — Check in to get started</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Personal Info */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-4">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full gradient-header text-white text-xs flex items-center justify-center font-bold">1</span>
                  Your Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <Label>Full Name *</Label>
                    <Input className="mt-1" placeholder="Jane Smith" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Phone *</Label>
                      <Input className="mt-1" placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div>
                      <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input className="mt-1" placeholder="jane@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-4">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full gradient-header text-white text-xs flex items-center justify-center font-bold">2</span>
                  Vehicle Details
                </h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Make *</Label>
                      <Input className="mt-1" placeholder="Toyota" value={form.vehicle_make} onChange={e => setForm({...form, vehicle_make: e.target.value})} />
                    </div>
                    <div>
                      <Label>Model *</Label>
                      <Input className="mt-1" placeholder="Camry" value={form.vehicle_model} onChange={e => setForm({...form, vehicle_model: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Color *</Label>
                      <Input className="mt-1" placeholder="Silver" value={form.vehicle_color} onChange={e => setForm({...form, vehicle_color: e.target.value})} />
                    </div>
                    <div>
                      <Label>License Plate <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input className="mt-1" placeholder="ABC 123" value={form.vehicle_license_plate} onChange={e => setForm({...form, vehicle_license_plate: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-4">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full gradient-header text-white text-xs flex items-center justify-center font-bold">3</span>
                  Select a Service *
                </h2>
                <div className="space-y-3">
                  {services.length === 0 && <p className="text-muted-foreground text-sm">No services available.</p>}
                  {services.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => setForm({...form, service_id: svc.id})}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                        form.service_id === svc.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 bg-background'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{svc.name}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">{svc.description}</div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="font-bold text-primary">${svc.price?.toFixed(2)}</div>
                          {svc.duration_minutes && <div className="text-xs text-muted-foreground">{svc.duration_minutes} min</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-4">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full gradient-header text-white text-xs flex items-center justify-center font-bold">4</span>
                  Payment Method
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {['in_person', 'online'].map(method => (
                    <button
                      key={method}
                      onClick={() => setForm({...form, payment_method: method})}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        form.payment_method === method ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="font-semibold text-sm">{method === 'in_person' ? 'Pay In Person' : 'Pay Online'}</div>
                      <div className="text-xs text-muted-foreground mt-1">{method === 'in_person' ? 'Cash or card at counter' : 'Secure card payment'}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-6">
                <Label>Additional Comments <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea className="mt-2" placeholder="Any special instructions or notes for our team..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
              </div>

              <Button
                className="w-full h-12 text-base font-semibold gradient-header border-0 text-white hover:opacity-90"
                disabled={!isFormValid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Check In Now <ChevronRight className="w-5 h-5 ml-1" /></>}
              </Button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">You're Checked In!</h2>
              <p className="text-muted-foreground mb-6">Welcome, {form.full_name}. We'll get started on your {selectedService?.name} right away.</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-2xl font-bold text-foreground">#{queuePos}</div>
                  <div className="text-xs text-muted-foreground">Queue Position</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
                  <div className="text-2xl font-bold text-foreground">{selectedService?.duration_minutes || '–'}m</div>
                  <div className="text-xs text-muted-foreground">Est. Wait</div>
                </div>
              </div>

              {pointsEarned > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <Gift className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="font-semibold text-amber-700">+{pointsEarned} Loyalty Points Earned!</div>
                  <div className="text-sm text-amber-600">Points added to your account</div>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground">Service: <span className="font-semibold text-foreground">{selectedService?.name}</span></div>
                <div className="text-sm text-muted-foreground mt-1">Vehicle: <span className="font-semibold text-foreground">{form.vehicle_color} {form.vehicle_make} {form.vehicle_model}</span></div>
                <div className="text-sm text-muted-foreground mt-1">Payment: <span className="font-semibold text-foreground">{form.payment_method === 'online' ? 'Paid Online' : 'Pay at Counter'}</span></div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">Please wait in the lobby or your vehicle. A staff member will come to you when your car is ready.</p>

              <Button variant="outline" className="mt-4" onClick={() => { setStep('form'); setForm({ full_name:'',phone:'',email:'',vehicle_make:'',vehicle_model:'',vehicle_color:'',vehicle_license_plate:'',service_id:'',payment_method:'in_person',notes:'' }); }}>
                New Check-In
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}