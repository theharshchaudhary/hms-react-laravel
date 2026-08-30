import type {
  User, Patient, Doctor, Department, Appointment, QueueEntry,
  Prescription, MedicalRecord, Invoice, Testimonial, Facility, ContactMessage, StaffRole,
} from '@/types';

/**
 * API service layer — talks to the Laravel REST backend.
 *
 * Base URL comes from VITE_API_URL (see frontend/.env). The backend issues a
 * Sanctum personal-access token on login/register which we persist in
 * localStorage and send as a Bearer token on every authenticated request.
 *
 * Laravel endpoints (see backend/routes/api.php):
 *   POST   /auth/register              POST /auth/login      POST /auth/logout
 *   GET    /auth/user                  PUT  /auth/profile    PUT  /auth/password
 *   GET|POST        /patients          GET|PUT|DELETE /patients/{id}
 *   GET|POST        /doctors           GET|PUT|DELETE /doctors/{id}
 *   GET|POST        /departments       GET|PUT|DELETE /departments/{id}
 *   GET|POST        /appointments      GET|PUT|DELETE /appointments/{id}
 *   GET|POST        /queue             PUT           /queue/{id}
 *   GET|POST        /prescriptions     GET|PUT       /prescriptions/{id}
 *   GET|POST        /records           GET           /records/{id}
 *   GET|POST        /invoices          GET|PUT       /invoices/{id}
 *   GET    /dashboard/overview         GET  /reports/summary
 *   GET    /public/{doctors,departments,testimonials,facilities,stats}
 *   POST   /contact
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:8000/api';

const TOKEN_KEY = 'medicore_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
}

class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Unable to reach the server. Is the backend running?', 0);
  }

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') setToken(null);
    const message = payload?.message || payload?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload?.errors);
  }

  return payload as T;
}

const jsonBody = (data: unknown): RequestInit => ({ body: JSON.stringify(data) });

/** Fetch a binary response (e.g. a PDF) and trigger a browser download. */
async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/pdf', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(`Download failed (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resource<T>(name: string) {
  return {
    list: (query?: Record<string, string | number | undefined>) => {
      const qs = query
        ? '?' + Object.entries(query)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&')
        : '';
      return request<T[]>(`/${name}${qs}`);
    },
    get: (id: string) => request<T>(`/${name}/${id}`),
    create: (data: unknown) => request<T>(`/${name}`, { method: 'POST', ...jsonBody(data) }),
    update: (id: string, data: unknown) => request<T>(`/${name}/${id}`, { method: 'PUT', ...jsonBody(data) }),
    remove: (id: string) => request<void>(`/${name}/${id}`, { method: 'DELETE' }).then(() => true),
  };
}

// --- Auth ---
interface AuthResponse { token: string; user: User; }

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const res = await request<AuthResponse>('/auth/login', { method: 'POST', ...jsonBody({ email, password }) });
    setToken(res.token);
    return res.user;
  },

  /** Public registration — always creates a patient account (no role). */
  async register(
    name: string,
    email: string,
    password: string,
    extra: { phone?: string; gender?: string; age?: number } = {},
  ): Promise<User> {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      ...jsonBody({ name, email, password, password_confirmation: password, ...extra }),
    });
    setToken(res.token);
    return res.user;
  },

  async logout(): Promise<void> {
    try { await request<void>('/auth/logout', { method: 'POST' }); } finally { setToken(null); }
  },

  me: () => request<User>('/auth/user'),
  updateProfile: (data: Partial<User>) => request<User>('/auth/profile', { method: 'PUT', ...jsonBody(data) }),
  updatePassword: (current_password: string, password: string) =>
    request<{ message: string }>('/auth/password', {
      method: 'PUT',
      ...jsonBody({ current_password, password, password_confirmation: password }),
    }),
};

// --- Resources ---
export const patientApi = resource<Patient>('patients');
export const doctorApi = resource<Doctor>('doctors');
export const departmentApi = resource<Department>('departments');
export const prescriptionApi = resource<Prescription>('prescriptions');
export const recordApi = resource<MedicalRecord>('records');
export const invoiceApi = resource<Invoice>('invoices');

export const appointmentApi = {
  ...resource<Appointment>('appointments'),
  checkIn: (id: string) => request<QueueEntry>(`/appointments/${id}/check-in`, { method: 'POST' }),
};

export const queueApi = {
  list: () => request<QueueEntry[]>('/queue'),
  create: (data: unknown) => request<QueueEntry>('/queue', { method: 'POST', ...jsonBody(data) }),
  update: (id: string, data: Partial<QueueEntry>) =>
    request<QueueEntry>(`/queue/${id}`, { method: 'PUT', ...jsonBody(data) }),
  reorder: (ids: string[]) =>
    request<QueueEntry[]>('/queue/reorder', { method: 'POST', ...jsonBody({ ids: ids.map(Number) }) }),
};

// --- Analytics ---
export interface DashboardOverview {
  scopedToDoctor: boolean;
  totalPatients: number;
  admittedPatients: number;
  todayAppointments: number;
  totalAppointments: number;
  activeDoctors: number;
  totalDoctors: number;
  pendingRefills: number;
  totalRevenue: number;
  pendingRevenue: number;
  totalInvoices: number;
  appointmentStatus: { label: string; value: number }[];
  weeklyAppointments: { label: string; value: number }[];
  monthlyRevenue: { label: string; value: number }[];
  todaysAppointmentsList: Appointment[];
}

