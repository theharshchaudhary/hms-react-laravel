import { useEffect, useState } from 'react';
import { Users, CalendarDays, Stethoscope, Receipt, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { BarChart, DonutChart, LineChart } from '@/components/dashboard/Chart';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { patientApi, doctorApi, appointmentApi, invoiceApi } from '@/services/api';
import type { Patient, Doctor, Appointment, Invoice } from '@/types';

export function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    Promise.all([patientApi.list(), doctorApi.list(), appointmentApi.list(), invoiceApi.list()])
      .then(([p, d, a, i]) => {
        setPatients(p);
        setDoctors(d);
        setAppointments(a);
        setInvoices(i);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SectionLoader label="Loading dashboard..." />;
  if (error) return <ErrorState message="Failed to load dashboard data" onRetry={() => window.location.reload()} />;

  const todayAppointments = appointments.filter((a) => a.date === '2024-08-30');
  const totalRevenue = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const pendingRevenue = invoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  const admittedPatients = patients.filter((p) => p.status === 'Admitted').length;

  const appointmentStatusData = [
    { label: 'Scheduled', value: appointments.filter((a) => a.status === 'Scheduled').length, color: '#3399ff' },
    { label: 'Confirmed', value: appointments.filter((a) => a.status === 'Confirmed').length, color: '#1463e1' },
    { label: 'Completed', value: appointments.filter((a) => a.status === 'Completed').length, color: '#22c55e' },
    { label: 'Cancelled', value: appointments.filter((a) => a.status === 'Cancelled').length, color: '#ef4444' },
  ];

  const weeklyData = [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 55 },
    { label: 'Wed', value: 48 },
    { label: 'Thu', value: 65 },
    { label: 'Fri', value: 72 },
    { label: 'Sat', value: 38 },
    { label: 'Sun', value: 25 },
  ];

  const revenueData = [
    { label: 'Jan', value: 45 },
    { label: 'Feb', value: 52 },
    { label: 'Mar', value: 48 },
    { label: 'Apr', value: 61 },
    { label: 'May', value: 68 },
    { label: 'Jun', value: 73 },
    { label: 'Jul', value: 65 },
    { label: 'Aug', value: 82 },
  ];

  const roleGreeting = {
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
            <p className="mt-1 text-sm text-primary-100">{roleGreeting[user?.role || 'admin']} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:flex">
            <Activity className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={patients.length} icon={Users} color="primary" trend={{ value: 12, positive: true }} />
        <StatCard label="Today's Appointments" value={todayAppointments.length} icon={CalendarDays} color="secondary" trend={{ value: 8, positive: true }} />
        <StatCard label="Active Doctors" value={doctors.filter((d) => d.availability === 'Available').length} icon={Stethoscope} color="accent" subtitle={`${doctors.length} total`} />
        <StatCard label="Revenue (Paid)" value={`$${totalRevenue.toLocaleString()}`} icon={Receipt} color="success" trend={{ value: 15, positive: true }} />
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
              +18%
            </div>
          </div>
          <div className="mt-6">
            <BarChart data={weeklyData.map((d, i) => ({ ...d, color: i === 4 ? 'bg-secondary-500' : 'bg-primary-400' }))} height={220} />
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
          <p className="text-sm text-gray-500">Monthly revenue (in thousands $)</p>
          <div className="mt-6">
            <LineChart data={revenueData} height={220} />
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
              <span className="text-lg font-bold text-gray-900">{admittedPatients}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600"><Clock className="h-5 w-5" /></div>
                <span className="text-sm text-gray-600">Pending Revenue</span>
              </div>
              <span className="text-lg font-bold text-gray-900">${pendingRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><CalendarDays className="h-5 w-5" /></div>
                <span className="text-sm text-gray-600">Total Appointments</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{appointments.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600"><Receipt className="h-5 w-5" /></div>
                <span className="text-sm text-gray-600">Total Invoices</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{invoices.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Today's Appointments</h3>
          <p className="text-sm text-gray-500">{todayAppointments.length} scheduled for today</p>
        </div>
        <div className="divide-y divide-gray-100">
          {todayAppointments.slice(0, 6).map((apt) => (
            <div key={apt.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50">
              <div className="flex h-10 w-16 flex-col items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <span className="text-xs font-medium">{apt.time.split(':')[0]}:{apt.time.split(':')[1]}</span>
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
          {todayAppointments.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-500">No appointments scheduled for today</div>
          )}
        </div>
      </div>
    </div>
  );
}
