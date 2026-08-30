import { useEffect, useState } from 'react';
import { Users, CalendarDays, Stethoscope, Receipt, Activity, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { BarChart, DonutChart, LineChart } from '@/components/dashboard/Chart';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi, type DashboardOverview as Overview } from '@/services/api';

const STATUS_COLORS: Record<string, string> = {
  Scheduled: '#3399ff',
  Confirmed: '#1463e1',
  'In Progress': '#f59e0b',
  Completed: '#22c55e',
  Cancelled: '#ef4444',
  'No Show': '#94a3b8',
};

export function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<Overview | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    analyticsApi.dashboard()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <SectionLoader label="Loading dashboard..." />;
  if (error || !data) return <ErrorState message="Failed to load dashboard data" onRetry={load} />;

  const appointmentStatusData = data.appointmentStatus.map((s) => ({
    ...s,
    color: STATUS_COLORS[s.label] || '#3399ff',
  }));

  const roleGreeting: Record<string, string> = {
    super_admin: 'Super Admin Console',
    admin: 'Administrator Dashboard',
    doctor: 'Doctor Dashboard',
    receptionist: 'Reception Desk',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Welcome back, {user?.name}</h2>
            <p className="mt-1 text-sm text-primary-100">{roleGreeting[user?.role || 'admin'] || 'Dashboard'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:flex">
            <Activity className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={data.scopedToDoctor ? 'My Patients' : 'Total Patients'} value={data.totalPatients} icon={Users} color="primary" />
        <StatCard label={data.scopedToDoctor ? 'My Appointments Today' : "Today's Appointments"} value={data.todayAppointments} icon={CalendarDays} color="secondary" />
        {data.scopedToDoctor
          ? <StatCard label="Refill Requests" value={data.pendingRefills} icon={RefreshCw} color={data.pendingRefills ? 'warning' : 'success'} />
          : <StatCard label="Active Doctors" value={data.activeDoctors} icon={Stethoscope} color="accent" subtitle={`${data.totalDoctors} total`} />}
        {data.scopedToDoctor
          ? <StatCard label="Total Appointments" value={data.totalAppointments} icon={CalendarDays} color="success" />
          : <StatCard label="Revenue (Paid)" value={`$${data.totalRevenue.toLocaleString()}`} icon={Receipt} color="success" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Weekly Appointments</h3>
              <p className="text-sm text-gray-500">Appointments scheduled this week</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-sm font-medium text-success-600">
              <TrendingUp className="h-4 w-4" />
              Live
            </div>
          </div>
          <div className="mt-6">
            <BarChart data={data.weeklyAppointments.map((d, i) => ({ ...d, color: i === new Date().getDay() - 1 ? 'bg-secondary-500' : 'bg-primary-400' }))} height={220} />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Appointment Status</h3>
          <p className="text-sm text-gray-500">Current distribution</p>
          <div className="mt-6 flex justify-center">
            <DonutChart data={appointmentStatusData} size={150} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900">Revenue Trend</h3>
          <p className="text-sm text-gray-500">Monthly revenue (in $)</p>
          <div className="mt-6">
            <LineChart data={data.monthlyRevenue} height={220} />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Quick Stats</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-50 text-error-600"><AlertCircle className="h-5 w-5" /></div>
                <span className="text-sm text-gray-600">Admitted Patients</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{data.admittedPatients}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600"><Clock className="h-5 w-5" /></div>
                <span className="text-sm text-gray-600">Pending Revenue</span>
              </div>
              <span className="text-lg font-bold text-gray-900">${data.pendingRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><CalendarDays className="h-5 w-5" /></div>
                <span className="text-sm text-gray-600">Total Appointments</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{data.totalAppointments}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600"><Receipt className="h-5 w-5" /></div>
                <span className="text-sm text-gray-600">Total Invoices</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{data.totalInvoices}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Today's Appointments</h3>
          <p className="text-sm text-gray-500">{data.todaysAppointmentsList.length} scheduled for today</p>
        </div>
        <div className="divide-y divide-gray-100">
          {data.todaysAppointmentsList.slice(0, 6).map((apt) => (
            <div key={apt.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50">
              <div className="flex h-10 w-16 flex-col items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <span className="text-xs font-medium">{apt.time}</span>
              </div>
              <Avatar name={apt.patientName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{apt.patientName}</p>
                <p className="truncate text-xs text-gray-500">{apt.doctorName} · {apt.department}</p>
              </div>
              <span className="hidden text-xs text-gray-500 sm:block">{apt.type}</span>
              <AppointmentStatusBadge status={apt.status} />
            </div>
          ))}
          {data.todaysAppointmentsList.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-500">No appointments scheduled for today</div>
          )}
        </div>
      </div>
    </div>
  );
}
