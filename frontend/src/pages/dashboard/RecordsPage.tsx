import { useEffect, useState, useCallback } from 'react';
import { FileText, Filter, FileImage, FlaskConical, Activity, Stethoscope, HeartPulse, Plus, Loader2, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { recordApi, patientApi, doctorApi, ApiError } from '@/services/api';
import type { MedicalRecord, Patient, Doctor } from '@/types';

const typeIcons: Record<string, typeof FileText> = {
  'Lab Report': FlaskConical, 'Diagnosis': Stethoscope, 'Treatment': Activity, 'Imaging': FileImage, 'Vitals': HeartPulse,
};
const TYPES = ['Lab Report', 'Diagnosis', 'Treatment', 'Imaging', 'Vitals'] as const;

const emptyForm = {
  patientId: '', doctorId: '', type: 'Diagnosis' as MedicalRecord['type'],
  title: '', description: '', attachments: 0, status: 'Normal' as MedicalRecord['status'],
};

export function RecordsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<MedicalRecord | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([recordApi.list(), patientApi.list(), doctorApi.list()])
      .then(([r, p, d]) => { setRecords(r); setPatients(p); setDoctors(d); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = records
    .filter((r) => [r.patientName, r.title, r.doctorName].join(' ').toLowerCase().includes(search.toLowerCase()))
    .filter((r) => typeFilter === 'all' || r.type === typeFilter);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setForm({ ...emptyForm, doctorId: isDoctor ? (user?.doctorId || '') : '' });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true); setFormError(null);
    try {
      await recordApi.create({
        patientId: form.patientId,
        doctorId: form.doctorId || undefined,
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        attachments: form.attachments || 0,
        status: form.status,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<MedicalRecord>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (r) => <span className="text-sm text-gray-600">{r.date}</span> },
    { key: 'type', header: 'Type', sortable: true, render: (r) => {
      const Icon = typeIcons[r.type] || FileText;
      return <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary-500" /><span className="text-sm text-gray-700">{r.type}</span></div>;
    }},
    { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="font-medium text-gray-900">{r.title}</span> },
    { key: 'patientName', header: 'Patient', sortable: true },
    { key: 'doctorName', header: 'Doctor', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge variant={r.status === 'Critical' ? 'error' : r.status === 'Under Observation' ? 'warning' : 'success'} dot>{r.status}</Badge> },
    { key: 'attachments', header: 'Files', render: (r) => r.attachments ? <Badge variant="neutral">{r.attachments} file{r.attachments > 1 ? 's' : ''}</Badge> : <span className="text-xs text-gray-400">—</span> },
    { key: 'actions', header: '', align: 'right', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); setViewTarget(r); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><FileText className="h-4 w-4" /></button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Records" value={records.length} icon={FileText} color="primary" />
        <StatCard label="Critical" value={records.filter((r) => r.status === 'Critical').length} icon={HeartPulse} color="error" />
        <StatCard label="Observation" value={records.filter((r) => r.status === 'Under Observation').length} icon={Activity} color="warning" />
        <StatCard label="Normal" value={records.filter((r) => r.status === 'Normal').length} icon={FileText} color="success" />
      </div>

      {isDoctor && <p className="text-sm text-gray-500">Showing records you authored.</p>}

      {error ? <ErrorState message="Failed to load records" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(r) => r.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by patient, title, or doctor..."
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          onRowClick={(r) => setViewTarget(r)}
          actions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select className="rounded-lg border border-gray-200 py-2 pl-9 pr-8 text-sm text-gray-600 focus:border-primary-500 focus:outline-none" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                  <option value="all">All Types</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Record</button>
            </div>
          }
        />
      )}

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Medical Record" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div><p className="text-lg font-bold text-gray-900">{viewTarget.title}</p><p className="text-sm text-gray-500">{viewTarget.patientName} · {viewTarget.date}</p></div>
              <Badge variant={viewTarget.status === 'Critical' ? 'error' : viewTarget.status === 'Under Observation' ? 'warning' : 'success'} dot>{viewTarget.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs font-medium text-gray-500">Type</p><p className="mt-0.5 text-gray-900">{viewTarget.type}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Doctor</p><p className="mt-0.5 text-gray-900">{viewTarget.doctorName}</p></div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4"><p className="text-sm text-gray-600">{viewTarget.description}</p></div>
            {viewTarget.attachments ? <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-3"><FileImage className="h-5 w-5 text-primary-600" /><span className="text-sm text-primary-700">{viewTarget.attachments} attachment{viewTarget.attachments > 1 ? 's' : ''}</span></div> : null}
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Medical Record" size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save Record</button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select className="input-field" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>)}
            </select>
          </Field>
          {!isDoctor && (
            <Field label="Doctor">
              <select className="input-field" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                <option value="">Select doctor</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Type">
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MedicalRecord['type'] })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MedicalRecord['status'] })}>
              <option>Normal</option><option>Under Observation</option><option>Critical</option>
            </select>
          </Field>
          <Field label="Attachments (count)"><input className="input-field" type="number" min={0} value={form.attachments} onChange={(e) => setForm({ ...form, attachments: parseInt(e.target.value) || 0 })} /></Field>
          <div className="sm:col-span-2"><Field label="Title"><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Complete Blood Count" /></Field></div>
          <div className="sm:col-span-2"><Field label="Description"><textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
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
