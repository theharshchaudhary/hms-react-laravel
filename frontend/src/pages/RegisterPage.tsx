import { useState, useEffect } from 'react';
import { HeartPulse, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigate, afterAuthPath } from '@/router/Router';
import { peekBookingHandoff } from '@/lib/handoff';

export function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    try {
      await register({
        name, email, password,
        phone: phone || undefined,
        gender: gender || undefined,
        age: age ? parseInt(age) : undefined,
      });
      navigate(afterAuthPath('patient'));
    } catch {
      /* error handled by context */
    }
  };

  const displayError = localError || error;
  const booking = peekBookingHandoff();

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
            Create your patient account.
          </h2>
          <p className="mt-6 text-lg text-secondary-100">
            Book appointments online, view your prescriptions and medical records, and manage your bills — all in one place.
          </p>
          <div className="mt-12 space-y-4">
            {[
              'Book and reschedule appointments with our specialists',
              'Access your prescriptions and request refills',
              'View medical records and download invoices',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-secondary-100">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
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
          <p className="mt-2 text-sm text-gray-500">
            Register as a patient to book appointments and access your health records.
          </p>

          {booking?.doctorName ? (
            <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
              After you register we'll take you straight back to confirm your appointment with <span className="font-semibold">{booking.doctorName}</span>
              {booking.date && booking.time ? <> on {new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {booking.time}</> : null}.
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-xs text-primary-700">
              Staff accounts (doctors, receptionists, administrators) are created by the hospital administrator, not here.
            </div>
          )}

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
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-10" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@email.com" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone <span className="text-gray-400">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field pl-10" placeholder="+1 555 000 0000" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Gender <span className="text-gray-400">(optional)</span></label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field">
                  <option value="">Prefer not to say</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Age <span className="text-gray-400">(optional)</span></label>
                <input type="number" min={0} max={150} value={age} onChange={(e) => setAge(e.target.value)} className="input-field" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field px-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field px-10" placeholder="••••••••" />
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
