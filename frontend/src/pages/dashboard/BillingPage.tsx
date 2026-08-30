import { useEffect, useState, useCallback } from 'react';
import { Receipt, Eye, DollarSign, AlertCircle, Clock, Download, Loader2, Plus, Trash2, Wallet } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { InvoiceStatusBadge } from '@/components/ui/StatusBadge';
import { invoiceApi, billingApi, patientApi, ApiError } from '@/services/api';
import { takeInvoiceHandoff } from '@/lib/handoff';
import type { Invoice, InvoiceStatus, PaymentMethod, Patient } from '@/types';

type Line = { description: string; quantity: number; unitPrice: number };
const emptyLine: Line = { description: '', quantity: 1, unitPrice: 0 };

const today = () => new Date().toISOString().split('T')[0];
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split('T')[0];

interface FormState {
  patientId: string;
  date: string;
  dueDate: string;
  paymentMethod: '' | PaymentMethod;
  paidAmount: number;
  items: Line[];
}
const emptyForm: FormState = { patientId: '', date: today(), dueDate: plusDays(30), paymentMethod: '', paidAmount: 0, items: [{ ...emptyLine }] };

export function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<Invoice | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([invoiceApi.list(), patientApi.list()])
      .then(([i, p]) => { setInvoices(i); setPatients(p); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Prefilled invoice from a completed consultation.
  useEffect(() => {
    const h = takeInvoiceHandoff();
    if (h) {
      setForm({ ...emptyForm, patientId: h.patientId, items: [{ description: h.lineDescription, quantity: 1, unitPrice: h.unitPrice }] });
      setFormError(null);
      setModalOpen(true);
    }
  }, []);

  const filtered = invoices
    .filter((i) => [i.patientName, i.invoiceNumber].join(' ').toLowerCase().includes(search.toLowerCase()))
    .filter((i) => statusFilter === 'all' || i.status === statusFilter);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalRevenue = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const pending = invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);
  const formTotal = form.items.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const downloadPdf = async (inv: Invoice) => {
    setDownloading(inv.id);
    try { await billingApi.downloadInvoice(inv.id, inv.invoiceNumber); }
    finally { setDownloading(null); }
  };

  const openCreate = () => { setForm({ ...emptyForm }); setFormError(null); setModalOpen(true); };
  const setLine = (i: number, patch: Partial<Line>) =>
    setForm((f) => ({ ...f, items: f.items.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));

  const save = async () => {
    setSaving(true); setFormError(null);
    try {
      await invoiceApi.create({
        patientId: form.patientId,
        date: form.date,
        dueDate: form.dueDate,
        paidAmount: form.paidAmount || 0,
        paymentMethod: form.paymentMethod || undefined,
        items: form.items.filter((l) => l.description.trim()).map((l) => ({
          description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, total: l.quantity * l.unitPrice,
        })),
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
        : err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const recordPayment = async () => {
    if (!viewTarget) return;
    const add = parseFloat(payAmount);
    if (!add || add <= 0) return;
    setPaying(true);
    try {
      const updated = await invoiceApi.update(viewTarget.id, { paidAmount: viewTarget.paidAmount + add });
      setInvoices((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setViewTarget(updated);
      setPayAmount('');
    } finally { setPaying(false); }
  };

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', sortable: true, render: (i) => <span className="font-mono text-xs font-medium text-primary-600">{i.invoiceNumber}</span> },
    { key: 'patientName', header: 'Patient', sortable: true, render: (i) => <span className="font-medium text-gray-900">{i.patientName}</span> },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'dueDate', header: 'Due Date', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, render: (i) => <span className="font-semibold text-gray-900">${i.amount.toLocaleString()}</span> },
    { key: 'paidAmount', header: 'Paid', render: (i) => <span className="text-gray-600">${i.paidAmount.toLocaleString()}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (i) => <InvoiceStatusBadge status={i.status} /> },
    { key: 'actions', header: '', align: 'right', render: (i) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); downloadPdf(i); }} disabled={downloading === i.id} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600">
          {downloading === i.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); setViewTarget(i); setPayAmount(''); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="success" />
        <StatCard label="Pending" value={`$${pending.toLocaleString()}`} icon={Clock} color="warning" />
        <StatCard label="Overdue" value={`$${overdue.toLocaleString()}`} icon={AlertCircle} color="error" />
        <StatCard label="Total Invoices" value={invoices.length} icon={Receipt} color="primary" />
      </div>

      {error ? <ErrorState message="Failed to load invoices" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(i) => i.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by invoice # or patient..."
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          onRowClick={(i) => { setViewTarget(i); setPayAmount(''); }}
          actions={
            <div className="flex items-center gap-2">
              <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-primary-500 focus:outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">All Status</option>
                {(['Paid', 'Pending', 'Overdue', 'Partial'] as InvoiceStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Create Invoice</button>
            </div>
          }
        />
      )}

      {/* View + record payment */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Invoice Details" size="lg">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div><p className="text-lg font-bold text-gray-900">{viewTarget.invoiceNumber}</p><p className="text-sm text-gray-500">{viewTarget.patientName}</p></div>
              <InvoiceStatusBadge status={viewTarget.status} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs font-medium text-gray-500">Date</p><p className="mt-0.5 text-gray-900">{viewTarget.date}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Due Date</p><p className="mt-0.5 text-gray-900">{viewTarget.dueDate}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Payment Method</p><p className="mt-0.5 text-gray-900">{viewTarget.paymentMethod || 'N/A'}</p></div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500"><th className="px-4 py-2">Description</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Unit</th><th className="px-4 py-2 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {viewTarget.items.map((item, i) => (
                    <tr key={i}><td className="px-4 py-2.5 text-sm text-gray-700">{item.description}</td><td className="px-4 py-2.5 text-center text-sm text-gray-600">{item.quantity}</td><td className="px-4 py-2.5 text-right text-sm text-gray-600">${item.unitPrice}</td><td className="px-4 py-2.5 text-right text-sm font-medium text-gray-900">${item.total}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t border-gray-200 bg-gray-50"><td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total:</td><td className="px-4 py-3 text-right text-lg font-bold text-gray-900">${viewTarget.amount.toLocaleString()}</td></tr></tfoot>
              </table>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3">
              <span className="text-sm font-medium text-primary-700">Paid: ${viewTarget.paidAmount.toLocaleString()}</span>
              <span className="text-sm font-bold text-primary-900">Balance: ${(viewTarget.amount - viewTarget.paidAmount).toLocaleString()}</span>
            </div>
            {viewTarget.status !== 'Paid' && (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-900">Record a payment</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input className="input-field pl-7" type="number" min={0} step="0.01" value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)} placeholder={`up to ${(viewTarget.amount - viewTarget.paidAmount).toFixed(2)}`} />
                  </div>
                  <button className="btn-primary" onClick={recordPayment} disabled={paying}>
                    {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Record
                  </button>
                </div>
              </div>
            )}
            <button className="btn-secondary w-full" disabled={downloading === viewTarget.id} onClick={() => downloadPdf(viewTarget)}>
              {downloading === viewTarget.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download PDF
            </button>
          </div>
        )}
      </Modal>

      {/* Create invoice */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Invoice" size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Create</button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <select className="input-field" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>)}
            </select>
          </Field>
          <Field label="Payment Method">
            <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod | '' })}>
              <option value="">— (unpaid)</option>
              {(['Cash', 'Card', 'Insurance', 'Online'] as PaymentMethod[]).map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Invoice Date"><input className="input-field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Due Date"><input className="input-field" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Line Items</label>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700" onClick={() => setForm((f) => ({ ...f, items: [...f.items, { ...emptyLine }] }))}>
              <Plus className="mr-1 inline h-3.5 w-3.5" />Add line
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {form.items.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="input-field flex-1" placeholder="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                <input className="input-field w-16" type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, { quantity: parseInt(e.target.value) || 1 })} />
                <input className="input-field w-24" type="number" min={0} step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: parseFloat(e.target.value) || 0 })} />
                <span className="w-20 text-right text-sm font-medium text-gray-700">${(l.quantity * l.unitPrice).toFixed(2)}</span>
                {form.items.length > 1 && (
                  <button className="text-error-500 hover:text-error-700" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
            <span className="text-sm font-medium text-gray-700">Invoice total</span>
            <span className="text-base font-bold text-gray-900">${formTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4">
          <Field label="Amount paid now (optional)">
            <input className="input-field" type="number" min={0} step="0.01" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })} />
          </Field>
        </div>

        {formError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{formError}</div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
