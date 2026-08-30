import { useState } from 'react';
import {
  HeartPulse, LayoutDashboard, CalendarDays, Pill, FileText, Receipt, UserCircle,
  Menu, X, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/router/Router';
import { Avatar } from '@/components/ui/Avatar';
import { PortalOverview } from '@/pages/portal/PortalOverview';
import { PortalAppointments } from '@/pages/portal/PortalAppointments';
import { PortalPrescriptions } from '@/pages/portal/PortalPrescriptions';
import { PortalRecords } from '@/pages/portal/PortalRecords';
import { PortalBilling } from '@/pages/portal/PortalBilling';
import { PortalProfile } from '@/pages/portal/PortalProfile';

const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'appointments', label: 'Appointments', icon: CalendarDays },
  { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { key: 'records', label: 'Medical Records', icon: FileText },
  { key: 'billing', label: 'Billing', icon: Receipt },
  { key: 'profile', label: 'My Profile', icon: UserCircle },
] as const;

const TITLES: Record<string, string> = {
  overview: 'Overview',
  appointments: 'My Appointments',
  prescriptions: 'My Prescriptions',
  records: 'Medical Records',
  billing: 'Billing & Invoices',
  profile: 'My Profile',
};

export function PortalPage({ activeKey }: { activeKey: string }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const key = NAV.some((n) => n.key === activeKey) ? activeKey : 'overview';

  const go = (k: string) => {
    navigate(`/portal/${k === 'overview' ? '' : k}`);
    setMobileOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const render = () => {
    switch (key) {
      case 'appointments': return <PortalAppointments />;
      case 'prescriptions': return <PortalPrescriptions />;
      case 'records': return <PortalRecords />;
      case 'billing': return <PortalBilling />;
      case 'profile': return <PortalProfile />;
      default: return <PortalOverview onNavigate={go} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <button onClick={() => go('overview')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><HeartPulse className="h-5 w-5" /></div>
            <span className="font-display text-lg font-bold text-gray-900">MediCore</span>
          </button>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <div className="mb-2 px-3"><span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Patient Portal</span></div>
          <div className="space-y-1">
            {NAV.map((item) => {
              const active = key === item.key;
              return (
                <button key={item.key} onClick={() => go(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <item.icon className={`h-5 w-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-gray-200 p-3">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-50">
            <LogOut className="h-5 w-5" />Sign Out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"><Menu className="h-5 w-5" /></button>
            <h1 className="font-display text-lg font-bold text-gray-900 sm:text-xl">{TITLES[key]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar name={user.name} avatar={user.avatar} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">Patient</p>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-fade-in">{render()}</div>
        </main>
      </div>
    </div>
  );
}
