import {
  mockUsers, mockPatients, mockDoctors, mockDepartments,
  mockAppointments, mockQueue, mockPrescriptions, mockRecords, mockInvoices,
} from '@/data/mockData';
import type {
  User, Patient, Doctor, Department, Appointment, QueueEntry,
  Prescription, MedicalRecord, Invoice, UserRole,
} from '@/types';

/**
 * API service abstraction layer.
 *
 * Currently backed by in-memory mock data with simulated network latency.
 * Each method mirrors a REST endpoint shape so the implementation can be
 * swapped for a real Laravel REST API by replacing the function bodies
 * with fetch() calls to the corresponding endpoints.
 *
 * Expected Laravel endpoints:
 *   GET    /api/patients           POST /api/patients
 *   GET    /api/patients/{id}      PUT  /api/patients/{id}   DELETE /api/patients/{id}
 *   ...same pattern for doctors, departments, appointments, etc.
 *   POST   /api/auth/login         POST /api/auth/register
 */

const LATENCY = 350;

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), LATENCY));
}

function genId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

// --- Auth ---
export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error('Invalid email or password');
    const { password: _, ...userWithoutPassword } = user;
    return delay(userWithoutPassword);
  },

  async register(name: string, email: string, password: string, role: UserRole): Promise<User> {
    const existing = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('Email already registered');
    const newUser: User = { id: genId('u'), name, email, role, avatar: name.split(' ').map((n) => n[0]).join('') };
    return delay(newUser);
  },
};

// --- Patients ---
export const patientApi = {
  list: () => delay(mockPatients),
  get: (id: string) => delay(mockPatients.find((p) => p.id === id) || null),
  create: (data: Omit<Patient, 'id'>) => {
    const patient: Patient = { ...data, id: genId('p') };
    mockPatients.unshift(patient);
    return delay(patient);
  },
  update: (id: string, data: Partial<Patient>) => {
    const idx = mockPatients.findIndex((p) => p.id === id);
    if (idx >= 0) mockPatients[idx] = { ...mockPatients[idx], ...data };
    return delay(mockPatients[idx]);
  },
  remove: (id: string) => {
    const idx = mockPatients.findIndex((p) => p.id === id);
    if (idx >= 0) mockPatients.splice(idx, 1);
    return delay(true);
  },
};

// --- Doctors ---
export const doctorApi = {
  list: () => delay(mockDoctors),
  get: (id: string) => delay(mockDoctors.find((d) => d.id === id) || null),
  create: (data: Omit<Doctor, 'id'>) => {
    const doctor: Doctor = { ...data, id: genId('d') };
    mockDoctors.unshift(doctor);
    return delay(doctor);
  },
  update: (id: string, data: Partial<Doctor>) => {
    const idx = mockDoctors.findIndex((d) => d.id === id);
    if (idx >= 0) mockDoctors[idx] = { ...mockDoctors[idx], ...data };
    return delay(mockDoctors[idx]);
  },
  remove: (id: string) => {
    const idx = mockDoctors.findIndex((d) => d.id === id);
    if (idx >= 0) mockDoctors.splice(idx, 1);
    return delay(true);
  },
};

// --- Departments ---
export const departmentApi = {
  list: () => delay(mockDepartments),
  get: (id: string) => delay(mockDepartments.find((d) => d.id === id) || null),
  create: (data: Omit<Department, 'id'>) => {
    const dept: Department = { ...data, id: genId('dep') };
    mockDepartments.unshift(dept);
    return delay(dept);
  },
  update: (id: string, data: Partial<Department>) => {
    const idx = mockDepartments.findIndex((d) => d.id === id);
    if (idx >= 0) mockDepartments[idx] = { ...mockDepartments[idx], ...data };
    return delay(mockDepartments[idx]);
  },
  remove: (id: string) => {
    const idx = mockDepartments.findIndex((d) => d.id === id);
    if (idx >= 0) mockDepartments.splice(idx, 1);
    return delay(true);
  },
};

// --- Appointments ---
export const appointmentApi = {
  list: () => delay(mockAppointments),
  get: (id: string) => delay(mockAppointments.find((a) => a.id === id) || null),
  create: (data: Omit<Appointment, 'id'>) => {
    const appt: Appointment = { ...data, id: genId('a') };
    mockAppointments.unshift(appt);
    return delay(appt);
  },
  update: (id: string, data: Partial<Appointment>) => {
    const idx = mockAppointments.findIndex((a) => a.id === id);
    if (idx >= 0) mockAppointments[idx] = { ...mockAppointments[idx], ...data };
    return delay(mockAppointments[idx]);
  },
  remove: (id: string) => {
    const idx = mockAppointments.findIndex((a) => a.id === id);
    if (idx >= 0) mockAppointments.splice(idx, 1);
    return delay(true);
  },
};

// --- Queue ---
export const queueApi = {
  list: () => delay(mockQueue),
  update: (id: string, data: Partial<QueueEntry>) => {
    const idx = mockQueue.findIndex((q) => q.id === id);
    if (idx >= 0) mockQueue[idx] = { ...mockQueue[idx], ...data };
    return delay(mockQueue[idx]);
  },
  create: (data: Omit<QueueEntry, 'id'>) => {
    const entry: QueueEntry = { ...data, id: genId('q') };
    mockQueue.unshift(entry);
    return delay(entry);
  },
};

// --- Prescriptions ---
export const prescriptionApi = {
  list: () => delay(mockPrescriptions),
  get: (id: string) => delay(mockPrescriptions.find((p) => p.id === id) || null),
  create: (data: Omit<Prescription, 'id'>) => {
    const rx: Prescription = { ...data, id: genId('pr') };
    mockPrescriptions.unshift(rx);
    return delay(rx);
  },
  update: (id: string, data: Partial<Prescription>) => {
    const idx = mockPrescriptions.findIndex((p) => p.id === id);
    if (idx >= 0) mockPrescriptions[idx] = { ...mockPrescriptions[idx], ...data };
    return delay(mockPrescriptions[idx]);
  },
};

// --- Medical Records ---
export const recordApi = {
  list: () => delay(mockRecords),
  get: (id: string) => delay(mockRecords.find((r) => r.id === id) || null),
  create: (data: Omit<MedicalRecord, 'id'>) => {
    const rec: MedicalRecord = { ...data, id: genId('r') };
    mockRecords.unshift(rec);
    return delay(rec);
  },
};

// --- Billing ---
export const invoiceApi = {
  list: () => delay(mockInvoices),
  get: (id: string) => delay(mockInvoices.find((i) => i.id === id) || null),
  create: (data: Omit<Invoice, 'id'>) => {
    const inv: Invoice = { ...data, id: genId('i') };
    mockInvoices.unshift(inv);
    return delay(inv);
  },
  update: (id: string, data: Partial<Invoice>) => {
    const idx = mockInvoices.findIndex((i) => i.id === id);
    if (idx >= 0) mockInvoices[idx] = { ...mockInvoices[idx], ...data };
    return delay(mockInvoices[idx]);
  },
};
