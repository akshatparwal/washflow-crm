import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useState, useEffect } from 'react';
import {
  ClipboardList, Users, BarChart3, Settings, Car,
  LogOut, ChevronLeft, ChevronRight, Shield, MapPin,
  UserCheck, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Check-Ins', path: '/dashboard/checkins', icon: ClipboardList },
  { label: 'Customers', path: '/dashboard/customers', icon: Users },
  { label: 'Services', path: '/dashboard/services', icon: Car },
  { label: 'Reports', path: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Staff', path: '/dashboard/staff', icon: UserCheck },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
];

const adminItems = [
  { label: 'All Locations', path: '/admin/locations', icon: MapPin },
  { label: 'Reports', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Owners', path: '/admin/owners', icon: Shield },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    const saved = localStorage.getItem('wash_crm_location');
    if (saved) setCurrentLocation(JSON.parse(saved));
  }, []);

  const isAdmin = user?.role === 'admin';
  const items = isAdmin ? [...adminItems, ...navItems] : navItems;

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard/checkins" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-header flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-foreground text-sm leading-tight">WashNow</div>
              <div className="text-xs text-muted-foreground">Car Wash Platform</div>
            </div>
          )}
        </Link>
      </div>

      {/* Location indicator */}
      {!collapsed && currentLocation && (
        <div className="mx-3 mt-3 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-primary truncate">{currentLocation.name}</div>
              <div className="text-xs text-muted-foreground">{currentLocation.city}, {currentLocation.state}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {isAdmin && (
          <div className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2", collapsed && "text-center")}>
            {!collapsed ? 'Admin' : '—'}
          </div>
        )}
        {items.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {user && !collapsed && (
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-foreground truncate">{user.full_name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center hidden lg:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-header flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">WashNow</span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}