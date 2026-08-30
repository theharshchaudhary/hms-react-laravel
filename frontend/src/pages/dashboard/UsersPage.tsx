import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { userApi, doctorApi, ApiError, type StaffInput } from '@/services/api';
import { STAFF_ROLES } from '@/types';
import type { User, StaffRole, Doctor } from '@/types';

const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin', admin: 'Admin', doctor: 'Doctor', receptionist: 'Receptionist',
};
const ROLE_VARIANT: Record<StaffRole, 'primary' | 'secondary' | 'info' | 'neutral'> = {
  super_admin: 'primary', admin: 'secondary', doctor: 'info', receptionist: 'neutral',
};

const emptyForm: StaffInput = { name: '', email: '', password: '', role: 'receptionist', phone: '', department: '' };

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [unlinkedDoctors, setUnlinkedDoctors] = useState<Doctor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<StaffInput>(emptyForm);
  const [docMode, setDocMode] = useState<'existing' | 'new'>('existing');
  const [docId, setDocId] = useState('');
  const [newDoc, setNewDoc] = useState({ name: '', specialization: '', department: '', qualification: '', experience: 0 });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([userApi.list(), doctorApi.list({ unlinked: 1 })])
      .then(([u, d]) => { setUsers(u); setUnlinkedDoctors(d); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetDoctorFields = () => {
    setDocMode('existing'); setDocId('');
    setNewDoc({ name: '', specialization: '', department: '', qualification: '', experience: 0 });
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); resetDoctorFields(); setFormError(null); setModalOpen(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role as StaffRole, phone: u.phone || '', department: u.department || '' });
    resetDoctorFields();
    if (u.role === 'doctor' && u.doctorId) setDocId(u.doctorId);
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const doctorPart = form.role === 'doctor'
        ? (docMode === 'new'
            ? { doctorProfile: { ...newDoc, department: newDoc.department || form.department } }
            : { doctorId: docId || undefined })
        : {};

      if (editing) {
        const payload: Partial<StaffInput> = { name: form.name, email: form.email, role: form.role, phone: form.phone, department: form.department, ...doctorPart };
        if (form.password) payload.password = form.password;
        await userApi.update(editing.id, payload);
      } else {
        await userApi.create({ ...form, ...doctorPart });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      const msg = err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  // For editing a doctor, include their currently-linked profile in the picker.
  const doctorOptions = [
    ...(editing?.role === 'doctor' && editing.doctorId && editing.doctorName && !unlinkedDoctors.some((d) => d.id === editing.doctorId)
      ? [{ id: editing.doctorId, name: editing.doctorName } as Doctor]
      : []),
    ...unlinkedDoctors,
  ];

  const doDelete = async () => {
    if (!deleteTarget) return;
    try { await userApi.remove(deleteTarget.id); load(); }
    catch (err) { setError(false); alert(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', render: (u) => (
      <div className="flex items-center gap-3">
        <Avatar name={u.name} avatar={u.avatar} size="sm" />
        <div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
      </div>
    )},
    { key: 'role', header: 'Role', render: (u) => <Badge variant={ROLE_VARIANT[u.role as StaffRole]}>{ROLE_LABELS[u.role as StaffRole]}</Badge> },
    { key: 'department', header: 'Department', render: (u) => u.department || <span className="text-gray-400">—</span> },
    { key: 'phone', header: 'Phone', render: (u) => u.phone || <span className="text-gray-400">—</span> },
    { key: 'createdAt', header: 'Added', render: (u) => <span className="text-sm text-gray-500">{u.createdAt}</span> },
    { key: 'actions', header: 'Actions', align: 'right', render: (u) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-secondary-600"><Pencil className="h-4 w-4" /></button>
        {u.id !== me?.id && (
          <button onClick={() => setDeleteTarget(u)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
    )},
  ];

  const counts = STAFF_ROLES.map((r) => ({ r, n: users.filter((u) => u.role === r).length }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {counts.map(({ r, n }) => (
          <StatCard key={r} label={ROLE_LABELS[r]} value={n} icon={ShieldCheck}
            color={r === 'super_admin' ? 'primary' : r === 'admin' ? 'secondary' : r === 'doctor' ? 'accent' : 'success'} />
        ))}
      </div>

      {error ? <ErrorState message="Failed to load staff accounts" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(u) => u.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by name or email..."
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Staff Account</button>}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff Account' : 'Create Staff Account'}
        description={editing ? editing.email : 'Grant a team member access to the back office'} size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save' : 'Create Account'}
          </button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Role">
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <Field label="Department"><input className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          <Field label="Phone"><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label={editing ? 'New Password (optional)' : 'Password (min 8 chars)'}>
            <input className="input-field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? 'Leave blank to keep current' : ''} />
          </Field>
        </div>

        {form.role === 'doctor' && (
          <div className="mt-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Doctor profile</p>
              <div className="flex gap-1 text-xs">
                <button className={`rounded px-2 py-1 ${docMode === 'existing' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`} onClick={() => setDocMode('existing')}>Link existing</button>
                <button className={`rounded px-2 py-1 ${docMode === 'new' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`} onClick={() => setDocMode('new')}>Create new</button>
              </div>
            </div>
            {docMode === 'existing' ? (
              <div className="mt-2">
                <select className="input-field" value={docId} onChange={(e) => setDocId(e.target.value)}>
                  <option value="">Select a doctor profile</option>
                  {doctorOptions.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ''}</option>)}
                </select>
                {doctorOptions.length === 0 && <p className="mt-1 text-xs text-gray-400">No unlinked doctor profiles — create a new one instead.</p>}
              </div>
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className="input-field" placeholder="Name" value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} />
                <input className="input-field" placeholder="Specialization" value={newDoc.specialization} onChange={(e) => setNewDoc({ ...newDoc, specialization: e.target.value })} />
                <input className="input-field" placeholder="Department" value={newDoc.department} onChange={(e) => setNewDoc({ ...newDoc, department: e.target.value })} />
                <input className="input-field" placeholder="Qualification" value={newDoc.qualification} onChange={(e) => setNewDoc({ ...newDoc, qualification: e.target.value })} />
                <input className="input-field" type="number" min={0} placeholder="Years experience" value={newDoc.experience} onChange={(e) => setNewDoc({ ...newDoc, experience: parseInt(e.target.value) || 0 })} />
              </div>
            )}
          </div>
        )}

        {formError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700">
            <AlertCircle className="h-4 w-4" />{formError}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete}
        title="Delete Staff Account" message={`Remove ${deleteTarget?.name}'s access? Their login will be revoked immediately.`}
        confirmLabel="Delete" danger />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
