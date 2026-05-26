import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, Gift, CreditCard, Clock, CheckCircle, Star, MapPin, LogIn, User, Phone, Mail, AlertCircle, ChevronRight, Droplets, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerPortal() {
  const [step, setStep] = useState('lookup'); // lookup | dashboard
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [membership, setMembership] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    const cleaned = phone.replace(/\D/g, '');
    const all = await base44.entities.Customer.list();
    const match = all.find(c => c.phone?.replace(/\D/g, '') === cleaned);
    if (!match) {
      setError('No account found with that phone number. Have you checked in at one of our locations?');
      setLoading(false);
      return;
    }
    setCustomer(match);

    // Load membership
    if (match.membership_id) {
      const mem = await base44.entities.Membership.filter({ id: match.membership_id });
      if (mem.length > 0) setMembership(mem[0]);
    }

    // Load recent check-ins
    const checkins = await base44.entities.CheckIn.filter({ customer_id: match.id }, '-created_date', 10);
    setRecentVisits(checkins);

    setLoading(false);
    setStep('dashboard');
  };

  const membershipWashesUsed = recentVisits.filter(c => {
    const date = new Date(c.created_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && c.membership_used;
  }).length;

  const washesRemaining = membership?.visit_limit != null
    ? Math.max(0, membership.visit_limit - membershipWashesUsed)
    : null;

  const membershipStatusColor = {
    active: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    expired: 'bg-red-50 border-red-200 text-red-700',
    cancelled: 'bg-gray-50 border-gray-200 text-gray-600',
    none: 'bg-gray-50 border-gray-200 text-gray-500',
  }[customer?.membership_status || 'none'];

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-header flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground">WashNow</span>
              <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">by WashCRM</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {step === 'dashboard' && (
              <Button variant="ghost" size="sm" onClick={() => { setStep('lookup'); setCustomer(null); setPhone(''); }}
                className="text-muted-foreground text-xs">
                Sign Out
              </Button>
            )}
            <Link to="/find-wash">
              <Button size="sm" className="gradient-header border-0 text-white hover:opacity-90 gap-2">
                <MapPin className="w-3.5 h-3.5" /> Find a Wash
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">

        {/* Lookup step */}
        {step === 'lookup' && (
          <motion.div key="lookup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl gradient-header flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">My WashNow Account</h1>
                <p className="text-muted-foreground mt-2 text-sm">Enter your phone number to view your membership, loyalty points, and wash history.</p>
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <Label>Phone Number</Label>
                <Input
                  className="mt-2 text-base h-11"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                />
                {error && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <Button
                  className="w-full mt-4 gradient-header border-0 text-white hover:opacity-90 gap-2 h-11"
                  onClick={handleLookup} disabled={loading || !phone.trim()}>
                  {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Looking up…</> : <><LogIn className="w-4 h-4" /> View My Account</>}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  No account? <Link to="/find-wash" className="text-primary hover:underline">Book your first wash →</Link>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dashboard step */}
        {step === 'dashboard' && customer && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto px-4 py-8 space-y-5">

            {/* Welcome header */}
            <div className="gradient-header rounded-2xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Welcome back, {customer.full_name.split(' ')[0]}!</h1>
                  <p className="text-white/70 text-sm mt-0.5 flex items-center gap-3">
                    {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
                    {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Visits', value: customer.total_visits || 0, icon: Car, color: 'text-primary' },
                { label: 'Loyalty Points', value: (customer.loyalty_points || 0).toLocaleString(), icon: Gift, color: 'text-amber-500' },
                { label: 'Total Spent', value: `$${(customer.total_spent || 0).toFixed(0)}`, icon: CreditCard, color: 'text-emerald-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
                  <div className="text-2xl font-extrabold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Membership Card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Membership
              </h2>
              {membership && customer.membership_status === 'active' ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-bold text-foreground text-lg">{membership.name}</div>
                      <div className="text-sm text-muted-foreground">${membership.price_monthly}/month</div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${membershipStatusColor}`}>
                      Active
                    </span>
                  </div>

                  {membership.visit_limit != null ? (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Washes used this month</span>
                        <span className="font-semibold text-foreground">{membershipWashesUsed} / {membership.visit_limit}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="gradient-header rounded-full h-2.5 transition-all"
                          style={{ width: `${Math.min(100, (membershipWashesUsed / membership.visit_limit) * 100)}%` }} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {washesRemaining > 0 ? <><span className="text-emerald-600 font-semibold">{washesRemaining} washes remaining</span> this month</> : <span className="text-red-500 font-medium">Monthly limit reached — resets next month</span>}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-4">
                      <CheckCircle className="w-4 h-4" /> Unlimited washes included
                    </div>
                  )}

                  {customer.membership_expires && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Renews: {new Date(customer.membership_expires).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}

                  {/* Payment update notice */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-start gap-2">
                    <CreditCard className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Update payment info?</span> Visit the front desk at your wash location — a staff member can update your card on file in seconds.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full border mb-4 ${membershipStatusColor}`}>
                    {customer.membership_status === 'expired' ? 'Membership Expired' :
                     customer.membership_status === 'cancelled' ? 'Membership Cancelled' : 'No Membership'}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">Join a membership plan and get unlimited washes, priority queue access, and exclusive member pricing.</p>
                  <Link to="/find-wash">
                    <Button className="gradient-header border-0 text-white hover:opacity-90 gap-2">
                      <MapPin className="w-4 h-4" /> Find a Location to Join
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Loyalty Points */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" /> Loyalty Points
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-amber-600">{(customer.loyalty_points || 0).toLocaleString()}</span>
                  <span className="text-xs text-amber-500">pts</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {customer.loyalty_points >= 100
                      ? `Worth $${((customer.loyalty_points || 0) / 100).toFixed(2)} in discounts`
                      : 'Keep washing to earn rewards!'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">Earn 1 point per $1 spent · Redeem at checkout</div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground">
                💡 Every wash earns points. Mention your phone number at checkout to redeem them for discounts.
              </div>
            </div>

            {/* Recent Visit History */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Recent Visits
              </h2>
              {recentVisits.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No visit history yet. Book your first wash!</p>
              ) : (
                <div className="space-y-2">
                  {recentVisits.slice(0, 8).map(visit => (
                    <div key={visit.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Droplets className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">{visit.service_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {visit.vehicle_color && `${visit.vehicle_color} `}{visit.vehicle_make} {visit.vehicle_model}
                          {visit.check_in_date && ` · ${new Date(visit.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-foreground">${visit.service_price?.toFixed(2)}</div>
                        {visit.rating && (
                          <div className="flex items-center gap-0.5 justify-end mt-0.5">
                            {[...Array(visit.rating)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Book again CTA */}
            <div className="gradient-header rounded-2xl p-5 text-white text-center">
              <h3 className="font-bold text-lg mb-1">Ready for your next wash?</h3>
              <p className="text-white/70 text-sm mb-4">Earn {customer.loyalty_points || 0} + more points on your next visit.</p>
              <Link to="/find-wash">
                <Button className="bg-white text-primary hover:bg-white/90 font-semibold gap-2">
                  <MapPin className="w-4 h-4" /> Book Now
                </Button>
              </Link>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}