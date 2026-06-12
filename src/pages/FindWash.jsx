import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Car, MapPin, Search, Star, Phone, CheckCircle, Loader2, ChevronRight, Navigation, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const washIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 12, { duration: 1.2 }); }, [center]);
  return null;
}

export default function FindWash() {
  const initialQ = new URLSearchParams(window.location.search).get('q') || '';
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState(initialQ);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [center, setCenter] = useState(null); // [lat, lng]
  const [radius, setRadius] = useState(5); // miles
  const [filtered, setFiltered] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Geocode location addresses on load
  useEffect(() => {
    base44.functions.invoke('publicLocations', {})
      .then(async res => {
        const locs = (res.data.locations || []);
        // Geocode each location that doesn't have lat/lng
        const withCoords = await Promise.all(locs.map(async loc => {
          if (loc.lat && loc.lng) return loc;
          const addr = [loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ');
          if (!addr) return loc;
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`);
            const d = await r.json();
            if (d[0]) return { ...loc, lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
          } catch {}
          return loc;
        }));
        setLocations(withCoords);
        setLoading(false);
        // Auto-geocode if URL has a ?q= param
        if (initialQ) {
          setGeocoding(true);
          fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(initialQ)}&format=json&limit=1&countrycodes=us`)
            .then(r => r.json())
            .then(d => { if (d[0]) setCenter([parseFloat(d[0].lat), parseFloat(d[0].lon)]); })
            .finally(() => setGeocoding(false));
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter whenever center/radius/locations change
  useEffect(() => {
    if (!center) {
      setFiltered([]);
      return;
    }
    const inRange = locations
      .filter(l => l.lat && l.lng)
      .map(l => ({ ...l, distance: haversineDistance(center[0], center[1], l.lat, l.lng) }))
      .filter(l => l.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    setFiltered(inRange);
    setHasSearched(true);
  }, [center, radius, locations]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!search.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1&countrycodes=us`);
      const data = await res.json();
      if (data[0]) setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
    } catch {}
    setGeocoding(false);
  };

  const handleLocateMe = () => {
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCenter([pos.coords.latitude, pos.coords.longitude]); setLocatingMe(false); },
      () => setLocatingMe(false)
    );
  };

  const mapCenter = center || [39.5, -98.35]; // US center fallback
  const mapZoom = center ? 11 : 4;

  return (
    <div className="min-h-screen bg-background font-inter flex flex-col">
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

      {/* Search Bar */}
      <div className="gradient-header py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-extrabold text-white mb-1 text-center">Find a Car Wash Near You</h1>
          <p className="text-white/75 text-sm text-center mb-5">Enter your city or zip code to find nearby locations</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-lg">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                className="flex-1 text-sm outline-none placeholder:text-muted-foreground text-foreground"
                placeholder="City, zip code, or address..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={geocoding} className="gradient-header border-0 text-white hover:opacity-90 rounded-xl px-5 gap-2 shadow-lg">
              {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
            <Button type="button" variant="outline" onClick={handleLocateMe} disabled={locatingMe}
              className="bg-white border-0 rounded-xl px-4 gap-1.5 shadow-lg text-primary hover:bg-white/90">
              {locatingMe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              <span className="hidden sm:inline text-sm">Near Me</span>
            </Button>
          </form>

          {/* Radius slider */}
          {center && (
            <div className="mt-4 flex items-center gap-3 bg-white/15 rounded-xl px-4 py-2.5">
              <SlidersHorizontal className="w-4 h-4 text-white/80 flex-shrink-0" />
              <span className="text-white/80 text-sm flex-shrink-0">Radius:</span>
              <input
                type="range" min={1} max={25} step={1} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="flex-1 accent-white cursor-pointer"
              />
              <span className="text-white font-semibold text-sm w-16 text-right">{radius} miles</span>
            </div>
          )}
        </div>
      </div>

      {/* Map + Results */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden" style={{ minHeight: 520 }}>
        {/* Sidebar */}
        <div className="lg:w-80 xl:w-96 bg-white border-r border-border overflow-y-auto flex-shrink-0 order-2 lg:order-1">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <MapPin className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground text-sm mb-1">Search to find locations</p>
              <p className="text-xs text-muted-foreground">Enter a city, zip code, or tap "Near Me" to discover car washes in your area.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Car className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground text-sm mb-1">No locations within {radius} miles</p>
              <p className="text-xs text-muted-foreground">Try increasing the radius or searching a different area.</p>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-sm font-semibold text-foreground">{filtered.length} location{filtered.length !== 1 ? 's' : ''} within {radius} mi</p>
              </div>
              {filtered.map(loc => (
                <button key={loc.id} onClick={() => setSelectedLoc(loc)}
                  className={`w-full text-left px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors ${selectedLoc?.id === loc.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg gradient-header flex items-center justify-center flex-shrink-0">
                      <Car className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{loc.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{loc.address}, {loc.city}, {loc.state}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{loc.distance.toFixed(1)} mi</span>
                        {loc.phone && <span className="text-xs text-muted-foreground">{loc.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(`${loc.name} ${loc.address} ${loc.city} ${loc.state}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex-1 text-center text-xs border border-border rounded-lg py-1.5 hover:bg-muted transition-colors text-muted-foreground font-medium">
                      Directions
                    </a>
                    <Link to={`/checkin?location=${loc.slug}`} onClick={e => e.stopPropagation()} className="flex-1">
                      <span className="block w-full text-center text-xs gradient-header text-white rounded-lg py-1.5 font-medium hover:opacity-90 transition-opacity">
                        Book Now
                      </span>
                    </Link>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 order-1 lg:order-2" style={{ minHeight: 340 }}>
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%', minHeight: 340 }} zoomControl={true}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {center && <MapFlyTo center={center} />}
            {center && (
              <>
                <Marker position={center} icon={userIcon}>
                  <Popup>Your location</Popup>
                </Marker>
                <Circle center={center} radius={radius * 1609.34} pathOptions={{ color: '#1A6FD4', fillColor: '#1A6FD4', fillOpacity: 0.08, weight: 2 }} />
              </>
            )}
            {filtered.map(loc => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={washIcon}
                eventHandlers={{ click: () => setSelectedLoc(loc) }}>
                <Popup>
                  <div className="text-sm font-semibold">{loc.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{loc.address}, {loc.city}</div>
                  <div className="text-xs font-medium text-blue-600 mt-1">{loc.distance?.toFixed(1)} mi away</div>
                  <a href={`/checkin?location=${loc.slug}`} className="block mt-2 text-xs text-center bg-blue-600 text-white rounded px-2 py-1 no-underline hover:bg-blue-700">
                    Book Now
                  </a>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}