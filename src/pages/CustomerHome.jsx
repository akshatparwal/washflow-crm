import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Car, MapPin, Search, Star, Clock, Gift, Shield, ChevronRight, Sparkles, Phone, Droplets, Zap, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const WHY_US = [
  { icon: Zap, title: 'Fast & Efficient', desc: 'Check in from your phone. Skip the line and track your car in real time.' },
  { icon: Gift, title: 'Earn Rewards', desc: 'Collect loyalty points on every visit and redeem them for free washes.' },
  { icon: Shield, title: 'Trusted Pros', desc: 'All locations are vetted, insured, and rated by real customers.' },
  { icon: Droplets, title: 'Eco-Friendly', desc: 'Water-recycling systems and eco-safe products used at every location.' },
];

const SERVICES_PREVIEW = [
  { name: 'Basic Wash', price: 'From $15', time: '15 min', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'Silver Wash', price: 'From $30', time: '30 min', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { name: 'Gold Detail', price: 'From $50', time: '50 min', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'Full Interior Detail', price: 'From $80', time: '75 min', color: 'bg-purple-50 border-purple-200 text-purple-700' },
];

export default function CustomerHome() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    base44.entities.Location.filter({ is_active: true, subscription_status: 'active' }).then(setLocations).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const all = await base44.entities.Location.filter({ is_active: true });
      const q = search.toLowerCase();
      const filtered = all.filter(l =>
        l.city?.toLowerCase().includes(q) ||
        l.state?.toLowerCase().includes(q) ||
        l.zip?.includes(q) ||
        l.name?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q)
      );
      setResults(filtered);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-header flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground">WashNow</span>
              <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">by WashCRM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/my-account">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1.5">
                <User className="w-3.5 h-3.5" /> My Account
              </Button>
            </Link>
            <Link to="/find-wash">
              <Button size="sm" className="gradient-header border-0 text-white hover:opacity-90 gap-2">
                <MapPin className="w-3.5 h-3.5" /> Find a Wash
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="gradient-header pt-16 pb-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Book. Track. Shine.
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight max-w-3xl mx-auto">
            Find the Best Car Wash<br />Near You
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
            Browse nearby locations, book online in seconds, and earn loyalty rewards with every visit.
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto">
            <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  className="flex-1 text-foreground text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Enter city, zip code, or location name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} className="gradient-header border-0 text-white hover:opacity-90 rounded-xl px-5">
                {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searched && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto px-4 -mt-6">
            <div className="bg-card rounded-2xl border border-border shadow-xl p-6 mb-8">
              <h2 className="font-bold text-foreground mb-4 text-lg">
                {results.length > 0 ? `${results.length} location${results.length !== 1 ? 's' : ''} found` : 'No locations found nearby'}
              </h2>
              {results.length === 0 ? (
                <p className="text-muted-foreground text-sm">Try searching a different city, zip code, or location name. New locations are added regularly!</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map(loc => (
                    <LocationCard key={loc.id} loc={loc} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Locations */}
      {!searched && locations.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured Locations</h2>
              <p className="text-muted-foreground text-sm mt-1">Top-rated car washes in our network</p>
            </div>
            <Link to="/find-wash">
              <Button variant="outline" size="sm" className="gap-2">View All <ChevronRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {locations.slice(0, 6).map((loc, i) => (
              <motion.div key={loc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <LocationCard loc={loc} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Services Preview */}
      <div className="bg-gray-50 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">Popular Services</h2>
            <p className="text-muted-foreground">Find the perfect wash for your vehicle</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES_PREVIEW.map((svc, i) => (
              <motion.div key={svc.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`border-2 rounded-2xl p-5 text-center ${svc.color}`}>
                <Droplets className="w-7 h-7 mx-auto mb-3 opacity-70" />
                <div className="font-bold text-sm mb-1">{svc.name}</div>
                <div className="font-semibold text-lg mb-1">{svc.price}</div>
                <div className="flex items-center justify-center gap-1 text-xs opacity-70">
                  <Clock className="w-3 h-3" /> {svc.time}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/find-wash">
              <Button className="gradient-header border-0 text-white hover:opacity-90 gap-2">
                <MapPin className="w-4 h-4" /> Find a Location Near You
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Why WashNow */}
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">Why Book Through WashNow?</h2>
          <p className="text-muted-foreground">A better car wash experience, every time</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_US.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl gradient-header flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">How It Works</h2>
            <p className="text-muted-foreground">Get your car sparkling clean in 3 easy steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Find a Location', desc: 'Search by city or zip code to find the closest car wash in our network.', icon: MapPin },
              { step: '2', title: 'Check In Online', desc: 'Pick your service, enter your vehicle details, and check in from your phone.', icon: Car },
              { step: '3', title: 'Earn Rewards', desc: 'Every wash earns loyalty points. Redeem them for discounts and free services.', icon: Gift },
            ].map((item, i) => (
              <div key={item.step} className="text-center relative">
                {i < 2 && <div className="hidden md:block absolute top-6 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />}
                <div className="w-14 h-14 rounded-full gradient-header text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10">
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="gradient-header py-14 px-4 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready for a Spotless Ride?</h2>
        <p className="text-white/80 mb-6 text-lg">Find a location near you and book your wash today.</p>
        <Link to="/find-wash">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 shadow-xl">
            <MapPin className="w-5 h-5" /> Find My Nearest Wash
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-foreground py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl gradient-header flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">WashNow</div>
              <div className="text-xs text-white/50">Powered by WashCRM</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/50">
            <Link to="/" className="hover:text-white/80">For Businesses</Link>
            <Link to="/find-wash" className="hover:text-white/80">Find a Wash</Link>
            <span>© 2026 WashNow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LocationCard({ loc }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl gradient-header flex items-center justify-center flex-shrink-0">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground text-sm truncate">{loc.name}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{loc.city}, {loc.state} {loc.zip}</span>
          </div>
        </div>
      </div>
      {loc.address && (
        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" /> {loc.address}
        </div>
      )}
      {loc.phone && (
        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <Phone className="w-3 h-3 flex-shrink-0" /> {loc.phone}
        </div>
      )}
      <div className="flex items-center gap-1 mb-4">
        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
        <span className="text-xs text-muted-foreground ml-1">5.0</span>
      </div>
      <div className="mt-auto">
        <Link to={`/checkin?location=${loc.slug}`} className="block">
          <Button className="w-full gradient-header border-0 text-white hover:opacity-90 text-sm gap-2">
            <CheckCircle className="w-3.5 h-3.5" /> Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}