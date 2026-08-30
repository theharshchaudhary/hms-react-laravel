import { useState, useEffect } from 'react';
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Building2, Stethoscope, ClipboardList } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/router/Router';
import type { UserRole } from '@/types';

export function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('receptionist');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => { clearError(); }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch {
      /* error handled by context */
    }
  };

  const roleOptions: { value: UserRole; label: string; icon: typeof Building2; desc: string }[] = [
    { value: 'admin', label: 'Admin', icon: Building2, desc: 'Full system access' },
    { value: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Patient care access' },
    { value: 'receptionist', label: 'Receptionist', icon: ClipboardList, desc: 'Front desk access' },
  ];

  const displayError = localError || error;

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-secondary-600 to-secondary-900 p-12 lg:flex">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-secondary-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-secondary-800/30 blur-3xl" />
        <div className="relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold text-white">MediCore</span>
          </button>
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Join MediCore and transform your healthcare experience.
          </h2>
          <p className="mt-6 text-lg text-secondary-100">
            Create your account to access powerful tools for managing patient care, appointments, and medical records.
          </p>
        </div>
        <div className="relative text-sm text-secondary-200">
          © {new Date().getFullYear()} MediCore. All rights reserved.
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-gray-50 px-6 py-12 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>

          <h1 className="font-display text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">Get started with MediCore in just a few steps.</p>

          {displayError && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 animate-fade-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@medicore.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Select Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                      role === opt.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <opt.icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-[10px] text-gray-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field px-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field px-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span>I agree to the <a href="#" className="font-medium text-primary-600 hover:text-primary-700">Terms of Service</a> and <a href="#" className="font-medium text-primary-600 hover:text-primary-700">Privacy Policy</a></span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
