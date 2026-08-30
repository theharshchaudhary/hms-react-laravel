import { useEffect, useState } from 'react';
import { Save, Loader2, AlertCircle, Shield } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { portalApi, authApi, ApiError, type PortalProfile as Profile } from '@/services/api';

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PortalProfile() {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [meta, setMeta] = useState<Profile | null>(null);
  const [state, setState] = useState<{ saving: boolean; ok: boolean; error: string | null }>({ saving: false, ok: false, error: null });

  const [pw, setPw] = useState({ current_password: '', password: '', confirm: '' });
  const [pwState, setPwState] = useState<{ saving: boolean; ok: boolean; error: string | null }>({ saving: false, ok: false, error: null });

  useEffect(() => {
    portalApi.profile()
      .then((p) => { setMeta(p); setForm(p); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setState({ saving: true, ok: false, error: null });
    try {
      const updated = await portalApi.updateProfile({
        name: form.name, email: form.email, phone: form.phone, gender: form.gender,
        age: form.age, bloodGroup: form.bloodGroup, address: form.address, emergencyContact: form.emergencyContact,
      });
      setMeta(updated);
      setForm(updated);
      await refreshUser();
      setState({ saving: false, ok: true, error: null });
      setTimeout(() => setState((s) => ({ ...s, ok: false })), 3000);
    } catch (err) {
      const msg = err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Failed to save';
      setState({ saving: false, ok: false, error: msg });
    }
  };

  const savePassword = async () => {
    if (pw.password !== pw.confirm) { setPwState({ saving: false, ok: false, error: 'Passwords do not match' }); return; }
    if (pw.password.length < 8) { setPwState({ saving: false, ok: false, error: 'Password must be at least 8 characters' }); return; }
    setPwState({ saving: true, ok: false, error: null });
    try {
      await authApi.updatePassword(pw.current_password, pw.password);
      setPw({ current_password: '', password: '', confirm: '' });
      setPwState({ saving: false, ok: true, error: null });
      setTimeout(() => setPwState((s) => ({ ...s, ok: false })), 3000);
    } catch (err) {
      const msg = err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Failed to update password';
      setPwState({ saving: false, ok: false, error: msg });
    }
  };

  if (loading) return <SectionLoader label="Loading profile..." />;
  if (error || !meta) return <ErrorState message="Could not load your profile" onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <Avatar name={meta.name} size="lg" />
          <div>
            <p className="text-lg font-bold text-gray-900">{meta.name}</p>
            <p className="text-sm text-primary-600 font-mono">{meta.patientCode}</p>
            <div className="mt-1"><Badge variant="success" dot>{meta.status}</Badge></div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full Name"><input className="input-field" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input-field" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input-field" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Age"><input className="input-field" type="number" value={form.age ?? ''} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Gender">
            <select className="input-field" value={form.gender || 'Other'} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Blood Group">
            <select className="input-field" value={form.bloodGroup || ''} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
              <option value="">—</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Emergency Contact"><input className="input-field" value={form.emergencyContact || ''} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Address"><input className="input-field" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          </div>
        </div>

        {state.error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{state.error}</div>}
        <div className="mt-6 flex items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={state.saving}>
            {state.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes
          </button>
          {state.ok && <span className="text-sm text-success-600 animate-fade-in">Saved!</span>}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-gray-400" /><h3 className="text-base font-semibold text-gray-900">Password</h3></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Current"><input className="input-field" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
          <Field label="New"><input className="input-field" type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
          <Field label="Confirm"><input className="input-field" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
        </div>
        {pwState.error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{pwState.error}</div>}
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" onClick={savePassword} disabled={pwState.saving}>
            {pwState.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Update Password
          </button>
          {pwState.ok && <span className="text-sm text-success-600 animate-fade-in">Password updated!</span>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
