import { useState, useEffect } from 'react';
import { HeartPulse, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/router/Router';

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { clearError(); }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      /* error handled by context */
    }
  };

  const fillDemo = (role: 'admin' | 'doctor' | 'receptionist') => {
    const creds = {
      admin: { email: 'admin@medicore.com', password: 'admin123' },
      doctor: { email: 'doctor@medicore.com', password: 'doctor123' },
      receptionist: { email: 'reception@medicore.com', password: 'reception123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 to-primary-900 p-12 lg:flex">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary-800/30 blur-3xl" />
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
            Welcome back to the future of healthcare management.
          </h2>
          <p className="mt-6 text-lg text-primary-100">
            Manage patients, appointments, prescriptions, and more — all from one unified platform.
          </p>
          <div className="mt-12 space-y-4">
            {[
              'Role-based dashboards for Admins, Doctors, and Receptionists',
              'Real-time queue management and appointment scheduling',
              'Comprehensive medical records and billing management',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-primary-100">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-sm text-primary-200">
          © {new Date().getFullYear()} MediCore. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col justify-center bg-gray-50 px-6 py-12 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>

          <h1 className="font-display text-3xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-500">Enter your credentials to access the dashboard.</p>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 animate-fade-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                Remember me
              </label>
              <button type="button" className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-3 text-xs text-gray-500">Demo accounts — click to fill</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(['admin', 'doctor', 'receptionist'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium capitalize text-gray-600 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
