import { useEffect, useState, useCallback } from 'react';
import { Plus, CalendarDays, X, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { navigate } from '@/router/Router';
import { portalApi, ApiError } from '@/services/api';
import type { Appointment } from '@/types';

const CHANGEABLE = ['Scheduled', 'Confirmed'];
const todayStr = () => new Date().toISOString().split('T')[0];

export function PortalAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ date: todayStr(), time: '09:00', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    portalApi.appointments().then(setAppointments).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openReschedule = (a: Appointment) => {
    setEditing(a);
    setForm({ date: a.date, time: a.time, reason: a.reason });
    setFormError(null);
  };

  const submitReschedule = async () => {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      await portalApi.rescheduleAppointment(editing.id, form);
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const doCancel = async () => {
    if (!cancelTarget) return;
    await portalApi.cancelAppointment(cancelTarget.id);
    load();
  };

  if (loading) return <SectionLoader label="Loading appointments..." />;
  if (error) return <ErrorState message="Could not load your appointments" onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
        <button className="btn-primary" onClick={() => navigate('/book')}><Plus className="h-4 w-4" />Book Appointment</button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments yet" message="Book an appointment with one of our specialists."
          action={<button className="btn-primary" onClick={() => navigate('/book')}><Plus className="h-4 w-4" />Book Appointment</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {appointments.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.doctorName}</p>
                  <p className="text-xs text-gray-500">{a.department}</p>
                </div>
                <AppointmentStatusBadge status={a.status} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                {new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {a.time}
              </div>
              <div className="mt-2"><Badge variant="info">{a.type}</Badge></div>
              {a.reason && <p className="mt-3 text-sm text-gray-600">{a.reason}</p>}
              {CHANGEABLE.includes(a.status) && (
                <div className="mt-4 flex gap-2">
                  <button className="btn-secondary flex-1 text-xs" onClick={() => openReschedule(a)}>Reschedule</button>
                  <button className="flex-1 rounded-lg border border-error-200 px-3 py-2 text-xs font-medium text-error-600 transition-colors hover:bg-error-50"
                    onClick={() => setCancelTarget(a)}>
                    <X className="mr-1 inline h-3.5 w-3.5" />Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Reschedule Appointment"
        description={editing ? `With ${editing.doctorName}` : ''} size="md"
        footer={<>
          <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn-primary" onClick={submitReschedule} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save</button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
            <input type="date" className="input-field" value={form.date} min={todayStr()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Time</label>
            <input type="time" className="input-field" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason for visit</label>
            <textarea className="input-field resize-none" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </div>
        {formError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700">
            <AlertCircle className="h-4 w-4" />{formError}
          </div>
        )}
        <p className="mt-4 text-xs text-gray-400">A rescheduled appointment goes back to "Scheduled" for the front desk to re-confirm.</p>
      </Modal>

      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={doCancel}
        title="Cancel Appointment" message={`Cancel your ${cancelTarget?.type} with ${cancelTarget?.doctorName}?`}
        confirmLabel="Cancel Appointment" cancelLabel="Keep it" danger />
    </div>
  );
}
