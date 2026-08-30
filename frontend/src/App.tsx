import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useHashRoute, navigate } from '@/router/Router';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';

function AppRoutes() {
  const { route } = useHashRoute();
  const { user } = useAuth();

  const parts = route.split('/').filter(Boolean);
  const root = parts[0] || '';

  if (root === 'login') {
    if (user) { navigate('/dashboard'); return null; }
    return <LoginPage />;
  }

  if (root === 'register') {
    if (user) { navigate('/dashboard'); return null; }
    return <RegisterPage />;
  }

  if (root === 'dashboard') {
    if (!user) { navigate('/login'); return null; }
    const activeKey = parts[1] || 'dashboard';
    return <DashboardPage activeKey={activeKey} />;
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
