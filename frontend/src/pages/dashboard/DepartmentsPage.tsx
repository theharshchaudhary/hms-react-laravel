import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Pencil, Trash2, HeartPulse, Brain, Baby, Bone, Stethoscope, Pill, Hand, Flower, MapPin, Phone } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { departmentApi } from '@/services/api';
import type { Department } from '@/types';

const iconOptions = ['HeartPulse', 'Brain', 'Baby', 'Bone', 'Stethoscope', 'Pill', 'Hand', 'Flower'];
const iconMap: Record<string, typeof HeartPulse> = { HeartPulse, Brain, Baby, Bone, Stethoscope, Pill, Hand, Flower };

const emptyForm: Omit<Department, 'id'> = {
  name: '', head: '', description: '', totalDoctors: 0, totalBeds: 0, occupiedBeds: 0,
  location: '', phone: '', icon: 'Stethoscope',
};

// totalDoctors / occupiedBeds are derived server-side and not part of the form payload.
type DeptForm = Pick<Department, 'name' | 'head' | 'description' | 'totalBeds' | 'location' | 'phone' | 'icon'>;

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<Omit<Department, 'id'>>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    departmentApi.list().then(setDepartments).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); setForm({ ...d }); setModalOpen(true); };
  const handleSave = async () => {
    const payload: DeptForm = {
      name: form.name, head: form.head, description: form.description,
      totalBeds: form.totalBeds, location: form.location, phone: form.phone, icon: form.icon,
    };
    if (editing) await departmentApi.update(editing.id, payload);
    else await departmentApi.create(payload);
    setModalOpen(false); load();
  };
  const handleDelete = async () => { if (deleteTarget) { await departmentApi.remove(deleteTarget.id); load(); } };

  const totalBeds = departments.reduce((s, d) => s + d.totalBeds, 0);
  const occupiedBeds = departments.reduce((s, d) => s + d.occupiedBeds, 0);
  const totalDoctors = departments.reduce((s, d) => s + d.totalDoctors, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Departments" value={departments.length} icon={Building2} color="primary" />
        <StatCard label="Total Doctors" value={totalDoctors} icon={Stethoscope} color="secondary" />
        <StatCard label="Bed Occupancy" value={`${occupiedBeds}/${totalBeds}`} icon={HeartPulse} color="accent" subtitle={`${Math.round((occupiedBeds / totalBeds) * 100)}% occupied`} />
      </div>

      {error ? <ErrorState message="Failed to load departments" onRetry={load} /> : loading ? <SectionLoader /> : (
        <>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Department</button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => {
              const Icon = iconMap[dept.icon] || Stethoscope;
              const occupancy = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
              return (
                <div key={dept.id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20"><Icon className="h-16 w-16 text-white" /></div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                      <Icon className="h-7 w-7 text-white" />
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openEdit(dept)} className="rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/30"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget(dept)} className="rounded-lg bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/30"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                    <p className="text-xs text-gray-500">Head: {dept.head}</p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-2">{dept.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{dept.location}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="h-3.5 w-3.5" />{dept.phone}</div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Bed Occupancy</span><span className="font-medium text-gray-700">{dept.occupiedBeds}/{dept.totalBeds}</span></div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${occupancy > 80 ? 'bg-error-500' : occupancy > 60 ? 'bg-warning-500' : 'bg-success-500'}`} style={{ width: `${occupancy}%` }} /></div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500"><span>{dept.totalDoctors} Doctors</span><span>·</span><span>{dept.totalBeds} Beds</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'} size="lg"
        footer={<><button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={handleSave}>{editing ? 'Save' : 'Add'}</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department Name"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Department Head"><input className="input-field" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} /></Field>
          <Field label="Location"><input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Phone"><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Bed Capacity"><input className="input-field" type="number" value={form.totalBeds} onChange={(e) => setForm({ ...form, totalBeds: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Icon"><select className="input-field" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>{iconOptions.map((i) => <option key={i} value={i}>{i}</option>)}</select></Field>
          <div className="sm:col-span-2 rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500">Doctor count and bed occupancy are calculated automatically from staff and admitted patients.</div>
          <div className="sm:col-span-2"><Field label="Description"><textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Department" message={`Delete ${deleteTarget?.name}? This cannot be undone.`} confirmLabel="Delete" danger />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
