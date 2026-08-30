import { useEffect, useMemo, useState } from 'react';
import {
  HeartPulse, ArrowLeft, ArrowRight, Search, Star, Check, Calendar, Clock,
  Stethoscope, Loader2, AlertCircle, LogIn, UserPlus, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/router/Router';
import { publicApi, portalApi, ApiError, type DoctorSlots } from '@/services/api';
import { peekBookingHandoff, setBookingHandoff, clearBookingHandoff } from '@/lib/handoff';
import type { Doctor } from '@/types';

type Step = 'doctor' | 'slot' | 'auth' | 'confirm' | 'done';
const TYPES = ['Consultation', 'Follow-up', 'Check-up'];
const todayStr = () => new Date().toISOString().split('T')[0];

export function BookAppointmentPage() {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const isStaff = !!user && user.role !== 'patient';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const [step, setStep] = useState<Step>('doctor');
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('');
  const [type, setType] = useState('Consultation');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState<DoctorSlots | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load doctors + resume any booking-in-progress.
  useEffect(() => {
    publicApi.doctors()
      .then((list) => {
        setDoctors(list);
        const h = peekBookingHandoff();
        if (h?.doctorId || h?.doctorName) {
          const d = list.find((x) => x.id === h.doctorId)
            || list.find((x) => x.name === h.doctorName)
            || null;
          setDoctor(d);
          if (h.date) setDate(h.date);
          if (h.time) setTime(h.time);
          if (h.type) setType(h.type);
          if (h.reason) setReason(h.reason);
          if (d && h.date && h.time) setStep(isPatient ? 'confirm' : 'auth');
          else if (d) setStep('slot');
        }
      })
      .finally(() => setLoadingDoctors(false));
  }, [isPatient]);

  // Load slots whenever the doctor or date changes on the slot step.
  useEffect(() => {
    if (step !== 'slot' || !doctor) return;
    setLoadingSlots(true);
    setTime('');
    publicApi.doctorSlots(doctor.id, date)
      .then(setSlots)
      .catch(() => setSlots(null))
      .finally(() => setLoadingSlots(false));
  }, [step, doctor, date]);

  const departments = useMemo(
    () => ['All', ...Array.from(new Set(doctors.map((d) => d.department))).sort()],
    [doctors],
  );
  const visibleDoctors = doctors
    .filter((d) => deptFilter === 'All' || d.department === deptFilter)
    .filter((d) => [d.name, d.specialization, d.department].join(' ').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = (x: Doctor) => (x.availability === 'On Leave' ? 1 : 0);
      return av(a) - av(b) || b.rating - a.rating;
    })
    .slice(0, showAll ? undefined : 12);
  const totalMatching = doctors
    .filter((d) => deptFilter === 'All' || d.department === deptFilter)
    .filter((d) => [d.name, d.specialization, d.department].join(' ').toLowerCase().includes(search.toLowerCase())).length;

  const persist = () => doctor && setBookingHandoff({
    doctorId: doctor.id, doctorName: doctor.name, specialization: doctor.specialization,
    department: doctor.department, date, time, type, reason,
  });

  const chooseDoctor = (d: Doctor) => { setDoctor(d); setStep('slot'); };

  const proceedFromSlot = () => {
    if (!time || !reason.trim()) { setError('Pick a time and tell us the reason for your visit.'); return; }
    setError(null);
    persist();
    if (isPatient) setStep('confirm');
    else setStep('auth');
  };

  const goAuth = (dest: '/login' | '/register') => { persist(); navigate(dest); };

  const confirmBooking = async () => {
    if (!doctor) return;
    setSubmitting(true);
    setError(null);
    try {
      await portalApi.bookAppointment({ doctorId: doctor.id, date, time, type, reason });
      clearBookingHandoff();
      setStep('done');
    } catch (err) {
      const msg = err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Could not book the appointment';
      setError(msg);
      setStep('slot'); // slot probably got taken — let them repick
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = ['doctor', 'slot', isPatient ? null : 'auth', 'confirm'].filter(Boolean).indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><HeartPulse className="h-5 w-5" /></div>
            <span className="font-display text-lg font-bold text-gray-900">MediCore</span>
          </button>
          {!user && <button onClick={() => goAuth('/login')} className="text-sm font-medium text-primary-600 hover:text-primary-700">Sign in</button>}
          {isPatient && <button onClick={() => navigate('/portal')} className="text-sm font-medium text-primary-600 hover:text-primary-700">My portal</button>}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {step !== 'done' && (
          <>
            <h1 className="font-display text-2xl font-bold text-gray-900">Book an appointment</h1>
            {/* Progress */}
            <div className="mt-4 flex items-center gap-2">
              {['Choose a doctor', 'Pick a time', ...(isPatient ? [] : ['Sign in']), 'Confirm'].map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i < stepIndex ? 'bg-primary-600 text-white' : i === stepIndex ? 'border-2 border-primary-600 text-primary-700' : 'border-2 border-gray-200 text-gray-400'
                  }`}>{i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}</div>
                  <span className={`hidden text-xs sm:block ${i <= stepIndex ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                  {i < 3 && <div className="h-px flex-1 bg-gray-200" />}
                </div>
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* STEP: choose doctor */}
        {step === 'doctor' && (
          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className="input-field pl-9" placeholder="Search doctors or specialties..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="input-field sm:w-56" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>

            {loadingDoctors ? (
              <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" /></div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {visibleDoctors.map((d) => {
                  const onLeave = d.availability === 'On Leave';
                  return (
                    <button key={d.id} disabled={onLeave} onClick={() => chooseDoctor(d)}
                      className={`flex items-start gap-4 rounded-2xl border bg-white p-5 text-left transition-all ${
                        onLeave ? 'cursor-not-allowed border-gray-200 opacity-60' : 'border-gray-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-card'
                      }`}>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 text-lg font-bold text-primary-700">
                        {d.avatar || d.name.split(' ').slice(1).map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{d.name}</p>
                        <p className="text-sm text-primary-600">{d.specialization}</p>
                        <p className="text-xs text-gray-500">{d.department}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />{d.rating}</span>
                          <span>{d.experience} yrs exp</span>
                          {onLeave ? <span className="font-medium text-gray-400">On leave</span> : <span className="font-medium text-success-600">Available</span>}
                        </div>
                      </div>
                      {!onLeave && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />}
                    </button>
                  );
                })}
                {visibleDoctors.length === 0 && <p className="col-span-2 py-10 text-center text-sm text-gray-500">No doctors match your search.</p>}
                {!showAll && totalMatching > 12 && (
                  <button onClick={() => setShowAll(true)} className="col-span-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50">
                    Show all {totalMatching} doctors
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP: pick a time */}
        {step === 'slot' && doctor && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-primary-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{doctor.name}</p>
                  <p className="text-xs text-gray-500">{doctor.specialization} · {doctor.department}</p>
                </div>
              </div>
              <button onClick={() => setStep('doctor')} className="text-sm font-medium text-primary-600 hover:text-primary-700">Change</button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
              <input type="date" className="input-field sm:w-56" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />

              <p className="mb-2 mt-5 text-sm font-medium text-gray-700">Available times</p>
              {loadingSlots ? (
                <div className="py-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" /></div>
              ) : slots?.onLeave ? (
                <p className="rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">This doctor is on leave. Please choose another doctor or date.</p>
              ) : slots && slots.available.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">No open slots on this day — try another date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots?.available.map((t) => (
                    <button key={t} onClick={() => setTime(t)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        time === t ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}>{t}</button>
                  ))}
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Visit type</label>
                  <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason for visit</label>
                <textarea className="input-field resize-none" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe your symptoms or reason for the appointment" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep('doctor')} className="btn-secondary"><ArrowLeft className="h-4 w-4" />Back</button>
              <button onClick={proceedFromSlot} disabled={!time} className="btn-primary">Continue<ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {/* STEP: auth */}
        {step === 'auth' && doctor && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
              <p className="text-sm font-semibold text-primary-900">Almost there</p>
              <p className="mt-1 text-sm text-primary-700">
                Sign in or create a free patient account to confirm your appointment with{' '}
                <span className="font-medium">{doctor.name}</span> on{' '}
                <span className="font-medium">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span> at{' '}
                <span className="font-medium">{time}</span>. Your selection is saved.
              </p>
            </div>

            {isStaff ? (
              <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
                You're signed in as a staff member. Appointments here are booked by patients — please
                <button onClick={() => { clearBookingHandoff(); navigate('/dashboard/appointments'); }} className="mx-1 font-medium text-primary-600 hover:underline">use the staff scheduler</button>
                or sign out to book as a patient.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <button onClick={() => goAuth('/login')} className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-primary-300 hover:shadow-card">
                  <LogIn className="h-6 w-6 text-primary-600" />
                  <p className="font-semibold text-gray-900">I have an account</p>
                  <p className="text-sm text-gray-500">Sign in and jump straight to confirmation.</p>
                </button>
                <button onClick={() => goAuth('/register')} className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-primary-300 hover:shadow-card">
                  <UserPlus className="h-6 w-6 text-primary-600" />
                  <p className="font-semibold text-gray-900">Create an account</p>
                  <p className="text-sm text-gray-500">Takes under a minute — then you're back here.</p>
                </button>
              </div>
            )}

            <button onClick={() => setStep('slot')} className="btn-secondary"><ArrowLeft className="h-4 w-4" />Back</button>
          </div>
        )}

        {/* STEP: confirm */}
        {step === 'confirm' && doctor && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900">Review your appointment</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Row icon={Stethoscope} label="Doctor" value={`${doctor.name} · ${doctor.specialization}`} />
                <Row icon={HeartPulse} label="Department" value={doctor.department} />
                <Row icon={Calendar} label="Date" value={new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} />
                <Row icon={Clock} label="Time" value={time} />
                <Row icon={Check} label="Type" value={type} />
                {user && <Row icon={UserPlus} label="Patient" value={user.name} />}
              </div>
              {reason && (
                <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Reason for visit</p>
                  <p className="mt-0.5 text-sm text-gray-700">{reason}</p>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-400">Your request is confirmed by our front desk. You'll see the status in your portal.</p>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep('slot')} className="btn-secondary"><ArrowLeft className="h-4 w-4" />Change time</button>
              <button onClick={confirmBooking} disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Confirm booking
              </button>
            </div>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && doctor && (
          <div className="mx-auto max-w-md py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-gray-900">Appointment requested</h1>
            <p className="mt-2 text-sm text-gray-600">
              {doctor.name} · {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {time}
            </p>
            <p className="mt-1 text-sm text-gray-500">Our front desk will confirm shortly — track it in your portal.</p>
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => navigate('/portal/appointments')} className="btn-primary">View my appointments</button>
              <button onClick={() => { setStep('doctor'); setDoctor(null); setTime(''); setReason(''); }} className="btn-secondary">Book another</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
