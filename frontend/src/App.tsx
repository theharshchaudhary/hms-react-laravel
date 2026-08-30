import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useHashRoute, navigate, homePathForRole } from '@/router/Router';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PortalPage } from '@/pages/PortalPage';

function AppRoutes() {
  const { route } = useHashRoute();
  const { user, bootstrapping } = useAuth();

  const parts = route.split('/').filter(Boolean);
  const root = parts[0] || '';

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (root === 'login') {
    if (user) { navigate(homePathForRole(user.role)); return null; }
    return <LoginPage />;
  }

  if (root === 'register') {
    if (user) { navigate(homePathForRole(user.role)); return null; }
    return <RegisterPage />;
  }

  if (root === 'dashboard') {
    if (!user) { navigate('/login'); return null; }
    if (user.role === 'patient') { navigate('/portal'); return null; }
    const activeKey = parts[1] || 'dashboard';
    return <DashboardPage activeKey={activeKey} />;
  }

  if (root === 'portal') {
    if (!user) { navigate('/login'); return null; }
    if (user.role !== 'patient') { navigate('/dashboard'); return null; }
    const activeKey = parts[1] || 'overview';
    return <PortalPage activeKey={activeKey} />;
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
