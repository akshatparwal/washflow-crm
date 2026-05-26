import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Car, MapPin, Search, Star, Phone, Clock, CheckCircle, Filter, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function FindWash() {
  const [locations, setLocations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    base44.functions.invoke('publicLocations', {})
      .then(res => {
        const locs = res.data.locations || [];
        setLocations(locs);
        setFiltered(locs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let res = locations;
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.state?.toLowerCase().includes(q) ||
        l.zip?.includes(q) ||
        l.address?.toLowerCase().includes(q)
      );
    }
    if (selectedState) {
      res = res.filter(l => l.state === selectedState);
    }
    setFiltered(res);
  }, [search, selectedState, locations]);

  const states = [...new Set(locations.map(l => l.state).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/washnow" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-header flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">WashNow</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Find a Wash</span>
          <div className="ml-auto">
            <Link to="/dashboard/checkins">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Business Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Search Header */}
      <div className="gradient-header py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">Find a Car Wash Near You</h1>
          <p className="text-white/80 mb-8">Search by city, zip code, or location name</p>
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-xl max-w-xl mx-auto">
            <div className="flex-1 flex items-center gap-2 px-3">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                className="flex-1 text-foreground text-sm outline-none placeholder:text-muted-foreground"
                placeholder="City, zip code, or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button className="gradient-header border-0 text-white hover:opacity-90 rounded-xl px-5 gap-2">
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <button
            onClick={() => setSelectedState('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              !selectedState ? 'gradient-header text-white border-transparent' : 'bg-card border-border hover:border-primary/40'
            }`}
          >
            All States
          </button>
          {states.map(state => (
            <button
              key={state}
              onClick={() => setSelectedState(state === selectedState ? '' : state)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedState === state ? 'gradient-header text-white border-transparent' : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              {state}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-5">
          {loading ? 'Loading locations...' : `${filtered.length} location${filtered.length !== 1 ? 's' : ''} found`}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No locations found</h3>
            <p className="text-muted-foreground text-sm">Try a different search or check back soon — new locations are added regularly.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((loc, i) => (
              <motion.div key={loc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <LocationDetailCard loc={loc} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-foreground py-6 px-4 mt-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-header flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">WashNow</span>
          </div>
          <span className="text-xs text-white/50">© 2026 WashNow · Powered by WashCRM</span>
        </div>
      </footer>
    </div>
  );
}

function LocationDetailCard({ loc }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Color bar */}
      <div className="h-2 gradient-header" />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl gradient-header flex items-center justify-center flex-shrink-0">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground truncate">{loc.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            {loc.avg_rating ? (
              <>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= Math.round(loc.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">{loc.avg_rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">New</span>
            )}
          </div>
        </div>
        </div>

        <div className="space-y-2 mb-4 flex-1">
          {loc.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{loc.address}, {loc.city}, {loc.state} {loc.zip}</span>
            </div>
          )}
          {loc.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{loc.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Open · Mon–Sat 8am–6pm</span>
          </div>
        </div>

        <div className="flex gap-2">
          <a href={`https://maps.google.com/?q=${encodeURIComponent(`${loc.name} ${loc.address} ${loc.city} ${loc.state}`)}`} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full text-sm gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Directions
            </Button>
          </a>
          <Link to={`/checkin?location=${loc.slug}`} className="flex-1">
            <Button className="w-full gradient-header border-0 text-white hover:opacity-90 text-sm gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}