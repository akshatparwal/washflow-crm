import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Pages
import Landing from './pages/Landing';
import CustomerHome from './pages/CustomerHome';
import FindWash from './pages/FindWash';
import SetupLocation from './pages/SetupLocation';
import CheckInPage from './pages/CheckInPage';
import Onboarding from './pages/Onboarding';
import Demo from './pages/Demo';
import CustomerPortal from './pages/CustomerPortal';
import Layout from './components/Layout';

// Dashboard pages
import CheckIns from './pages/dashboard/CheckIns';
import Customers from './pages/dashboard/Customers';
import Analytics from './pages/dashboard/Analytics';
import Memberships from './pages/dashboard/Memberships';
import Loyalty from './pages/dashboard/Loyalty';
import Staff from './pages/dashboard/Staff';
import Services from './pages/dashboard/Services';
import Settings from './pages/dashboard/Settings';

// Admin pages
import AdminLocations from './pages/admin/Locations';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const PUBLIC_PATHS = ['/', '/washnow', '/find-wash', '/checkin', '/for-business', '/demo', '/onboarding', '/my-account'];
  const isPublicPath = PUBLIC_PATHS.some(p => window.location.pathname === p || window.location.pathname.startsWith('/checkin'));

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      if (!isPublicPath) {
        navigateToLogin();
        return null;
      }
    }
  }

  return (
    <Routes>
      <Route path="/" element={<CustomerHome />} />
      <Route path="/washnow" element={<CustomerHome />} />
      <Route path="/find-wash" element={<FindWash />} />
      <Route path="/for-business" element={<Landing />} />
      <Route path="/checkin" element={<CheckInPage />} />
      <Route path="/setup" element={<SetupLocation />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/my-account" element={<CustomerPortal />} />

      {/* Owner dashboard */}
      <Route element={<Layout />}>
        <Route path="/dashboard/checkins" element={<CheckIns />} />
        <Route path="/dashboard/customers" element={<Customers />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="/dashboard/memberships" element={<Memberships />} />
        <Route path="/dashboard/loyalty" element={<Loyalty />} />
        <Route path="/dashboard/staff" element={<Staff />} />
        <Route path="/dashboard/services" element={<Services />} />
        <Route path="/dashboard/settings" element={<Settings />} />

        {/* Admin */}
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/owners" element={<Customers />} />
      </Route>

      <Route path="/dashboard" element={<Navigate to="/dashboard/checkins" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;