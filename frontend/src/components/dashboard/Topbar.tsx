import { useState } from 'react';
import { Menu, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { navigate } from '@/router/Router';
import { setPatientSearch } from '@/lib/handoff';

interface TopbarProps {
  title: string;
  onOpenMobile: () => void;
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  patient: 'Patient',
};

export function Topbar({ title, onOpenMobile }: TopbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  if (!user) return null;

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setPatientSearch(query.trim());
    navigate('/dashboard/patients');
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-gray-900 sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <form onSubmit={runSearch} className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients..."
            className="w-48 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 lg:w-64"
          />
        </form>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <Avatar name={user.name} avatar={user.avatar} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-elevated animate-scale-in">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Profile Settings
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-600 transition-colors hover:bg-error-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
