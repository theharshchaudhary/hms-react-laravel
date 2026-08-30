import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, Clock, User, Stethoscope, Filter, Pencil, Trash2, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { appointmentApi, patientApi, doctorApi, ApiError } from '@/services/api';
import { navigate } from '@/router/Router';
import { setInvoiceHandoff, CONSULT_PRICES } from '@/lib/handoff';
import type { Appointment, Patient, Doctor, AppointmentStatus, AppointmentType } from '@/types';

const STATUSES: AppointmentStatus[] = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
const TYPES: AppointmentType[] = ['Consultation', 'Follow-up', 'Emergency', 'Check-up', 'Surgery'];
const today = () => new Date().toISOString().split('T')[0];

interface FormState {
  patientId: string; doctorId: string; date: string; time: string;
  type: AppointmentType; status: AppointmentStatus; reason: string;
}
const emptyForm: FormState = { patientId: '', doctorId: '', date: today(), time: '09:00', type: 'Consultation', status: 'Scheduled', reason: '' };

export function AppointmentsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const canInvoice = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'receptionist';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [invoicePrompt, setInvoicePrompt] = useState<Appointment | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([appointmentApi.list(), patientApi.list(), doctorApi.list()])
      .then(([a, p, d]) => { setAppointments(a); setPatients(p); setDoctors(d); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = appointments
    .filter((a) => [a.patientName, a.doctorName, a.department].join(' ').toLowerCase().includes(search.toLowerCase()))
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .sort((a, b) => { const dir = sortDir === 'asc' ? 1 : -1; return String(a[sortBy as keyof Appointment]).localeCompare(String(b[sortBy as keyof Appointment])) * dir; });
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => { if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDir('asc'); } };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };
  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({ patientId: a.patientId, doctorId: a.doctorId, date: a.date, time: a.time, type: a.type, status: a.status, reason: a.reason });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true); setFormError(null);
    try {
      if (editing) await appointmentApi.update(editing.id, form);
      else await appointmentApi.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (apt: Appointment, status: AppointmentStatus) => {
    setBusy(apt.id);
    try {
      await appointmentApi.update(apt.id, { status });
      if (status === 'Completed' && apt.status !== 'Completed' && canInvoice) setInvoicePrompt({ ...apt, status });
      load();
    } finally { setBusy(null); }
  };

  const checkIn = async (apt: Appointment) => {
    setBusy(apt.id);
    try { await appointmentApi.checkIn(apt.id); load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Check-in failed'); }
    finally { setBusy(null); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await appointmentApi.remove(deleteTarget.id);
    load();
  };

  const goInvoice = () => {
    if (!invoicePrompt) return;
    setInvoiceHandoff({
      patientId: invoicePrompt.patientId,
      patientName: invoicePrompt.patientName,
      lineDescription: `${invoicePrompt.type} — ${invoicePrompt.department}`,
      unitPrice: CONSULT_PRICES[invoicePrompt.type] ?? 150,
    });
    setInvoicePrompt(null);
    navigate('/dashboard/billing');
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
    { key: 'status', header: 'Status', sortable: true, render: (a) => (
      <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-primary-500 focus:outline-none" value={a.status}
        disabled={busy === a.id} onChange={(e) => updateStatus(a, e.target.value as AppointmentStatus)}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    )},
    { key: 'actions', header: '', align: 'right', render: (a) => (
      <div className="flex items-center justify-end gap-1">
        {a.date === today() && ['Scheduled', 'Confirmed'].includes(a.status) && (
          <button onClick={() => checkIn(a)} disabled={busy === a.id} title="Check in to queue"
            className="rounded-lg bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100">
            {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="mr-1 inline h-3.5 w-3.5" />}Check in
          </button>
        )}
        <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-secondary-600"><Pencil className="h-4 w-4" /></button>
        {!isDoctor && <button onClick={() => setDeleteTarget(a)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={isDoctor ? 'My Total' : 'Total'} value={appointments.length} icon={CalendarDays} color="primary" />
        <StatCard label="Today" value={appointments.filter((a) => a.date === today()).length} icon={Clock} color="secondary" />
        <StatCard label="Completed" value={appointments.filter((a) => a.status === 'Completed').length} icon={CalendarDays} color="success" />
        <StatCard label="Cancelled" value={appointments.filter((a) => a.status === 'Cancelled').length} icon={CalendarDays} color="error" />
      </div>

      {isDoctor && <p className="text-sm text-gray-500">Showing appointments assigned to you.</p>}

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
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />New Appointment</button>
            </div>
          }
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Appointment' : 'New Appointment'} size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save' : 'Schedule'}</button>
        </>}>
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
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization}{d.availability === 'On Leave' ? ' (on leave)' : ''}</option>)}
            </select>
          </Field>
          <Field label="Date"><input className="input-field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time"><input className="input-field" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Type">
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AppointmentType })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Reason"><input className="input-field" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for visit" /></Field></div>
        </div>
        {formError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{formError}</div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete}
        title="Delete Appointment" message={`Delete the ${deleteTarget?.type} for ${deleteTarget?.patientName}?`} confirmLabel="Delete" danger />

      <ConfirmDialog open={!!invoicePrompt} onClose={() => setInvoicePrompt(null)} onConfirm={goInvoice}
        title="Consultation completed" confirmLabel="Create invoice"
        message={`Create an invoice for ${invoicePrompt?.patientName}'s visit?`} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
