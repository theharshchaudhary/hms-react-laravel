import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Eye, Pencil, Trash2, UserPlus, BedDouble, LogOut, Loader2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/context/AuthContext';
import { patientApi, departmentApi, ApiError } from '@/services/api';
import { takePatientSearch } from '@/lib/handoff';
import type { Patient, Department } from '@/types';

const emptyForm: Omit<Patient, 'id'> = {
  patientCode: '', name: '', email: '', phone: '', gender: 'Male', age: 0,
  bloodGroup: 'O+', address: '', emergencyContact: '', status: 'Active',
  registeredDate: new Date().toISOString().split('T')[0],
};

export function PatientsPage() {
  const { user } = useAuth();
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(() => takePatientSearch() || '');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<Omit<Patient, 'id'>>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [viewTarget, setViewTarget] = useState<Patient | null>(null);
  const [admitTarget, setAdmitTarget] = useState<Patient | null>(null);
  const [admitDept, setAdmitDept] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([patientApi.list(), departmentApi.list()])
      .then(([p, d]) => { setPatients(p); setDepartments(d); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = patients
    .filter((p) => [p.name, p.patientCode, p.email].join(' ').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      return String(a[sortBy as keyof Patient] ?? '').localeCompare(String(b[sortBy as keyof Patient] ?? '')) * dir;
    });

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => { if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDir('asc'); } };
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };
  const openEdit = (p: Patient) => { setEditing(p); setForm({ ...p }); setFormError(null); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true); setFormError(null);
    try {
      if (editing) await patientApi.update(editing.id, form);
      else await patientApi.create({ ...form, patientCode: form.patientCode || undefined });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await patientApi.remove(deleteTarget.id); load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const admit = async () => {
    if (!admitTarget || !admitDept) return;
    setBusy(admitTarget.id);
    try { await patientApi.update(admitTarget.id, { status: 'Admitted', department: admitDept }); setAdmitTarget(null); load(); }
    finally { setBusy(null); }
  };

  const discharge = async (p: Patient) => {
    setBusy(p.id);
    try { await patientApi.update(p.id, { status: 'Active', department: null, lastVisit: new Date().toISOString().split('T')[0] }); load(); }
    finally { setBusy(null); }
  };

  const columns: Column<Patient>[] = [
    { key: 'patientCode', header: 'Patient ID', sortable: true, render: (p) => <span className="font-mono text-xs font-medium text-primary-600">{p.patientCode}</span> },
    { key: 'name', header: 'Name', sortable: true, render: (p) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">{p.name.split(' ').map((n) => n[0]).join('')}</div>
        <div><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.email}</p></div>
      </div>
    )},
    { key: 'age', header: 'Age', sortable: true, render: (p) => <span>{p.age} yrs</span> },
    { key: 'gender', header: 'Gender', sortable: true },
    { key: 'bloodGroup', header: 'Blood', render: (p) => <Badge variant="error">{p.bloodGroup}</Badge> },
    { key: 'status', header: 'Status', sortable: true, render: (p) => (
      <div className="flex items-center gap-2">
        <Badge variant={p.status === 'Active' ? 'success' : p.status === 'Admitted' ? 'warning' : 'neutral'} dot>{p.status}</Badge>
        {p.status === 'Admitted' && p.department && <span className="text-xs text-gray-500">{p.department}</span>}
      </div>
    )},
    { key: 'actions', header: 'Actions', align: 'right', render: (p) => (
      <div className="flex items-center justify-end gap-1">
        {p.status === 'Admitted'
          ? <button onClick={(e) => { e.stopPropagation(); discharge(p); }} disabled={busy === p.id} title="Discharge" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-success-600">{busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}</button>
          : <button onClick={(e) => { e.stopPropagation(); setAdmitTarget(p); setAdmitDept(departments[0]?.name || ''); }} title="Admit" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-warning-600"><BedDouble className="h-4 w-4" /></button>}
        <button onClick={(e) => { e.stopPropagation(); setViewTarget(p); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-secondary-600"><Pencil className="h-4 w-4" /></button>
        {canDelete && <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>}
      </div>
    )},
  ];

  const activeCount = patients.filter((p) => p.status === 'Active').length;
  const admittedCount = patients.filter((p) => p.status === 'Admitted').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={user?.role === 'doctor' ? 'My Patients' : 'Total Patients'} value={patients.length} icon={Users} color="primary" />
        <StatCard label="Active" value={activeCount} icon={Users} color="success" />
        <StatCard label="Admitted" value={admittedCount} icon={BedDouble} color="warning" />
      </div>

      {error ? <ErrorState message="Failed to load patients" onRetry={load} /> : (
        loading ? <SectionLoader /> : patients.length === 0 && !search ? (
          <EmptyState icon={UserPlus} title="No patients yet" message="Add your first patient to get started." action={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Patient</button>} />
        ) : (
          <DataTable
            columns={columns} data={paged} rowKey={(p) => p.id}
            searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by name, ID, or email..."
            sortBy={sortBy} sortDir={sortDir} onSort={handleSort}
            currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
            actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Patient</button>}
            onRowClick={(p) => setViewTarget(p)}
          />
        )
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Patient' : 'Add New Patient'} description={editing ? `Updating ${editing.name}` : 'Enter patient details below'} size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save Changes' : 'Add Patient'}</button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Age"><input className="input-field" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Gender"><select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Patient['gender'] })}><option>Male</option><option>Female</option><option>Other</option></select></Field>
          <Field label="Blood Group"><select className="input-field" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Emergency Contact"><input className="input-field" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
          <Field label="Status"><select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Patient['status'] })}><option>Active</option><option>Inactive</option><option>Admitted</option></select></Field>
          {form.status === 'Admitted' && (
            <Field label="Admitting Department">
              <select className="input-field" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </Field>
          )}
          <div className="sm:col-span-2"><Field label="Address"><input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
        </div>
        {formError && <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700">{formError}</div>}
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Patient Details" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">{viewTarget.name.split(' ').map((n) => n[0]).join('')}</div>
              <div><p className="text-lg font-bold text-gray-900">{viewTarget.name}</p><p className="text-sm text-primary-600 font-mono">{viewTarget.patientCode}</p><div className="mt-1"><Badge variant={viewTarget.status === 'Active' ? 'success' : viewTarget.status === 'Admitted' ? 'warning' : 'neutral'} dot>{viewTarget.status}</Badge></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Email" value={viewTarget.email} />
              <Detail label="Phone" value={viewTarget.phone} />
              <Detail label="Age" value={`${viewTarget.age} years`} />
              <Detail label="Gender" value={viewTarget.gender} />
              <Detail label="Blood Group" value={viewTarget.bloodGroup} />
              <Detail label="Emergency Contact" value={viewTarget.emergencyContact} />
              <Detail label="Registered" value={viewTarget.registeredDate} />
              <Detail label="Last Visit" value={viewTarget.lastVisit || 'N/A'} />
              {viewTarget.department && <Detail label="Department" value={viewTarget.department} />}
              <div className="col-span-2"><Detail label="Address" value={viewTarget.address} /></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!admitTarget} onClose={() => setAdmitTarget(null)} title="Admit Patient" size="sm"
        footer={<>
          <button className="btn-secondary" onClick={() => setAdmitTarget(null)}>Cancel</button>
          <button className="btn-primary" onClick={admit} disabled={busy === admitTarget?.id || !admitDept}>Admit</button>
        </>}>
        <p className="text-sm text-gray-600">Admit <span className="font-medium text-gray-900">{admitTarget?.name}</span> to a department. This adds to that department's bed occupancy.</p>
        <div className="mt-4">
          <Field label="Department">
            <select className="input-field" value={admitDept} onChange={(e) => setAdmitDept(e.target.value)}>
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name} — {d.occupiedBeds}/{d.totalBeds} beds</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Patient"
        message={`Delete ${deleteTarget?.name}? This also removes their portal login and cannot be undone.`} confirmLabel="Delete" danger />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-0.5 text-sm text-gray-900">{value}</p></div>;
}
