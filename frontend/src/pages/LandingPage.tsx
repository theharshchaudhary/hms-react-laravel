import { useEffect, useState } from 'react';
import {
  HeartPulse, Brain, Baby, Bone, Stethoscope, Pill, Hand, Flower,
  Ambulance, Scan, FlaskConical, Video, Bed, Star, Phone, Mail, MapPin,
  Clock, ShieldCheck, Award, Users, Activity, ArrowRight, CheckCircle2,
  Quote, Calendar, Send, Loader2, AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Avatar } from '@/components/ui/Avatar';
import { mockDoctors, mockDepartments, mockTestimonials, mockFacilities, hospitalStats } from '@/data/mockData';
import { publicApi, contactApi, type HospitalStats } from '@/services/api';
import { setBookingHandoff } from '@/lib/handoff';
import type { Doctor, Department, Testimonial, Facility } from '@/types';
import { navigate } from '@/router/Router';

const iconMap: Record<string, typeof HeartPulse> = {
  HeartPulse, Brain, Baby, Bone, Stethoscope, Pill, Hand, Flower,
  Ambulance, Scan, FlaskConical, Video, Bed,
};

export function LandingPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(mockTestimonials);
  const [facilities, setFacilities] = useState<Facility[]>(mockFacilities);
  const [stats, setStats] = useState<HospitalStats>(hospitalStats);

  useEffect(() => {
    // Live data, with the bundled sample data as a graceful fallback.
    publicApi.doctors().then((d) => d.length && setDoctors(d)).catch(() => {});
    publicApi.departments().then((d) => d.length && setDepartments(d)).catch(() => {});
    publicApi.testimonials().then((t) => t.length && setTestimonials(t)).catch(() => {});
    publicApi.facilities().then((f) => f.length && setFacilities(f)).catch(() => {});
    publicApi.stats().then(setStats).catch(() => {});
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    setContactError(null);
    try {
      await contactApi.send(contactForm);
      setContactSent(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setContactSent(false), 4000);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setContactSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-secondary-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
                <ShieldCheck className="h-4 w-4" />
                Trusted by 12,000+ patients
              </div>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Your Health,
                <br />
                <span className="text-primary-600">Our Commitment</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
                Experience world-class healthcare with compassionate doctors, advanced technology, and a patient-first approach that puts your wellbeing at the heart of everything we do.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate('/book')} className="btn-primary text-base">
                  <Calendar className="h-5 w-5" />
                  Book Appointment
                </button>
                <button onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary text-base">
                  Explore Services
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-10 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.satisfactionRate}%</p>
                  <p className="text-sm text-gray-500">Patient Satisfaction</p>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.yearsOfService}+</p>
                  <p className="text-sm text-gray-500">Years of Service</p>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.emergencyResponse}min</p>
                  <p className="text-sm text-gray-500">Emergency Response</p>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-up animate-delay-200">
              <div className="relative overflow-hidden rounded-3xl shadow-elevated">
                <img
                  src="https://images.pexels.com/photos/6129441/pexels-photo-6129441.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Doctor consulting patient"
                  className="h-[420px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/30 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-5 shadow-elevated sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
                    <p className="text-sm text-gray-500">Expert Doctors</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 hidden rounded-2xl bg-white p-5 shadow-elevated sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Accredited</p>
                    <p className="text-xs text-gray-500">Healthcare Facility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { icon: Users, label: 'Total Patients', value: stats.totalPatients.toLocaleString(), colorClass: 'bg-primary-50 text-primary-600' },
              { icon: Stethoscope, label: 'Expert Doctors', value: stats.totalDoctors, colorClass: 'bg-secondary-50 text-secondary-600' },
              { icon: HeartPulse, label: 'Total Beds', value: stats.totalBeds, colorClass: 'bg-accent-50 text-accent-600' },
              { icon: Calendar, label: 'Monthly Appointments', value: stats.monthlyAppointments.toLocaleString(), colorClass: 'bg-success-50 text-success-600' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.colorClass}`}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Intro */}
      <section id="about" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative">
              <div className="overflow-hidden rounded-3xl shadow-card">
                <img
                  src="https://images.pexels.com/photos/8460371/pexels-photo-8460371.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Medical team"
                  className="h-[400px] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 hidden rounded-2xl bg-primary-600 p-6 text-white shadow-elevated lg:block">
                <p className="text-4xl font-bold">25+</p>
                <p className="text-sm text-primary-100">Years of Excellence</p>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-sm font-medium text-secondary-700">
                <HeartPulse className="h-4 w-4" />
                About MediCore
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
                A Legacy of Compassionate Healthcare
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                For over 25 years, MediCore has been at the forefront of medical excellence, combining cutting-edge technology with genuine human care. Our multidisciplinary team of specialists works collaboratively to deliver personalized treatment plans tailored to each patient's unique needs.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  'Patient-centered care with 24/7 emergency services',
                  'Board-certified specialists across 8 departments',
                  'Advanced diagnostic and surgical technology',
                  'Seamless digital health records and telemedicine',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-500" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/register')} className="btn-primary mt-8">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-gray-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Stethoscope className="h-4 w-4" />
              Our Services
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              Comprehensive Medical Services
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From routine check-ups to specialized treatments, we offer a full spectrum of healthcare services under one roof.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Ambulance, title: 'Emergency Care', desc: '24/7 emergency department with rapid response team for critical situations.', colorClass: 'bg-error-50 text-error-600' },
              { icon: Video, title: 'Telemedicine', desc: 'Connect with our specialists remotely through secure video consultations.', colorClass: 'bg-primary-50 text-primary-600' },
              { icon: Scan, title: 'Diagnostic Imaging', desc: 'Advanced MRI, CT scan, and X-ray facilities for accurate diagnosis.', colorClass: 'bg-secondary-50 text-secondary-600' },
              { icon: FlaskConical, title: 'Laboratory Services', desc: 'Full-service pathology lab with rapid test results and diagnostics.', colorClass: 'bg-accent-50 text-accent-600' },
              { icon: HeartPulse, title: 'Intensive Care', desc: 'State-of-the-art ICU with advanced life support and monitoring systems.', colorClass: 'bg-error-50 text-error-600' },
              { icon: Pill, title: 'Pharmacy', desc: '24-hour in-house pharmacy with all essential medications in stock.', colorClass: 'bg-success-50 text-success-600' },
              { icon: Bed, title: 'Inpatient Care', desc: 'Comfortable private and semi-private rooms with modern amenities.', colorClass: 'bg-primary-50 text-primary-600' },
              { icon: ShieldCheck, title: 'Health Check-ups', desc: 'Comprehensive preventive health screening packages for all ages.', colorClass: 'bg-secondary-50 text-secondary-600' },
            ].map((service, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.colorClass} transition-transform group-hover:scale-110`}>
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-4 py-1.5 text-sm font-medium text-secondary-700">
              <Activity className="h-4 w-4" />
              Our Departments
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              Specialized Medical Departments
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Eight specialized departments, each staffed with experienced professionals and equipped with the latest medical technology.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((dept) => {
              const Icon = iconMap[dept.icon] || Stethoscope;
              const occupancy = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
              return (
                <div key={dept.id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Icon className="h-20 w-20 text-white" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <Icon className="h-8 w-8 text-white" />
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {dept.totalDoctors} Doctors
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">Head: {dept.head}</p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-2">{dept.description}</p>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Bed Occupancy</span>
                        <span className="font-medium text-gray-700">{dept.occupiedBeds}/{dept.totalBeds}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${occupancy}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="bg-gray-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Users className="h-4 w-4" />
              Our Medical Team
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              Meet Our Expert Doctors
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Board-certified specialists dedicated to providing you with the highest quality of care.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.slice(0, 8).map((doctor) => (
              <div key={doctor.id} className="group rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 text-2xl font-bold text-primary-700">
                  {doctor.avatar}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{doctor.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary-600">{doctor.specialization}</p>
                <p className="mt-1 text-xs text-gray-500">{doctor.qualification}</p>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
                    <span className="font-medium text-gray-700">{doctor.rating}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <span className="text-gray-500">{doctor.experience} yrs exp</span>
                </div>
                <div className="mt-4">
                  <span className={`badge ${doctor.availability === 'Available' ? 'bg-success-100 text-success-700' : doctor.availability === 'Busy' ? 'bg-warning-100 text-warning-700' : 'bg-gray-100 text-gray-600'}`}>
                    {doctor.availability}
                  </span>
                </div>
                {doctor.availability !== 'On Leave' && (
                  <button
                    onClick={() => {
                      setBookingHandoff({ doctorId: doctor.id, doctorName: doctor.name, specialization: doctor.specialization, department: doctor.department });
                      navigate('/book');
                    }}
                    className="btn-secondary mt-4 w-full text-sm"
                  >
                    <Calendar className="h-4 w-4" />
                    Book Appointment
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-4 py-1.5 text-sm font-medium text-accent-700">
              <ShieldCheck className="h-4 w-4" />
              Our Facilities
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              State-of-the-Art Facilities
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              World-class infrastructure designed to deliver the best possible healthcare outcomes.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((facility) => {
              const Icon = iconMap[facility.icon] || Stethoscope;
              return (
                <div key={facility.id} className="group flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all hover:shadow-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">{facility.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{facility.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-primary-600 py-16">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary-400/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary-800/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Ready to Take Control of Your Health?
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-primary-100">
                Register today to book appointments, access your medical records, and connect with our specialists online.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => navigate('/register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-700 shadow-sm transition-all hover:bg-primary-50 hover:shadow-md">
                Get Started Today
                <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={() => navigate('/login')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-white/10">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-success-100 px-4 py-1.5 text-sm font-medium text-success-700">
              <Quote className="h-4 w-4" />
              Patient Stories
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              What Our Patients Say
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Real experiences from the people who matter most — our patients and their families.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-soft transition-all hover:shadow-card">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-accent-400 text-accent-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600">"{t.content}"</p>
                <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
                  <Avatar name={t.name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
                <Mail className="h-4 w-4" />
                Get in Touch
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
                Contact Us
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Have a question or need assistance? Reach out to us and our team will get back to you as soon as possible.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  { icon: MapPin, label: 'Address', value: '123 Healthcare Blvd, Springfield, IL 62704' },
                  { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
                  { icon: Mail, label: 'Email', value: 'info@medicore.com' },
                  { icon: Clock, label: 'Working Hours', value: '24/7 Emergency · OPD: Mon-Sat 8AM-8PM' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{item.label}</p>
                      <p className="mt-0.5 text-base text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
              {contactSent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">Message Sent!</h3>
                  <p className="mt-1 text-sm text-gray-500">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900">Send us a message</h3>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="input-field"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="input-field"
                        placeholder="john@email.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="input-field"
                        placeholder="+1 555 000 0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="input-field resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  {contactError && (
                    <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {contactError}
                    </div>
                  )}
                  <button type="submit" disabled={contactSending} className="btn-primary w-full">
                    {contactSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {contactSending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
