export type UserRole = 'admin' | 'doctor' | 'receptionist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  status: 'Active' | 'Inactive' | 'Admitted';
  registeredDate: string;
  lastVisit?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  experience: number;
  qualification: string;
  availability: 'Available' | 'On Leave' | 'Busy';
  rating: number;
  totalPatients: number;
  avatar?: string;
  bio?: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  description: string;
  totalDoctors: number;
  totalBeds: number;
  occupiedBeds: number;
  location: string;
  phone: string;
  icon: string;
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
export type AppointmentType = 'Consultation' | 'Follow-up' | 'Emergency' | 'Check-up' | 'Surgery';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
}

export type QueueStatus = 'Waiting' | 'In Consultation' | 'Done' | 'Skipped';
export type QueuePriority = 'Normal' | 'Urgent' | 'Emergency';

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  department: string;
  priority: QueuePriority;
  status: QueueStatus;
  checkInTime: string;
  estimatedWait: number;
}

export interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  medications: { name: string; dosage: string; duration: string; instructions: string }[];
  diagnosis: string;
  notes?: string;
  status: 'Active' | 'Completed' | 'Expired';
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  type: 'Lab Report' | 'Diagnosis' | 'Treatment' | 'Imaging' | 'Vitals';
  title: string;
  description: string;
  attachments?: number;
  status: 'Normal' | 'Critical' | 'Under Observation';
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';
export type PaymentMethod = 'Cash' | 'Card' | 'Insurance' | 'Online';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientId: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  content: string;
  avatar?: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  icon: string;
}
