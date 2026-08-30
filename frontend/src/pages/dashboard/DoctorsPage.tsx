import { useEffect, useState, useCallback } from 'react';
import { Stethoscope, Plus, Eye, Pencil, Trash2, Star } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { doctorApi } from '@/services/api';
import type { Doctor } from '@/types';

const emptyForm: Omit<Doctor, 'id'> = {
  name: '', email: '', phone: '', specialization: '', department: '', experience: 0,
  qualification: '', availability: 'Available', rating: 5, totalPatients: 0, avatar: '', bio: '',
};

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState<Omit<Doctor, 'id'>>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [viewTarget, setViewTarget] = useState<Doctor | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    doctorApi.list().then(setDoctors).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = doctors
    .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase()) || d.department.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => { const dir = sortDir === 'asc' ? 1 : -1; return String(a[sortBy as keyof Doctor]).localeCompare(String(b[sortBy as keyof Doctor])) * dir; });

  const pageSize = 8;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => { if (sortBy === key) { setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); } else { setSortBy(key); setSortDir('asc'); } };
  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (d: Doctor) => { setEditing(d); setForm({ ...d }); setModalOpen(true); };
  const handleSave = async () => {
    const saveForm = { ...form, avatar: form.avatar || form.name.split(' ').map((n) => n[0]).join('') };
    if (editing) { await doctorApi.update(editing.id, saveForm); } else { await doctorApi.create(saveForm); }
    setModalOpen(false); load();
  };
  const handleDelete = async () => { if (deleteTarget) { await doctorApi.remove(deleteTarget.id); load(); } };

  const columns: Column<Doctor>[] = [
    { key: 'name', header: 'Doctor', sortable: true, render: (d) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">{d.avatar || d.name.split(' ').map((n) => n[0]).join('')}</div>
        <div><p className="font-medium text-gray-900">{d.name}</p><p className="text-xs text-gray-500">{d.specialization}</p></div>
      </div>
    )},
    { key: 'department', header: 'Department', sortable: true },
    { key: 'experience', header: 'Exp', sortable: true, render: (d) => <span>{d.experience} yrs</span> },
    { key: 'rating', header: 'Rating', sortable: true, render: (d) => (
      <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent-400 text-accent-400" /><span className="font-medium">{d.rating}</span></div>
    )},
    { key: 'totalPatients', header: 'Patients', sortable: true },
    { key: 'availability', header: 'Availability', sortable: true, render: (d) => (
      <Badge variant={d.availability === 'Available' ? 'success' : d.availability === 'Busy' ? 'warning' : 'neutral'} dot>{d.availability}</Badge>
    )},
    { key: 'actions', header: 'Actions', align: 'right', render: (d) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setViewTarget(d); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-secondary-600"><Pencil className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Doctors" value={doctors.length} icon={Stethoscope} color="primary" />
        <StatCard label="Available" value={doctors.filter((d) => d.availability === 'Available').length} icon={Stethoscope} color="success" />
        <StatCard label="On Leave" value={doctors.filter((d) => d.availability === 'On Leave').length} icon={Stethoscope} color="warning" />
      </div>

      {error ? <ErrorState message="Failed to load doctors" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(d) => d.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by name, specialization, or department..."
          sortBy={sortBy} sortDir={sortDir} onSort={handleSort}
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Doctor</button>}
          onRowClick={(d) => setViewTarget(d)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Doctor' : 'Add New Doctor'} size="lg"
        footer={<><button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>{editing ? 'Save Changes' : 'Add Doctor'}</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. John Doe" /></Field>
          <Field label="Email"><input className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Specialization"><input className="input-field" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></Field>
          <Field label="Department"><input className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          <Field label="Qualification"><input className="input-field" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></Field>
          <Field label="Experience (years)"><input className="input-field" type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Availability"><select className="input-field" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value as Doctor['availability'] })}><option>Available</option><option>Busy</option><option>On Leave</option></select></Field>
          <div className="sm:col-span-2"><Field label="Bio"><textarea className="input-field resize-none" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field></div>
        </div>
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Doctor Profile" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">{viewTarget.avatar || viewTarget.name.split(' ').map((n) => n[0]).join('')}</div>
              <div><p className="text-lg font-bold text-gray-900">{viewTarget.name}</p><p className="text-sm text-primary-600">{viewTarget.specialization}</p><div className="mt-1 flex items-center gap-3"><Badge variant={viewTarget.availability === 'Available' ? 'success' : viewTarget.availability === 'Busy' ? 'warning' : 'neutral'} dot>{viewTarget.availability}</Badge><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent-400 text-accent-400" /><span className="text-sm font-medium">{viewTarget.rating}</span></div></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Department" value={viewTarget.department} />
              <Detail label="Qualification" value={viewTarget.qualification} />
              <Detail label="Experience" value={`${viewTarget.experience} years`} />
              <Detail label="Total Patients" value={viewTarget.totalPatients.toLocaleString()} />
              <Detail label="Email" value={viewTarget.email} />
              <Detail label="Phone" value={viewTarget.phone} />
            </div>
            {viewTarget.bio && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{viewTarget.bio}</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Doctor" message={`Remove ${deleteTarget?.name} from the system?`} confirmLabel="Delete" danger />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-0.5 text-sm text-gray-900">{value}</p></div>;
}
