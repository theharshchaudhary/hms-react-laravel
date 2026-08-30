import { useEffect, useState } from 'react';
import { CalendarDays, Pill, FileText, Wallet, ArrowRight, UserCircle, X } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { portalApi, type PortalDashboard } from '@/services/api';

export function PortalOverview({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<PortalDashboard | null>(null);

  const [profileDismissed, setProfileDismissed] = useState(() => {
    try { return localStorage.getItem('medicore_profile_nudge_dismissed') === '1'; } catch { return false; }
  });

  const load = () => {
    setLoading(true);
    setError(false);
    portalApi.dashboard().then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return <SectionLoader label="Loading your dashboard..." />;
  if (error || !data) return <ErrorState message="Could not load your portal" onRetry={load} />;

  const profileIncomplete = !data.patient.age || !data.patient.bloodGroup || !data.patient.emergencyContact;
  const dismissNudge = () => {
    setProfileDismissed(true);
    try { localStorage.setItem('medicore_profile_nudge_dismissed', '1'); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white shadow-card">
        <h2 className="font-display text-xl font-bold">Hello, {user?.name?.split(' ')[0]}</h2>
        <p className="mt-1 text-sm text-primary-100">
          Patient ID {data.patient.patientCode} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {profileIncomplete && !profileDismissed && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <div className="flex items-start gap-3">
            <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-primary-900">Complete your profile</p>
              <p className="text-sm text-primary-700">Add your age, blood group and emergency contact so our team has what they need.
                <button onClick={() => onNavigate('profile')} className="ml-1 font-semibold underline">Update now</button>
              </p>
            </div>
          </div>
          <button onClick={dismissNudge} className="rounded p-1 text-primary-400 hover:bg-primary-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Appointments" value={data.stats.upcomingAppointments} icon={CalendarDays} color="primary" />
        <StatCard label="Active Prescriptions" value={data.stats.activePrescriptions} icon={Pill} color="secondary" />
        <StatCard label="Medical Records" value={data.stats.medicalRecords} icon={FileText} color="accent" />
        <StatCard label="Outstanding Balance" value={`$${data.stats.outstandingBalance.toLocaleString()}`} icon={Wallet} color={data.stats.outstandingBalance > 0 ? 'warning' : 'success'} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Upcoming Appointments</h3>
            <p className="text-sm text-gray-500">{data.upcomingAppointments.length} scheduled</p>
          </div>
          <button onClick={() => onNavigate('appointments')} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
            Manage <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {data.upcomingAppointments.map((apt) => (
            <div key={apt.id} className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex h-12 w-16 flex-col items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <span className="text-[10px] font-medium uppercase">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                <span className="text-sm font-bold">{new Date(apt.date).getDate()}</span>
              </div>
              <Avatar name={apt.doctorName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{apt.doctorName}</p>
                <p className="truncate text-xs text-gray-500">{apt.department} · {apt.time} · {apt.type}</p>
              </div>
              <AppointmentStatusBadge status={apt.status} />
            </div>
          ))}
          {data.upcomingAppointments.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              No upcoming appointments.{' '}
              <button onClick={() => onNavigate('appointments')} className="font-medium text-primary-600 hover:underline">Book one</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
