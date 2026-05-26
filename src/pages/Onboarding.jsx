import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, MapPin, Check, ChevronRight, Mail, Phone, Building, Loader2, Star, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HOUSTON_ZONES = [
  'The Heights', 'River Oaks / Galleria', 'Medical Center / Greenway',
  'Pearland / South Houston', 'Memorial / Energy Corridor', 'Katy / West Houston',
  'Humble / NE Houston', 'Downtown / EaDo', 'Cypress / NW Houston',
  'Pasadena / Baytown (1 slot left)',
];

const STEPS = ['Territory', 'Business', 'Confirm'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    zone: '',
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    city: 'Houston',
    state: 'TX',
    slug: '',
  });

  const handleZoneSelect = (zone) => {
    setForm(f => ({ ...f, zone }));
  };

  const handleBusinessName = (name) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setForm(f => ({ ...f, business_name: name, slug }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const user = await base44.auth.me();

    const loc = await base44.entities.Location.create({
      name: form.business_name,
      slug: form.slug,
      city: form.city,
      state: form.state,
      phone: form.phone,
      email: form.email,
      owner_id: user.id,
      is_active: true,
      subscription_status: 'trial',
      subscription_plan: 'professional',
    });

    // Create default services
    const defaultServices = [
      { name: 'Basic Wash', description: 'Quick exterior rinse and hand dry', price: 15, duration_minutes: 15, category: 'exterior', sort_order: 1, location_id: loc.id, is_active: true },
      { name: 'Silver Wash', description: 'Full exterior wash, rinse, dry, and tire shine', price: 30, duration_minutes: 30, category: 'exterior', sort_order: 2, location_id: loc.id, is_active: true },
      { name: 'Gold Detail', description: 'Complete wash, interior vacuum, windows, and full detail', price: 50, duration_minutes: 50, category: 'full_detail', sort_order: 3, location_id: loc.id, is_active: true },
    ];
    for (const svc of defaultServices) {
      await base44.entities.Service.create(svc);
    }

    // Send territory confirmation email
    await base44.integrations.Core.SendEmail({
      to: form.email || user.email,
      subject: `🎉 Territory Confirmed — ${form.zone}, Houston`,
      body: `Hi ${form.owner_name || user.full_name},\n\nCongratulations! Your exclusive WashCRM territory has been confirmed:\n\n📍 Zone: ${form.zone}\n🏢 Business: ${form.business_name}\n🌐 Check-in URL: ${window.location.origin}/checkin?location=${form.slug}\n\nYou're one of the first operators in Houston on WashCRM. Your 30-day free trial of the Professional plan is now active.\n\nNext steps:\n1. Log in to your dashboard: ${window.location.origin}/dashboard/checkins\n2. Add your staff members\n3. Share your check-in link with customers\n\nWelcome to the WashCRM family!\n\n— The WashCRM Team`,
    });

    localStorage.setItem('wash_crm_location', JSON.stringify(loc));
    setSaving(false);
    setDone(true);

    setTimeout(() => navigate('/dashboard/checkins'), 3000);
  };

  const canProceedStep0 = form.zone !== '';
  const canProceedStep1 = form.business_name && form.email;

  if (done) {
    return (
      <div className="min-h-screen gradient-header flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Territory Confirmed!</h2>
          <p className="text-muted-foreground mb-4">
            You've claimed exclusive rights to <strong>{form.zone}</strong>.<br />
            A confirmation email is on its way.
          </p>
          <div className="bg-muted rounded-xl p-4 text-left text-sm space-y-2 mb-5">
            <div className="flex gap-2"><MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span><strong>Zone:</strong> {form.zone}</span></div>
            <div className="flex gap-2"><Building className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span><strong>Business:</strong> {form.business_name}</span></div>
            <div className="flex gap-2"><Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /><span><strong>Plan:</strong> Professional (30-day free trial)</span></div>
          </div>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-header py-10 px-4 text-center">
        <Link to="/for-business" className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">WashCRM</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-white mb-2">Claim Your Houston Territory</h1>
        <p className="text-white/80 text-sm max-w-md mx-auto">Exclusive zones — one operator per area. Once claimed, it's yours.</p>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-white text-primary' : i === step ? 'bg-white text-primary shadow-lg' : 'bg-white/20 text-white/60'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-white/60'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-white' : 'bg-white/30'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* Step 0 — Territory */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-4">
                <h2 className="font-bold text-foreground text-lg mb-1">Choose Your Zone</h2>
                <p className="text-sm text-muted-foreground mb-4">Select the Houston area you want to serve exclusively.</p>
                <div className="space-y-2">
                  {HOUSTON_ZONES.map(zone => (
                    <button key={zone} onClick={() => handleZoneSelect(zone)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                        form.zone === zone ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}>
                      <MapPin className={`w-4 h-4 flex-shrink-0 ${form.zone === zone ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${form.zone === zone ? 'text-primary' : 'text-foreground'}`}>{zone}</span>
                      {form.zone === zone && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full gradient-header border-0 text-white hover:opacity-90 gap-2 h-12" disabled={!canProceedStep0}
                onClick={() => setStep(1)}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 1 — Business info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-4">
                <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-emerald-700">Zone reserved: <strong>{form.zone}</strong></span>
                </div>
                <h2 className="font-bold text-foreground text-lg mb-1">Your Business Details</h2>
                <p className="text-sm text-muted-foreground mb-4">We'll send a Territory Confirmation email to you.</p>
                <div className="space-y-4">
                  <div>
                    <Label>Your Name *</Label>
                    <Input className="mt-1" placeholder="John Smith" value={form.owner_name}
                      onChange={e => setForm(f => ({...f, owner_name: e.target.value}))} />
                  </div>
                  <div>
                    <Label>Business Name *</Label>
                    <Input className="mt-1" placeholder="Sunshine Car Wash" value={form.business_name}
                      onChange={e => handleBusinessName(e.target.value)} />
                    {form.slug && <p className="text-xs text-muted-foreground mt-1">Check-in link: /checkin?location={form.slug}</p>}
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input className="mt-1" type="email" placeholder="john@sunshinewash.com" value={form.email}
                      onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                  </div>
                  <div>
                    <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input className="mt-1" placeholder="(713) 000-0000" value={form.phone}
                      onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                <Button className="flex-1 gradient-header border-0 text-white hover:opacity-90 gap-2 h-11" disabled={!canProceedStep1}
                  onClick={() => setStep(2)}>
                  Review <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Confirm */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-4">
                <h2 className="font-bold text-foreground text-lg mb-4">Confirm Your Territory Claim</h2>

                <div className="space-y-3 mb-5">
                  {[
                    { icon: MapPin, label: 'Exclusive Zone', value: form.zone },
                    { icon: Building, label: 'Business', value: form.business_name },
                    { icon: Mail, label: 'Email', value: form.email },
                    { icon: Phone, label: 'Phone', value: form.phone || 'Not provided' },
                    { icon: Star, label: 'Trial Plan', value: 'Professional — 30 days free' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className="text-sm font-semibold text-foreground">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex gap-2">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>A <strong>Territory Confirmed</strong> email will be sent to {form.email}. No credit card required.</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button className="flex-1 gradient-header border-0 text-white hover:opacity-90 gap-2 h-11"
                  onClick={handleSubmit} disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</> : <><Trophy className="w-4 h-4" /> Claim Territory</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}