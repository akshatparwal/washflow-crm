import { Link } from 'react-router-dom';
import { Car, BarChart3, Users, CreditCard, Gift, UserCheck, Shield, ArrowRight, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: Car, title: 'Smart Check-Ins', desc: 'Customers check in from their phone. Real-time queue management for your team.' },
  { icon: BarChart3, title: 'Powerful Analytics', desc: 'Revenue trends, top services, customer breakdown — all in one dashboard.' },
  { icon: Users, title: 'Customer CRM', desc: 'Full customer profiles with visit history, vehicles, notes and ratings.' },
  { icon: CreditCard, title: 'Membership Plans', desc: 'Create unlimited wash plans and subscription tiers to build recurring revenue.' },
  { icon: Gift, title: 'Loyalty Rewards', desc: 'Automatically reward customers with points on every visit they can redeem for discounts.' },
  { icon: UserCheck, title: 'Staff & Shifts', desc: 'Add team members, assign roles, and track clock-in/out times for every shift.' },
];

const PLANS = [
  { name: 'Starter', price: '$49', period: '/mo per location', features: ['Up to 500 check-ins/mo','Customer CRM','Basic analytics','Email support'], color: '#1A6FD4' },
  { name: 'Professional', price: '$99', period: '/mo per location', features: ['Unlimited check-ins','Full analytics suite','Membership plans','Loyalty rewards','Staff management','Priority support'], color: '#0EB5C1', popular: true },
  { name: 'Enterprise', price: '$199', period: '/mo per location', features: ['Everything in Professional','Multi-location dashboard','Custom branding','API access','Dedicated support','SLA guarantee'], color: '#6366f1' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Nav */}
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-header flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">WashCRM</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/checkins">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/dashboard/checkins">
              <Button size="sm" className="gradient-header border-0 text-white hover:opacity-90">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="gradient-header py-20 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" /> Built exclusively for car wash businesses
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight max-w-3xl mx-auto">
            The Complete CRM for<br />Car Wash Businesses
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
            Check-ins, customer management, memberships, loyalty rewards, staff tracking and analytics — all in one beautiful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard/checkins">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need to run your car wash</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">One platform that grows with your business — from single location to full franchise.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-6 card-hover">
              <div className="w-11 h-11 rounded-xl gradient-header flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-muted/50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Per location. No setup fees. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`bg-card rounded-2xl border-2 p-6 relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-header text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-lg text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                </div>
                <div className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/checkins">
                  <Button className={`w-full ${plan.popular ? 'gradient-header border-0 text-white hover:opacity-90' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-header flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">WashCRM</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 WashCRM. Built for car wash professionals.</p>
        </div>
      </footer>
    </div>
  );
}