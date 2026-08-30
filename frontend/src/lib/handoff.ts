/**
 * Tiny one-shot store for passing an intent between dashboard pages
 * (e.g. "open the new-invoice modal prefilled for this patient" after a
 * consultation is marked complete). Consumed once, then cleared.
 */

export interface InvoiceHandoff {
  patientId: string;
  patientName: string;
  lineDescription: string;
  unitPrice: number;
}

let pendingInvoice: InvoiceHandoff | null = null;

export function setInvoiceHandoff(data: InvoiceHandoff): void {
  pendingInvoice = data;
}

export function takeInvoiceHandoff(): InvoiceHandoff | null {
  const v = pendingInvoice;
  pendingInvoice = null;
  return v;
}

let pendingPatientSearch: string | null = null;
export function setPatientSearch(q: string): void { pendingPatientSearch = q; }
export function takePatientSearch(): string | null {
  const v = pendingPatientSearch;
  pendingPatientSearch = null;
  return v;
}

/**
 * A booking-in-progress from the public /book flow. Persisted to sessionStorage
 * so it survives the sign-in / register hop, then resumed on /book.
 */
export interface BookingHandoff {
  doctorId?: string;
  doctorName?: string;
  specialization?: string;
  department?: string;
  date?: string;
  time?: string;
  type?: string;
  reason?: string;
}

const BOOKING_KEY = 'medicore_booking_intent';

export function setBookingHandoff(data: BookingHandoff): void {
  try { sessionStorage.setItem(BOOKING_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}
export function peekBookingHandoff(): BookingHandoff | null {
  try { const s = sessionStorage.getItem(BOOKING_KEY); return s ? (JSON.parse(s) as BookingHandoff) : null; } catch { return null; }
}
export function clearBookingHandoff(): void {
  try { sessionStorage.removeItem(BOOKING_KEY); } catch { /* ignore */ }
}

// Rough default price per appointment type, used to seed the first line item.
export const CONSULT_PRICES: Record<string, number> = {
  Consultation: 150,
  'Follow-up': 100,
  'Check-up': 120,
  Emergency: 400,
  Surgery: 1500,
};
