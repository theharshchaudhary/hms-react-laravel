import { useEffect, useState, useCallback } from 'react';
import { ListOrdered, Clock, Play, Check, SkipForward, ArrowUp, ArrowDown, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { QueueStatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { queueApi, patientApi, doctorApi, ApiError } from '@/services/api';
import type { QueueEntry, QueueStatus, QueuePriority, Patient, Doctor } from '@/types';

const emptyForm = { patientId: '', doctorId: '', priority: 'Normal' as QueuePriority, estimatedWait: 15 };

export function QueuePage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([queueApi.list(), patientApi.list(), doctorApi.list()])
      .then(([q, p, d]) => { setQueue(q); setPatients(p); setDoctors(d); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const updateStatus = async (entry: QueueEntry, status: QueueStatus) => {
    await queueApi.update(entry.id, { status, estimatedWait: status === 'In Consultation' || status === 'Done' ? 0 : entry.estimatedWait });
    load();
  };

  const move = async (entry: QueueEntry, dir: 'up' | 'down') => {
    const order = [...queue].sort((a, b) => a.tokenNumber - b.tokenNumber).map((q) => q.id);
    const idx = order.indexOf(entry.id);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= order.length) return;
    [order[idx], order[swap]] = [order[swap], order[idx]];
    setQueue(await queueApi.reorder(order));
  };

  const addWalkIn = async () => {
    setSaving(true); setFormError(null);
    try {
      await queueApi.create({
        patientId: form.patientId,
        doctorId: form.doctorId || undefined,
        priority: form.priority,
        estimatedWait: form.estimatedWait,
      });
      setModalOpen(false);
      setForm({ ...emptyForm });
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const waiting = queue.filter((q) => q.status === 'Waiting');
  const inConsult = queue.filter((q) => q.status === 'In Consultation');
  const done = queue.filter((q) => q.status === 'Done');
  const sorted = [...queue].sort((a, b) => a.tokenNumber - b.tokenNumber);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="In Queue" value={waiting.length} icon={ListOrdered} color="warning" />
        <StatCard label="In Consultation" value={inConsult.length} icon={Play} color="primary" />
        <StatCard label="Completed" value={done.length} icon={Check} color="success" />
        <StatCard label="Avg Wait" value={`${Math.round(waiting.reduce((s, q) => s + q.estimatedWait, 0) / (waiting.length || 1))} min`} icon={Clock} color="secondary" />
      </div>

      {error ? <ErrorState message="Failed to load queue" onRetry={load} /> : loading ? <SectionLoader /> : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Patient Queue</h3>
              <p className="text-sm text-gray-500">{isDoctor ? 'Patients waiting for you' : 'Manage patient flow and consultation order'}</p>
            </div>
            {!isDoctor && <button className="btn-primary" onClick={() => { setForm({ ...emptyForm }); setFormError(null); setModalOpen(true); }}><UserPlus className="h-4 w-4" />Add Walk-in</button>}
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Token', 'Patient', 'Doctor / Dept', 'Priority', 'Check-in', 'Est. Wait', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">{entry.tokenNumber}</span></td>
                    <td className="px-4 py-3.5"><p className="text-sm font-medium text-gray-900">{entry.patientName}</p>{entry.appointmentId && <p className="text-xs text-primary-600">From appointment</p>}</td>
                    <td className="px-4 py-3.5"><p className="text-sm text-gray-700">{entry.doctorName}</p><p className="text-xs text-gray-500">{entry.department}</p></td>
                    <td className="px-4 py-3.5"><PriorityBadge priority={entry.priority} /></td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{entry.checkInTime}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{entry.estimatedWait > 0 ? `${entry.estimatedWait} min` : '—'}</td>
                    <td className="px-4 py-3.5"><QueueStatusBadge status={entry.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {!isDoctor && <>
                          <button onClick={() => move(entry, 'up')} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                          <button onClick={() => move(entry, 'down')} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                        </>}
                        {entry.status === 'Waiting' && <button onClick={() => updateStatus(entry, 'In Consultation')} className="rounded-lg bg-primary-50 p-1.5 text-primary-600 transition-colors hover:bg-primary-100" title="Start"><Play className="h-4 w-4" /></button>}
                        {entry.status === 'In Consultation' && <button onClick={() => updateStatus(entry, 'Done')} className="rounded-lg bg-success-50 p-1.5 text-success-600 transition-colors hover:bg-success-100" title="Complete"><Check className="h-4 w-4" /></button>}
                        {entry.status !== 'Done' && entry.status !== 'Skipped' && !isDoctor && <button onClick={() => updateStatus(entry, 'Skipped')} className="rounded-lg bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100" title="Skip"><SkipForward className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && <div className="px-6 py-12 text-center text-sm text-gray-500">Queue is empty</div>}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Walk-in Patient" size="md"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={addWalkIn} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Add to Queue</button>
        </>}>
        <div className="space-y-4">
          <Field label="Patient">
            <select className="input-field" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>)}
            </select>
          </Field>
          <Field label="Doctor">
            <select className="input-field" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.department}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as QueuePriority })}>
                <option>Normal</option><option>Urgent</option><option>Emergency</option>
              </select>
            </Field>
            <Field label="Est. Wait (min)"><input className="input-field" type="number" min={0} value={form.estimatedWait} onChange={(e) => setForm({ ...form, estimatedWait: parseInt(e.target.value) || 0 })} /></Field>
          </div>
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