export interface ReportsSummary {
  totalRevenue: number;
  totalAppointments: number;
  totalDepartments: number;
  avgDoctorRating: number;
  monthlyRevenue: { label: string; value: number }[];
  weeklyAppointments: { label: string; value: number }[];
  doctorsPerDepartment: { label: string; value: number }[];
  appointmentStatus: { label: string; value: number }[];
}

export type ReportType = 'revenue' | 'appointments' | 'departments' | 'demographics' | 'doctors' | 'prescriptions';

export const analyticsApi = {
  dashboard: () => request<DashboardOverview>('/dashboard/overview'),
  reports: () => request<ReportsSummary>('/reports/summary'),
  downloadReport: (type: ReportType) => downloadFile(`/reports/pdf?type=${type}`, `${type}-report.pdf`),
};

// --- Public (landing page) ---
export interface HospitalStats {
  totalPatients: number;
  totalDoctors: number;
  totalDepartments: number;
  totalBeds: number;
  satisfactionRate: number;
  yearsOfService: number;
  monthlyAppointments: number;
  emergencyResponse: number;
}

export interface DoctorSlots {
  date: string;
  doctorId: string;
  doctorName: string;
  onLeave: boolean;
  available: string[];
  booked: string[];
}

export const publicApi = {
  doctors: () => request<Doctor[]>('/public/doctors'),
  doctorSlots: (doctorId: string, date: string) =>
    request<DoctorSlots>(`/public/doctors/${doctorId}/slots?date=${date}`),
  departments: () => request<Department[]>('/public/departments'),
  testimonials: () => request<Testimonial[]>('/public/testimonials'),
  facilities: () => request<Facility[]>('/public/facilities'),
  stats: () => request<HospitalStats>('/public/stats'),
};

export const contactApi = {
  send: (data: { name: string; email: string; phone?: string; message: string }) =>
    request<{ message: string }>('/contact', { method: 'POST', ...jsonBody(data) }),
};

// --- Staff account management (super_admin only) ---
export interface StaffInput {
  name: string;
  email: string;
  password?: string;
  role: StaffRole;
  phone?: string;
  department?: string;
  doctorId?: string | null;
  doctorProfile?: {
    name: string;
    specialization?: string;
    department?: string;
    qualification?: string;
    experience?: number;
  } | null;
}

export const userApi = {
  list: (query?: Record<string, string | undefined>) => {
    const qs = query
      ? '?' + Object.entries(query).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
      : '';
    return request<User[]>(`/users${qs}`);
  },
  create: (data: StaffInput) => request<User>('/users', { method: 'POST', ...jsonBody(data) }),
  update: (id: string, data: Partial<StaffInput>) => request<User>(`/users/${id}`, { method: 'PUT', ...jsonBody(data) }),
  remove: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }).then(() => true),
};

// --- Patient portal ---
export interface PortalProfile {
  id: string;
  patientCode: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  age: number;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  status: string;
  registeredDate: string;
  lastVisit?: string | null;
}

export interface PortalDashboard {
  patient: PortalProfile;
  upcomingAppointments: Appointment[];
  stats: {
    upcomingAppointments: number;
    activePrescriptions: number;
    medicalRecords: number;
    outstandingBalance: number;
  };
}

export interface BookAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  type?: string;
  reason: string;
}

export const portalApi = {
  dashboard: () => request<PortalDashboard>('/portal/dashboard'),
  profile: () => request<PortalProfile>('/portal/profile'),
  updateProfile: (data: Partial<PortalProfile>) =>
    request<PortalProfile>('/portal/profile', { method: 'PUT', ...jsonBody(data) }),

  appointments: () => request<Appointment[]>('/portal/appointments'),
  bookAppointment: (data: BookAppointmentInput) =>
    request<Appointment>('/portal/appointments', { method: 'POST', ...jsonBody(data) }),
  rescheduleAppointment: (id: string, data: { date?: string; time?: string; reason?: string }) =>
    request<Appointment>(`/portal/appointments/${id}`, { method: 'PUT', ...jsonBody(data) }),
  cancelAppointment: (id: string) =>
    request<Appointment>(`/portal/appointments/${id}`, { method: 'PUT', ...jsonBody({ action: 'cancel' }) }),

  prescriptions: () => request<Prescription[]>('/portal/prescriptions'),
  requestRefill: (id: string) => request<Prescription>(`/portal/prescriptions/${id}/refill`, { method: 'POST' }),

  records: () => request<MedicalRecord[]>('/portal/records'),

  invoices: () => request<Invoice[]>('/portal/invoices'),
  downloadInvoice: (id: string, number: string) => downloadFile(`/portal/invoices/${id}/pdf`, `${number}.pdf`),
};

export const billingApi = {
  downloadInvoice: (id: string, number: string) => downloadFile(`/invoices/${id}/pdf`, `${number}.pdf`),
};

// --- Contact message inbox (admin) ---
export const messagesApi = {
  list: (handled?: boolean) =>
    request<ContactMessage[]>(`/messages${handled === undefined ? '' : `?handled=${handled ? 1 : 0}`}`),
  setHandled: (id: string, handled: boolean) =>
    request<ContactMessage>(`/messages/${id}`, { method: 'PUT', ...jsonBody({ handled }) }),
  remove: (id: string) => request<void>(`/messages/${id}`, { method: 'DELETE' }).then(() => true),
};

export { ApiError };
