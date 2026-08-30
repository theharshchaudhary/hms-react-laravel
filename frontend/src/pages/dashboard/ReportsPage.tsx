import { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp, CalendarDays, Receipt, Stethoscope, Activity, Users } from 'lucide-react';
import { BarChart, DonutChart, LineChart } from '@/components/dashboard/Chart';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { analyticsApi, type ReportsSummary } from '@/services/api';

const STATUS_COLORS: Record<string, string> = {
  Completed: '#22c55e', Scheduled: '#3399ff', Confirmed: '#1463e1',
  Cancelled: '#ef4444', 'In Progress': '#f59e0b', 'No Show': '#94a3b8',
};

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<ReportsSummary | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    analyticsApi.reports().then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <SectionLoader label="Loading reports..." />;
  if (error || !data) return <ErrorState message="Failed to load reports" onRetry={load} />;

  const statusData = data.appointmentStatus.map((s) => ({ ...s, color: STATUS_COLORS[s.label] || '#3399ff' }));

  const reportCards = [
    { title: 'Patient Demographics Report', desc: 'Age, gender, and blood group distribution', icon: Users, colorClass: 'bg-primary-50 text-primary-600' },
    { title: 'Appointment Analytics', desc: 'Booking trends and no-show analysis', icon: CalendarDays, colorClass: 'bg-secondary-50 text-secondary-600' },
    { title: 'Revenue Report', desc: 'Monthly revenue and outstanding balances', icon: Receipt, colorClass: 'bg-success-50 text-success-600' },
    { title: 'Doctor Performance', desc: 'Patient ratings and consultation metrics', icon: Stethoscope, colorClass: 'bg-accent-50 text-accent-600' },
    { title: 'Department Utilization', desc: 'Bed occupancy and resource allocation', icon: Activity, colorClass: 'bg-warning-50 text-warning-600' },
    { title: 'Prescription Trends', desc: 'Medication patterns and frequency', icon: BarChart3, colorClass: 'bg-error-50 text-error-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="success" />
        <StatCard label="Appointments" value={data.totalAppointments} icon={CalendarDays} color="primary" />
        <StatCard label="Departments" value={data.totalDepartments} icon={Activity} color="secondary" />
        <StatCard label="Avg Rating" value={data.avgDoctorRating.toFixed(1)} icon={Stethoscope} color="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between"><div><h3 className="text-base font-semibold text-gray-900">Revenue Trend</h3><p className="text-sm text-gray-500">Monthly revenue ($)</p></div><TrendingUp className="h-5 w-5 text-success-500" /></div>
          <div className="mt-6"><LineChart data={data.monthlyRevenue} height={220} /></div>
        </div>
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Weekly Appointments</h3><p className="text-sm text-gray-500">Daily appointment count</p>
          <div className="mt-6"><BarChart data={data.weeklyAppointments.map((d, i) => ({ ...d, color: i === 4 ? 'bg-secondary-500' : 'bg-primary-400' }))} height={220} /></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Doctors per Department</h3><p className="text-sm text-gray-500">Staff distribution</p>
          <div className="mt-6"><BarChart data={data.doctorsPerDepartment.map((d) => ({ ...d, color: 'bg-secondary-400' }))} height={220} /></div>
        </div>
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Appointment Status</h3><p className="text-sm text-gray-500">Distribution breakdown</p>
          <div className="mt-6 flex justify-center"><DonutChart data={statusData} size={160} /></div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900">Available Reports</h3>
        <p className="text-sm text-gray-500">Download detailed reports for analysis</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((report, i) => (
            <div key={i} className="group flex flex-col rounded-xl border border-gray-200 p-4 transition-all hover:border-primary-300 hover:shadow-soft">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${report.colorClass}`}><report.icon className="h-5 w-5" /></div>
                <div className="min-w-0"><p className="text-sm font-semibold text-gray-900">{report.title}</p><p className="text-xs text-gray-500">{report.desc}</p></div>
              </div>
              <button className="btn-secondary mt-4 w-full text-xs"><Download className="h-3.5 w-3.5" />Download PDF</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
