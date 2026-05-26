import { useState } from 'react';
import { MapPin, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

// Houston zones with availability
const ZONES = [
  { id: 1, name: 'Midtown / Montrose', status: 'taken', cx: 52, cy: 52, desc: 'Operator confirmed — serving since 2024' },
  { id: 2, name: 'The Heights', status: 'available', cx: 38, cy: 35, desc: 'High-density residential — prime territory' },
  { id: 3, name: 'River Oaks / Galleria', status: 'available', cx: 32, cy: 52, desc: 'Affluent area — highest avg ticket value' },
  { id: 4, name: 'Medical Center / Greenway', status: 'available', cx: 44, cy: 65, desc: 'Business district — steady weekday traffic' },
  { id: 5, name: 'Pearland / South Houston', status: 'available', cx: 50, cy: 80, desc: 'Fast-growing suburb — early mover advantage' },
  { id: 6, name: 'Sugar Land', status: 'taken', cx: 28, cy: 78, desc: 'Operator confirmed — waitlist open' },
  { id: 7, name: 'Memorial / Energy Corridor', status: 'available', cx: 18, cy: 48, desc: 'Corporate corridor — premium demographics' },
  { id: 8, name: 'Katy / West Houston', status: 'available', cx: 8, cy: 45, desc: 'Booming suburb — limited competition' },
  { id: 9, name: 'Humble / NE Houston', status: 'available', cx: 68, cy: 28, desc: 'Underserved market — high growth area' },
  { id: 10, name: 'Pasadena / Baytown', status: 'limited', cx: 72, cy: 58, desc: 'Partial coverage — 1 slot remaining' },
  { id: 11, name: 'Downtown / EaDo', status: 'available', cx: 55, cy: 44, desc: 'Urban core — weekday lunch rush potential' },
  { id: 12, name: 'Cypress / NW Houston', status: 'available', cx: 22, cy: 28, desc: 'Growing master-planned communities' },
];

const STATUS_CONFIG = {
  available: { color: '#10b981', label: 'Available', icon: CheckCircle },
  taken: { color: '#ef4444', label: 'Claimed', icon: XCircle },
  limited: { color: '#f59e0b', label: 'Limited', icon: AlertCircle },
};

export default function TerritoryMap() {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [address, setAddress] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheckAddress = () => {
    if (!address.trim()) return;
    setChecking(true);
    setTimeout(() => {
      // Simulate address check — in prod this would call a geocoding API
      const lower = address.toLowerCase();
      const matched = ZONES.find(z =>
        z.name.toLowerCase().split('/').some(part =>
          lower.includes(part.trim().toLowerCase().split(' ')[0])
        )
      );
      if (matched) {
        setCheckResult({ zone: matched, status: matched.status });
      } else {
        // Default to showing available zones
        setCheckResult({ zone: null, status: 'unknown' });
      }
      setChecking(false);
    }, 800);
  };

  const available = ZONES.filter(z => z.status === 'available').length;
  const taken = ZONES.filter(z => z.status === 'taken').length;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="gradient-header p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5" />
          <span className="font-bold text-lg">Houston Territory Map</span>
        </div>
        <p className="text-white/80 text-sm">We operate on an exclusive territory model — one operator per zone. Claim yours before it's gone.</p>
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-white/90">{available} Available</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-white/90">{taken} Claimed</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-white/90">1 Limited</span></div>
        </div>
      </div>

      <div className="p-6">
        {/* Address checker */}
        <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border">
          <p className="text-sm font-semibold text-foreground mb-2">Check if your address is in an available zone</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your street address or zip code..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheckAddress()}
              className="flex-1"
            />
            <Button onClick={handleCheckAddress} disabled={checking} className="gradient-header border-0 text-white hover:opacity-90">
              {checking ? 'Checking...' : 'Check'}
            </Button>
          </div>
          {checkResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-start gap-2 ${
              checkResult.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              checkResult.status === 'taken' ? 'bg-red-50 text-red-700 border border-red-200' :
              checkResult.status === 'limited' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {checkResult.status === 'available' && <><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><div><strong>Great news!</strong> The {checkResult.zone?.name} zone is available. <Link to="/onboarding" className="underline font-bold">Claim it now →</Link></div></>}
              {checkResult.status === 'taken' && <><XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><div><strong>Zone claimed.</strong> The {checkResult.zone?.name} zone is taken, but nearby zones may be available. Explore the map below.</div></>}
              {checkResult.status === 'limited' && <><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><div><strong>Last slot!</strong> Only 1 operator spot remaining in {checkResult.zone?.name}. <Link to="/onboarding" className="underline font-bold">Claim it now →</Link></div></>}
              {checkResult.status === 'unknown' && <><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" /><div>We couldn't pinpoint your exact zone. <strong>Multiple zones near you are available.</strong> <Link to="/onboarding" className="underline font-bold">Get started →</Link></div></>}
            </div>
          )}
        </div>

        {/* SVG Map */}
        <div className="relative bg-slate-50 rounded-xl border border-border overflow-hidden" style={{ paddingBottom: '70%' }}>
          <svg viewBox="0 0 85 95" className="absolute inset-0 w-full h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Houston rough outline */}
            <path d="M10,20 L75,18 L80,25 L78,70 L70,82 L55,88 L20,85 L8,75 L5,50 Z"
              fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />

            {/* Zone circles */}
            {ZONES.map(zone => {
              const cfg = STATUS_CONFIG[zone.status];
              const isHovered = hovered === zone.id;
              const isSelected = selected?.id === zone.id;
              return (
                <g key={zone.id}
                  onMouseEnter={() => setHovered(zone.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(isSelected ? null : zone)}
                  style={{ cursor: 'pointer' }}>
                  <circle
                    cx={zone.cx} cy={zone.cy}
                    r={isHovered || isSelected ? 5.5 : 4.5}
                    fill={cfg.color}
                    opacity={isHovered || isSelected ? 1 : 0.8}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                  {(isHovered || isSelected) && (
                    <circle cx={zone.cx} cy={zone.cy} r={7} fill={cfg.color} opacity={0.2} />
                  )}
                </g>
              );
            })}

            {/* Houston label */}
            <text x="42" y="55" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="600" opacity="0.5">HOUSTON</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>Click a dot to see zone details</span>
          <span>•</span>
          <span>Hover to highlight</span>
        </div>

        {/* Zone detail panel */}
        {selected && (() => {
          const cfg = STATUS_CONFIG[selected.status];
          const Icon = cfg.icon;
          return (
            <div className="mt-4 p-4 rounded-xl border-2 bg-card" style={{ borderColor: cfg.color + '40' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    <span className="font-bold text-foreground">{selected.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selected.desc}</p>
                </div>
                {selected.status !== 'taken' && (
                  <Link to="/onboarding">
                    <Button size="sm" className="gradient-header border-0 text-white hover:opacity-90 gap-1 flex-shrink-0">
                      Claim <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}