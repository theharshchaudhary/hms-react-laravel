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

// Rough default price per appointment type, used to seed the first line item.
export const CONSULT_PRICES: Record<string, number> = {
  Consultation: 150,
  'Follow-up': 100,
  'Check-up': 120,
  Emergency: 400,
  Surgery: 1500,
};
