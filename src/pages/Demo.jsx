import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, Play, Loader2, Check, Database, Users, BarChart3, Gift, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const DEMO_STEPS = [
  { label: 'Creating demo location…', icon: Car },
  { label: 'Adding services & memberships…', icon: Database },
  { label: 'Generating customers…', icon: Users },
  { label: 'Creating check-in history…', icon: BarChart3 },
  { label: 'Setting up loyalty data…', icon: Gift },
];

const DEMO_CUSTOMERS = [
  { full_name: 'Maria Garcia', phone: '7135550001', email: 'maria@demo.com', total_visits: 14, total_spent: 485, loyalty_points: 485, membership_status: 'active' },
  { full_name: 'James Wilson', phone: '7135550002', email: 'james@demo.com', total_visits: 7, total_spent: 210, loyalty_points: 210, membership_status: 'none' },
  { full_name: 'Ashley Chen', phone: '7135550003', email: 'ashley@demo.com', total_visits: 22, total_spent: 890, loyalty_points: 890, membership_status: 'active' },
  { full_name: 'Robert Johnson', phone: '7135550004', email: 'robert@demo.com', total_visits: 3, total_spent: 95, loyalty_points: 95, membership_status: 'none' },
  { full_name: 'Priya Patel', phone: '7135550005', email: 'priya@demo.com', total_visits: 18, total_spent: 670, loyalty_points: 670, membership_status: 'active' },
  { full_name: 'Carlos Rivera', phone: '7135550006', email: 'carlos@demo.com', total_visits: 5, total_spent: 165, loyalty_points: 165, membership_status: 'none' },
];

