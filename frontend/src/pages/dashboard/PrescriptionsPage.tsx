import { useEffect, useState, useCallback } from 'react';
import { Pill, Eye, Plus, Pencil, RefreshCw, Check, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { prescriptionApi, patientApi, doctorApi, ApiError } from '@/services/api';
import type { Prescription, Patient, Doctor } from '@/types';

type Med = { name: string; dosage: string; duration: string; instructions: string };
const emptyMed: Med = { name: '', dosage: '', duration: '', instructions: '' };

interface FormState {
  patientId: string;
  doctorId: string;
  diagnosis: string;
  status: Prescription['status'];
  notes: string;
  medications: Med[];
}
const emptyForm: FormState = { patientId: '', doctorId: '', diagnosis: '', status: 'Active', notes: '', medications: [{ ...emptyMed }] };

export function PrescriptionsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [refillOnly, setRefillOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [viewTarget, setViewTarget] = useState<Prescription | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([prescriptionApi.list(), patientApi.list(), doctorApi.list()])
      .then(([rx, p, d]) => { setPrescriptions(rx); setPatients(p); setDoctors(d); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = prescriptions
    .filter((p) => !refillOnly || p.refillRequested)
    .filter((p) => [p.patientName, p.doctorName, p.diagnosis].join(' ').toLowerCase().includes(search.toLowerCase()));
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const refillCount = prescriptions.filter((p) => p.refillRequested).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, doctorId: isDoctor ? (user?.doctorId || '') : '', medications: [{ ...emptyMed }] });
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (p: Prescription) => {
    setEditing(p);
    setForm({
      patientId: p.patientId,
      doctorId: doctors.find((d) => d.name === p.doctorName)?.id || '',
      diagnosis: p.diagnosis,
      status: p.status,
      notes: p.notes || '',
      medications: p.medications.length ? p.medications.map((m) => ({ ...m })) : [{ ...emptyMed }],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const setMed = (i: number, patch: Partial<Med>) =>
    setForm((f) => ({ ...f, medications: f.medications.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) }));

  const save = async () => {
    setSaving(true); setFormError(null);
    const payload = {
      patientId: form.patientId,
      doctorId: form.doctorId || undefined,
      diagnosis: form.diagnosis,
      status: form.status,
      notes: form.notes || undefined,
      medications: form.medications.filter((m) => m.name.trim()),
    };
    try {
      if (editing) await prescriptionApi.update(editing.id, payload);
      else await prescriptionApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const markFilled = async (p: Prescription) => {
    setBusy(p.id);
    try {
      const updated = await prescriptionApi.update(p.id, { refillRequested: false });
      setPrescriptions((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } finally { setBusy(null); }
  };

  const columns: Column<Prescription>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (p) => <span className="text-sm text-gray-600">{p.date}</span> },
    { key: 'patientName', header: 'Patient', sortable: true, render: (p) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{p.patientName}</span>
        {p.refillRequested && <Badge variant="warning" dot>Refill</Badge>}
      </div>
    )},
    { key: 'doctorName', header: 'Prescribed By', sortable: true },
    { key: 'diagnosis', header: 'Diagnosis', render: (p) => <span className="text-gray-700">{p.diagnosis}</span> },
    { key: 'medications', header: 'Meds', render: (p) => <Badge variant="info">{p.medications.length}</Badge> },
    { key: 'status', header: 'Status', sortable: true, render: (p) => <Badge variant={p.status === 'Active' ? 'success' : p.status === 'Completed' ? 'neutral' : 'warning'} dot>{p.status}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => (
      <div className="flex items-center justify-end gap-1">
        {p.refillRequested && (
          <button onClick={(e) => { e.stopPropagation(); markFilled(p); }} disabled={busy === p.id}
            className="rounded-lg bg-success-50 px-2 py-1 text-xs font-medium text-success-700 transition-colors hover:bg-success-100">
            {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 inline h-3.5 w-3.5" />}Filled
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); setViewTarget(p); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-secondary-600"><Pencil className="h-4 w-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={prescriptions.length} icon={Pill} color="primary" />
        <StatCard label="Active" value={prescriptions.filter((p) => p.status === 'Active').length} icon={Pill} color="success" />
        <StatCard label="Completed" value={prescriptions.filter((p) => p.status === 'Completed').length} icon={Pill} color="secondary" />
        <StatCard label="Refill Requests" value={refillCount} icon={RefreshCw} color={refillCount ? 'warning' : 'success'} />
      </div>

      {isDoctor && <p className="text-sm text-gray-500">Showing prescriptions you authored.</p>}

      {error ? <ErrorState message="Failed to load prescriptions" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(p) => p.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by patient, doctor, or diagnosis..."
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          onRowClick={(p) => setViewTarget(p)}
          actions={
            <div className="flex items-center gap-2">
              <button onClick={() => { setRefillOnly((v) => !v); setPage(1); }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${refillOnly ? 'border-warning-300 bg-warning-50 text-warning-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <RefreshCw className="mr-1.5 inline h-4 w-4" />Refill requests{refillCount ? ` (${refillCount})` : ''}
              </button>
              <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />New Prescription</button>
            </div>
          }
        />
      )}

      {/* View */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Prescription Details" size="lg">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div><p className="text-lg font-bold text-gray-900">{viewTarget.patientName}</p><p className="text-sm text-gray-500">Prescribed by {viewTarget.doctorName}</p></div>
              <div className="text-right"><p className="text-sm text-gray-500">{viewTarget.date}</p><Badge variant={viewTarget.status === 'Active' ? 'success' : viewTarget.status === 'Completed' ? 'neutral' : 'warning'} dot>{viewTarget.status}</Badge></div>
            </div>
            {viewTarget.refillRequested && (
              <div className="flex items-center justify-between rounded-lg bg-warning-50 px-4 py-3">
                <span className="text-sm font-medium text-warning-700"><RefreshCw className="mr-1.5 inline h-4 w-4" />Refill requested by the patient</span>
                <button className="btn-secondary text-xs" onClick={() => { markFilled(viewTarget); setViewTarget(null); }}>Mark filled</button>
              </div>
            )}
            <div className="rounded-lg border border-gray-200 bg-primary-50 px-4 py-3"><p className="text-sm font-medium text-primary-700">Diagnosis: {viewTarget.diagnosis}</p></div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Medications</h4>
              <div className="mt-3 space-y-3">
                {viewTarget.medications.map((med, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-900">{med.name}</p><Badge variant="info">{med.dosage}</Badge></div>
                    <p className="mt-1 text-xs text-gray-500">Duration: {med.duration}</p>
                    <p className="mt-1 text-sm text-gray-600">{med.instructions}</p>
                  </div>
                ))}
              </div>
            </div>
            {viewTarget.notes && <div className="rounded-lg bg-warning-50 p-3"><p className="text-sm text-warning-700"><span className="font-semibold">Notes:</span> {viewTarget.notes}</p></div>}
          </div>
        )}
      </Modal>

      {/* Create / Edit */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Prescription' : 'New Prescription'} size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save' : 'Create'}</button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select className="input-field" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>)}
            </select>
          </Field>
          {!isDoctor && (
            <Field label="Prescriber">
              <select className="input-field" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                <option value="">Select doctor</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
              </select>
            </Field>
          )}
          <Field label="Diagnosis"><input className="input-field" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></Field>
          <Field label="Status">
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Prescription['status'] })}>
              <option>Active</option><option>Completed</option><option>Expired</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Medications</label>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700" onClick={() => setForm((f) => ({ ...f, medications: [...f.medications, { ...emptyMed }] }))}>
              <Plus className="mr-1 inline h-3.5 w-3.5" />Add medication
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {form.medications.map((m, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="input-field" placeholder="Name" value={m.name} onChange={(e) => setMed(i, { name: e.target.value })} />
                  <input className="input-field" placeholder="Dosage (e.g. 10mg)" value={m.dosage} onChange={(e) => setMed(i, { dosage: e.target.value })} />
                  <input className="input-field" placeholder="Duration (e.g. 30 days)" value={m.duration} onChange={(e) => setMed(i, { duration: e.target.value })} />
                  <input className="input-field" placeholder="Instructions" value={m.instructions} onChange={(e) => setMed(i, { instructions: e.target.value })} />
                </div>
                {form.medications.length > 1 && (
                  <button className="mt-2 text-xs text-error-600 hover:underline" onClick={() => setForm((f) => ({ ...f, medications: f.medications.filter((_, idx) => idx !== i) }))}>
                    <Trash2 className="mr-1 inline h-3 w-3" />Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Field label="Notes (optional)"><textarea className="input-field resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>

        {formError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{formError}</div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
