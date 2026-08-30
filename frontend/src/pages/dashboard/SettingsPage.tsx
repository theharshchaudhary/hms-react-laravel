import { useState } from 'react';
import { User, Bell, Shield, Globe, Palette, Save, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'preferences', label: 'Preferences', icon: Palette },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
            <Field label="Full Name" defaultValue={user?.name} />
            <Field label="Email" defaultValue={user?.email} />
            <Field label="Phone" defaultValue={user?.phone} />
            <Field label="Department" defaultValue={user?.department} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
              <div className="flex items-center gap-2"><Badge variant="primary" className="capitalize">{user?.role}</Badge></div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button className="btn-primary" onClick={handleSave}><Save className="h-4 w-4" />Save Changes</button>
            {saved && <span className="text-sm text-success-600 animate-fade-in">Saved successfully!</span>}
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
          <div className="mt-6"><button className="btn-primary" onClick={handleSave}><Save className="h-4 w-4" />Save Preferences</button></div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900">Security Settings</h3>
          <p className="text-sm text-gray-500">Manage your password and security options</p>
          <div className="mt-6 space-y-4">
            <Field label="Current Password" type="password" />
            <Field label="New Password" type="password" />
            <Field label="Confirm New Password" type="password" />
          </div>
          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p><p className="text-xs text-gray-500">Add an extra layer of security</p></div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary-600" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
          <div className="mt-6"><button className="btn-primary" onClick={handleSave}><Save className="h-4 w-4" />Update Security</button></div>
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
          <div className="mt-6"><button className="btn-primary" onClick={handleSave}><Save className="h-4 w-4" />Save Preferences</button></div>
        </div>
      )}
    </div>
  );
}

function Field({ label, defaultValue, type = 'text', children }: { label: string; defaultValue?: string; type?: string; children?: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children || <input className="input-field" type={type} defaultValue={defaultValue} placeholder={label} />}
    </div>
  );
}