export default function Demo() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const runDemo = async () => {
    setRunning(true);
    setError(null);

    // Step 0 — Location
    setCurrentStep(0);
    const user = await base44.auth.me();
    const loc = await base44.entities.Location.create({
      name: '🔵 Demo — Sunshine Car Wash',
      slug: `demo-${Date.now()}`,
      city: 'Houston', state: 'TX',
      phone: '(713) 555-0100',
      email: 'demo@sunshinewash.com',
      owner_id: user.id,
      is_active: true,
      subscription_status: 'active',
      subscription_plan: 'professional',
      loyalty_points_per_dollar: 1,
      loyalty_points_per_visit: 10,
    });

    // Step 1 — Services & memberships
    setCurrentStep(1);
    const services = await Promise.all([
      base44.entities.Service.create({ location_id: loc.id, name: 'Basic Wash', description: 'Quick exterior rinse and hand dry', price: 15, duration_minutes: 15, category: 'exterior', sort_order: 1, is_active: true }),
      base44.entities.Service.create({ location_id: loc.id, name: 'Silver Wash', description: 'Full exterior wash, rinse, dry, tire shine', price: 30, duration_minutes: 30, category: 'exterior', sort_order: 2, is_active: true }),
      base44.entities.Service.create({ location_id: loc.id, name: 'Gold Detail', description: 'Complete wash, interior vacuum, windows', price: 50, duration_minutes: 50, category: 'full_detail', sort_order: 3, is_active: true }),
      base44.entities.Service.create({ location_id: loc.id, name: 'Full Interior Detail', description: 'Deep interior clean, shampoo, deodorize', price: 80, duration_minutes: 75, category: 'full_detail', sort_order: 4, is_active: true }),
    ]);

    await base44.entities.Membership.create({
      location_id: loc.id, name: 'Unlimited Basic', description: 'Unlimited basic washes every month',
      price_monthly: 39, visit_limit: null, is_active: true, color: '#1A6FD4',
    });
    await base44.entities.Membership.create({
      location_id: loc.id, name: 'Gold Member', description: 'Unlimited gold details + priority queue',
      price_monthly: 79, visit_limit: null, is_active: true, color: '#f59e0b',
    });

    // Step 2 — Customers
    setCurrentStep(2);
    const createdCustomers = await Promise.all(
      DEMO_CUSTOMERS.map(c => base44.entities.Customer.create({ ...c, location_id: loc.id, is_new: false }))
    );

    // Step 3 — Check-ins (live queue + recent history)
    setCurrentStep(3);
    const today = new Date().toISOString().split('T')[0];

    await Promise.all([
      base44.entities.CheckIn.create({
        location_id: loc.id, customer_id: createdCustomers[0].id,
        customer_name: DEMO_CUSTOMERS[0].full_name, customer_phone: DEMO_CUSTOMERS[0].phone,
        vehicle_make: 'Toyota', vehicle_model: 'Camry', vehicle_color: 'Silver',
        service_id: services[2].id, service_name: 'Gold Detail', service_price: 50, service_duration: 50,
        status: 'in_progress', queue_position: 1, payment_method: 'in_person', payment_status: 'pending',
        loyalty_points_earned: 50, check_in_date: today, rating: 5,
      }),
      base44.entities.CheckIn.create({
        location_id: loc.id, customer_id: createdCustomers[1].id,
        customer_name: DEMO_CUSTOMERS[1].full_name, customer_phone: DEMO_CUSTOMERS[1].phone,
        vehicle_make: 'Honda', vehicle_model: 'Civic', vehicle_color: 'Red',
        service_id: services[1].id, service_name: 'Silver Wash', service_price: 30, service_duration: 30,
        status: 'waiting', queue_position: 2, payment_method: 'in_person', payment_status: 'pending',
        loyalty_points_earned: 30, check_in_date: today,
      }),
      base44.entities.CheckIn.create({
        location_id: loc.id, customer_id: createdCustomers[2].id,
        customer_name: DEMO_CUSTOMERS[2].full_name, customer_phone: DEMO_CUSTOMERS[2].phone,
        vehicle_make: 'BMW', vehicle_model: '5 Series', vehicle_color: 'Black',
        service_id: services[3].id, service_name: 'Full Interior Detail', service_price: 80, service_duration: 75,
        status: 'ready', queue_position: 3, payment_method: 'online', payment_status: 'paid',
        loyalty_points_earned: 80, check_in_date: today, rating: 5,
      }),
    ]);

    // Recent completed check-ins (past days)
    const pastDates = [1,2,3,4,5].map(d => {
      const date = new Date(); date.setDate(date.getDate() - d);
      return date.toISOString().split('T')[0];
    });

    for (const date of pastDates) {
      const cust = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const svc = services[Math.floor(Math.random() * services.length)];
      await base44.entities.CheckIn.create({
        location_id: loc.id, customer_id: cust.id,
        customer_name: cust.full_name, customer_phone: cust.phone,
        vehicle_make: 'Ford', vehicle_model: 'F-150', vehicle_color: 'White',
        service_id: svc.id, service_name: svc.name, service_price: svc.price,
        status: 'done', payment_status: 'paid', loyalty_points_earned: svc.price,
        check_in_date: date, rating: Math.random() > 0.2 ? 5 : 4,
        completed_at: `${date}T14:00:00.000Z`,
      });
    }

    // Step 4 — Loyalty
    setCurrentStep(4);
    for (const cust of createdCustomers) {
      if (cust.loyalty_points > 0) {
        await base44.entities.LoyaltyTransaction.create({
          location_id: loc.id, customer_id: cust.id,
          type: 'earned', points: cust.loyalty_points,
          description: 'Historical visits', balance_after: cust.loyalty_points,
        });
      }
    }

    // Staff
    await Promise.all([
      base44.entities.Staff.create({ location_id: loc.id, full_name: 'Marcus T.', role: 'manager', is_active: true, hourly_rate: 18, hire_date: '2024-01-15' }),
      base44.entities.Staff.create({ location_id: loc.id, full_name: 'Luis R.', role: 'technician', is_active: true, hourly_rate: 14, hire_date: '2024-03-01' }),
      base44.entities.Staff.create({ location_id: loc.id, full_name: 'Tanya M.', role: 'technician', is_active: true, hourly_rate: 14, hire_date: '2024-06-10' }),
    ]);

    localStorage.setItem('wash_crm_location', JSON.stringify(loc));
    setCurrentStep(5);
    setDone(true);
    setRunning(false);

    setTimeout(() => navigate('/dashboard/checkins'), 2500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-header flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Demo Mode</h1>
          <p className="text-muted-foreground mt-1 text-sm">Launch a pre-seeded sandbox with realistic data</p>
        </div>

        <AnimatePresence mode="wait">
          {!running && !done && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* What's included */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mb-5">
                <h2 className="font-semibold text-foreground mb-3">What gets created</h2>
                <div className="space-y-2.5">
                  {[
                    { icon: Car, label: '1 demo location', sub: 'Sunshine Car Wash, Houston TX' },
                    { icon: Database, label: '4 services + 2 membership plans', sub: 'Realistic pricing & tiers' },
                    { icon: Users, label: '6 demo customers', sub: 'With visit history & loyalty points' },
                    { icon: BarChart3, label: 'Live queue (3 vehicles)', sub: 'In Progress, Waiting, Ready' },
                    { icon: BarChart3, label: '5 days of completed check-ins', sub: 'For analytics charts' },
                    { icon: Gift, label: 'Loyalty transactions', sub: 'Points earned & leaderboard data' },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>This creates real records in your account prefixed with 🔵 Demo. You can delete them anytime from the Admin panel.</span>
              </div>

              <Button onClick={runDemo} className="w-full gradient-header border-0 text-white hover:opacity-90 gap-2 h-12 text-base font-semibold">
                <Play className="w-5 h-5" /> Launch Demo Sandbox
              </Button>
              <div className="text-center mt-3">
                <Link to="/for-business" className="text-sm text-muted-foreground hover:text-foreground">← Back to landing page</Link>
              </div>
            </motion.div>
          )}

          {(running || done) && (
            <motion.div key="running" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="font-bold text-foreground text-center mb-6">
                {done ? '🎉 Demo Ready!' : 'Building your sandbox…'}
              </h2>
              <div className="space-y-3">
                {DEMO_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      state === 'active' ? 'bg-primary/5 border border-primary/20' :
                      state === 'done' ? 'opacity-60' : 'opacity-30'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        state === 'done' ? 'bg-emerald-100' : state === 'active' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {state === 'done' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> :
                         state === 'active' ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /> :
                         <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <span className={`text-sm font-medium ${state === 'done' ? 'text-muted-foreground line-through' : state === 'active' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {done && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center">
                  <p className="text-sm text-muted-foreground">Launching your dashboard…</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}