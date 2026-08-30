import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, Clock, User, Stethoscope, Filter } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { appointmentApi, patientApi, doctorApi } from '@/services/api';
import type { Appointment, Patient, Doctor, AppointmentStatus, AppointmentType } from '@/types';

const emptyForm: Omit<Appointment, 'id'> = {
  patientId: '', patientName: '', doctorId: '', doctorName: '', department: '',
  date: new Date().toISOString().split('T')[0], time: '09:00', type: 'Consultation',
  status: 'Scheduled', reason: '',
};

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Appointment, 'id'>>(emptyForm);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([appointmentApi.list(), patientApi.list(), doctorApi.list()])
      .then(([a, p, d]) => { setAppointments(a); setPatients(p); setDoctors(d); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = appointments
    .filter((a) => a.patientName.toLowerCase().includes(search.toLowerCase()) || a.doctorName.toLowerCase().includes(search.toLowerCase()) || a.department.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .sort((a, b) => { const dir = sortDir === 'asc' ? 1 : -1; return String(a[sortBy as keyof Appointment]).localeCompare(String(b[sortBy as keyof Appointment])) * dir; });

  const pageSize = 8;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => { if (sortBy === key) { setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); } else { setSortBy(key); setSortDir('asc'); } };

  const handleSave = async () => {
    const patient = patients.find((p) => p.id === form.patientId);
    const doctor = doctors.find((d) => d.id === form.doctorId);
    const saveForm = { ...form, patientName: patient?.name || '', doctorName: doctor?.name || '', department: doctor?.department || '' };
    await appointmentApi.create(saveForm);
    setModalOpen(false); setForm(emptyForm); load();
  };

  const updateStatus = async (apt: Appointment, status: AppointmentStatus) => {
    await appointmentApi.update(apt.id, { status });
    load();
  };

  const columns: Column<Appointment>[] = [
    { key: 'date', header: 'Date & Time', sortable: true, render: (a) => (
      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /><div><p className="text-sm font-medium text-gray-900">{a.date}</p><p className="text-xs text-gray-500">{a.time}</p></div></div>
    )},
    { key: 'patientName', header: 'Patient', sortable: true, render: (a) => (
      <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span className="font-medium text-gray-900">{a.patientName}</span></div>
    )},
    { key: 'doctorName', header: 'Doctor', sortable: true, render: (a) => (
      <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-gray-400" /><span className="text-gray-700">{a.doctorName}</span></div>
    )},
    { key: 'department', header: 'Department', sortable: true },
    { key: 'type', header: 'Type', render: (a) => <Badge variant="info">{a.type}</Badge> },
    { key: 'status', header: 'Status', sortable: true, render: (a) => <AppointmentStatusBadge status={a.status} /> },
    { key: 'actions', header: 'Actions', align: 'right', render: (a) => (
      <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-500 focus:outline-none" value={a.status} onChange={(e) => updateStatus(a, e.target.value as AppointmentStatus)}>
        {(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'] as AppointmentStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={appointments.length} icon={CalendarDays} color="primary" />
        <StatCard label="Today" value={appointments.filter((a) => a.date === '2024-08-30').length} icon={Clock} color="secondary" />
        <StatCard label="Completed" value={appointments.filter((a) => a.status === 'Completed').length} icon={CalendarDays} color="success" />
        <StatCard label="Cancelled" value={appointments.filter((a) => a.status === 'Cancelled').length} icon={CalendarDays} color="error" />
      </div>

      {error ? <ErrorState message="Failed to load appointments" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(a) => a.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by patient, doctor, or department..."
          sortBy={sortBy} sortDir={sortDir} onSort={handleSort}
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          actions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select className="rounded-lg border border-gray-200 py-2 pl-9 pr-8 text-sm text-gray-600 focus:border-primary-500 focus:outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                  <option value="all">All Status</option>
                  {(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'] as AppointmentStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" />New Appointment</button>
            </div>
          }
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Appointment" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>Schedule</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select className="input-field" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>)}
            </select>
          </Field>
          <Field label="Doctor">
            <select className="input-field" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
            </select>
          </Field>
          <Field label="Date"><input className="input-field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time"><input className="input-field" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Type">
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AppointmentType })}>
              {(['Consultation', 'Follow-up', 'Emergency', 'Check-up', 'Surgery'] as AppointmentType[]).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}>
              {(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'] as AppointmentStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Reason"><input className="input-field" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for visit" /></Field></div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
