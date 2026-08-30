import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/router/Router';
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview';
import { PatientsPage } from '@/pages/dashboard/PatientsPage';
import { DoctorsPage } from '@/pages/dashboard/DoctorsPage';
import { DepartmentsPage } from '@/pages/dashboard/DepartmentsPage';
import { AppointmentsPage } from '@/pages/dashboard/AppointmentsPage';
import { QueuePage } from '@/pages/dashboard/QueuePage';
import { PrescriptionsPage } from '@/pages/dashboard/PrescriptionsPage';
import { RecordsPage } from '@/pages/dashboard/RecordsPage';
import { BillingPage } from '@/pages/dashboard/BillingPage';
import { ReportsPage } from '@/pages/dashboard/ReportsPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { UsersPage } from '@/pages/dashboard/UsersPage';
import { MessagesPage } from '@/pages/dashboard/MessagesPage';
import type { UserRole } from '@/types';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  doctors: 'Doctors',
  departments: 'Departments',
  appointments: 'Appointments',
  queue: 'Queue Management',
  prescriptions: 'Prescriptions',
  records: 'Medical Records',
  billing: 'Billing & Invoices',
  reports: 'Reports & Analytics',
  messages: 'Messages',
  users: 'User Management',
  settings: 'Settings',
};

const S: UserRole[] = ['super_admin', 'admin', 'doctor', 'receptionist'];

const roleAccess: Record<string, UserRole[]> = {
  dashboard: S,
  patients: S,
  doctors: ['super_admin', 'admin', 'doctor'],
  departments: S,
  appointments: S,
  queue: S,
  prescriptions: ['super_admin', 'admin', 'doctor'],
  records: ['super_admin', 'admin', 'doctor'],
  billing: ['super_admin', 'admin', 'receptionist'],
  reports: ['super_admin', 'admin'],
  messages: ['super_admin', 'admin'],
  users: ['super_admin'],
  settings: S,
};

export function DashboardPage({ activeKey }: { activeKey: string }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const allowed = roleAccess[activeKey]?.includes(user.role);
  const effectiveKey = allowed ? activeKey : 'dashboard';

  const renderPage = () => {
    switch (effectiveKey) {
      case 'dashboard': return <DashboardOverview />;
      case 'patients': return <PatientsPage />;
      case 'doctors': return <DoctorsPage />;
      case 'departments': return <DepartmentsPage />;
      case 'appointments': return <AppointmentsPage />;
      case 'queue': return <QueuePage />;
      case 'prescriptions': return <PrescriptionsPage />;
      case 'records': return <RecordsPage />;
      case 'billing': return <BillingPage />;
      case 'reports': return <ReportsPage />;
      case 'messages': return <MessagesPage />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeKey={effectiveKey} onNavigate={(key) => navigate(`/dashboard/${key === 'dashboard' ? '' : key}`)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <Topbar title={pageTitles[effectiveKey] || 'Dashboard'} onOpenMobile={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
