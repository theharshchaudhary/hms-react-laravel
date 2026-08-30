import type {
  User, Patient, Doctor, Department, Appointment, QueueEntry,
  Prescription, MedicalRecord, Invoice, Testimonial, Facility, UserRole,
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

  async register(name: string, email: string, password: string, role: UserRole): Promise<User> {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      ...jsonBody({ name, email, password, password_confirmation: password, role }),
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
export const appointmentApi = resource<Appointment>('appointments');
export const prescriptionApi = resource<Prescription>('prescriptions');
export const recordApi = resource<MedicalRecord>('records');
export const invoiceApi = resource<Invoice>('invoices');

export const queueApi = {
  list: () => request<QueueEntry[]>('/queue'),
  create: (data: unknown) => request<QueueEntry>('/queue', { method: 'POST', ...jsonBody(data) }),
  update: (id: string, data: Partial<QueueEntry>) =>
    request<QueueEntry>(`/queue/${id}`, { method: 'PUT', ...jsonBody(data) }),
};

// --- Analytics ---
export interface DashboardOverview {
  totalPatients: number;
  admittedPatients: number;
  todayAppointments: number;
  totalAppointments: number;
  activeDoctors: number;
  totalDoctors: number;
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

export const analyticsApi = {
  dashboard: () => request<DashboardOverview>('/dashboard/overview'),
  reports: () => request<ReportsSummary>('/reports/summary'),
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

export const publicApi = {
  doctors: () => request<Doctor[]>('/public/doctors'),
  departments: () => request<Department[]>('/public/departments'),
  testimonials: () => request<Testimonial[]>('/public/testimonials'),
  facilities: () => request<Facility[]>('/public/facilities'),
  stats: () => request<HospitalStats>('/public/stats'),
};

export const contactApi = {
  send: (data: { name: string; email: string; phone?: string; message: string }) =>
    request<{ message: string }>('/contact', { method: 'POST', ...jsonBody(data) }),
};

export { ApiError };
