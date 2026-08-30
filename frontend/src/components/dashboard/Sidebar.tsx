import {
  LayoutDashboard, Users, Stethoscope, Building2, CalendarDays,
  ListOrdered, Pill, FileText, Receipt, BarChart3, Settings,
  HeartPulse, X, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { navigate } from '@/router/Router';

interface NavItem {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist'] },
  { key: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'doctor', 'receptionist'] },
  { key: 'doctors', label: 'Doctors', icon: Stethoscope, roles: ['admin', 'doctor'] },
  { key: 'departments', label: 'Departments', icon: Building2, roles: ['admin', 'doctor', 'receptionist'] },
  { key: 'appointments', label: 'Appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'receptionist'] },
  { key: 'queue', label: 'Queue Management', icon: ListOrdered, roles: ['admin', 'doctor', 'receptionist'] },
  { key: 'prescriptions', label: 'Prescriptions', icon: Pill, roles: ['admin', 'doctor'] },
  { key: 'records', label: 'Medical Records', icon: FileText, roles: ['admin', 'doctor'] },
  { key: 'billing', label: 'Billing', icon: Receipt, roles: ['admin', 'receptionist'] },
  { key: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { key: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'doctor', 'receptionist'] },
];

interface SidebarProps {
  activeKey: string;
  onNavigate: (key: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ activeKey, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  const handleNav = (key: string) => {
    onNavigate(key);
    onCloseMobile();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <button onClick={() => handleNav('dashboard')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold text-gray-900">MediCore</span>
          </button>
          <button onClick={onCloseMobile} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <div className="mb-2 px-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Menu</span>
          </div>
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-50"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
