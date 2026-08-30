import { useState } from 'react';
import { User, Bell, Shield, Palette, Save, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { authApi, ApiError } from '@/services/api';

export function SettingsPage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'preferences', label: 'Preferences', icon: Palette },
  ];

  // --- Profile ---
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [profileState, setProfileState] = useState<{ saving: boolean; ok: boolean; error: string | null }>({ saving: false, ok: false, error: null });

  const saveProfile = async () => {
    setProfileState({ saving: true, ok: false, error: null });
    try {
      const updated = await authApi.updateProfile(profile);
      setUser(updated);
      setProfileState({ saving: false, ok: true, error: null });
      setTimeout(() => setProfileState((s) => ({ ...s, ok: false })), 3000);
    } catch (err) {
      setProfileState({ saving: false, ok: false, error: err instanceof Error ? err.message : 'Failed to save' });
    }
  };

  // --- Security ---
  const [pw, setPw] = useState({ current_password: '', password: '', confirm: '' });
  const [pwState, setPwState] = useState<{ saving: boolean; ok: boolean; error: string | null }>({ saving: false, ok: false, error: null });

  const savePassword = async () => {
    if (pw.password !== pw.confirm) {
      setPwState({ saving: false, ok: false, error: 'New passwords do not match' });
      return;
    }
    setPwState({ saving: true, ok: false, error: null });
    try {
      await authApi.updatePassword(pw.current_password, pw.password);
      setPw({ current_password: '', password: '', confirm: '' });
      setPwState({ saving: false, ok: true, error: null });
      setTimeout(() => setPwState((s) => ({ ...s, ok: false })), 3000);
    } catch (err) {
      const msg = err instanceof ApiError && err.errors
        ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Failed to update password';
      setPwState({ saving: false, ok: false, error: msg });
    }
  };

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary-500 bg-primary-50/50 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Profile Information</h3>
          <p className="text-sm text-gray-500">Update your personal information</p>
          <div className="mt-6 flex items-center gap-4">
            <Avatar name={user?.name || ''} avatar={user?.avatar} size="lg" />
            <div>
              <button className="btn-secondary text-sm">Change Photo</button>
              <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full Name"><input className="input-field" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Email"><input className="input-field" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
            <Field label="Phone"><input className="input-field" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            <Field label="Department"><input className="input-field" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} /></Field>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
              <div className="flex items-center gap-2"><Badge variant="primary" className="capitalize">{user?.role}</Badge></div>
            </div>
          </div>
          {profileState.error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{profileState.error}</div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button className="btn-primary" onClick={saveProfile} disabled={profileState.saving}>
              {profileState.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes
            </button>
            {profileState.ok && <span className="text-sm text-success-600 animate-fade-in">Saved successfully!</span>}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Notification Preferences</h3>
          <p className="text-sm text-gray-500">Choose what notifications you receive</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'New appointment bookings', desc: 'Get notified when a patient books an appointment', defaultChecked: true },
              { label: 'Queue updates', desc: 'Receive alerts when patients are called or skip', defaultChecked: true },
              { label: 'Critical patient alerts', desc: 'Immediate notifications for critical patient status', defaultChecked: true },
              { label: 'Billing reminders', desc: 'Notifications for overdue invoices', defaultChecked: false },
              { label: 'Daily summary', desc: 'A daily digest of all activities', defaultChecked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div><p className="text-sm font-medium text-gray-900">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked={item.defaultChecked} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-500/20" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Security Settings</h3>
          <p className="text-sm text-gray-500">Manage your password</p>
          <div className="mt-6 space-y-4">
            <Field label="Current Password"><input className="input-field" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
            <Field label="New Password"><input className="input-field" type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
            <Field label="Confirm New Password"><input className="input-field" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          </div>
          {pwState.error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{pwState.error}</div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button className="btn-primary" onClick={savePassword} disabled={pwState.saving}>
              {pwState.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Update Password
            </button>
            {pwState.ok && <span className="text-sm text-success-600 animate-fade-in">Password updated!</span>}
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">System Preferences</h3>
          <p className="text-sm text-gray-500">Customize your experience</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Language"><select className="input-field"><option>English</option><option>Spanish</option><option>French</option><option>German</option></select></Field>
            <Field label="Timezone"><select className="input-field"><option>UTC-08:00 Pacific</option><option>UTC-05:00 Eastern</option><option>UTC+00:00 GMT</option><option>UTC+01:00 Central European</option></select></Field>
            <Field label="Date Format"><select className="input-field"><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></Field>
            <Field label="Theme"><select className="input-field"><option>Light</option><option>Dark</option><option>System Default</option></select></Field>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
