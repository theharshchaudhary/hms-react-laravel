import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ShoppingCart, Package, History, Search, Plus, Minus, Trash2, Printer, Download, Loader2,
  AlertCircle, AlertTriangle, CheckCircle2, Pencil, PackagePlus, User, UserPlus, FileText, Wallet, Eye,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { SaleReceipt } from '@/components/pharmacy/SaleReceipt';
import { useAuth } from '@/context/AuthContext';
import { printElement } from '@/lib/print';
import {
  medicineApi, medicineSaleApi, patientApi, prescriptionApi, ApiError,
} from '@/services/api';
import type { Medicine, MedicineSale, MedicineCategory, Patient, Prescription, PaymentMethod } from '@/types';

type Tab = 'sale' | 'history' | 'inventory';
type CartLine = { medicine: Medicine; quantity: number };

const CATEGORIES: MedicineCategory[] = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other'];
const METHODS: PaymentMethod[] = ['Cash', 'Card', 'Insurance', 'Online'];
const money = (n: number) => `$${n.toFixed(2)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const errMsg = (err: unknown, fallback: string) =>
  err instanceof ApiError && err.errors ? Object.values(err.errors).flat()[0]
    : err instanceof Error ? err.message : fallback;

export function PharmacyPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'super_admin' || user?.role === 'admin';

  const [tab, setTab] = useState<Tab>('sale');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<MedicineSale[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    Promise.all([medicineApi.list(), medicineSaleApi.list(), patientApi.list()])
      .then(([m, s, p]) => { setMedicines(m); setSales(s); setPatients(p); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const refreshStockAndSales = () =>
    Promise.all([medicineApi.list(), medicineSaleApi.list()]).then(([m, s]) => { setMedicines(m); setSales(s); });

  // Receipt modal shared by the sale + history tabs.
  const [receipt, setReceipt] = useState<{ sale: MedicineSale; change: number } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (sale: MedicineSale) => {
    setDownloading(sale.id);
    try { await medicineSaleApi.downloadInvoice(sale.id, sale.saleNumber); }
    finally { setDownloading(null); }
  };

  const lowStock = medicines.filter((m) => m.lowStock).length;
  const expiring = medicines.filter((m) => m.expiringSoon).length;
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter((s) => s.date === today);
  const todaysRevenue = todaysSales.reduce((s, x) => s + x.paidAmount, 0);

  if (loading) return <SectionLoader label="Loading pharmacy..." />;
  if (error) return <ErrorState message="Failed to load the pharmacy" onRetry={load} />;

  const tabs: { key: Tab; label: string; icon: typeof ShoppingCart }[] = [
    { key: 'sale', label: 'New Sale', icon: ShoppingCart },
    { key: 'history', label: 'Sales History', icon: History },
    { key: 'inventory', label: 'Inventory', icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales Today" value={todaysSales.length} icon={ShoppingCart} color="primary" />
        <StatCard label="Revenue Today" value={money(todaysRevenue)} icon={Wallet} color="success" />
        <StatCard label="Low Stock" value={lowStock} icon={AlertTriangle} color={lowStock ? 'error' : 'success'} subtitle={`${medicines.length} medicines`} />
        <StatCard label="Expiring ≤ 60 days" value={expiring} icon={AlertCircle} color={expiring ? 'warning' : 'success'} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-b-2 border-primary-500 bg-primary-50/50 text-primary-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sale' && (
        <NewSale
          medicines={medicines}
          patients={patients}
          onCompleted={(sale, change) => { setReceipt({ sale, change }); refreshStockAndSales(); }}
        />
      )}

      {tab === 'history' && (
        <SalesHistory
          sales={sales}
          downloading={downloading}
          onView={(sale) => setReceipt({ sale, change: 0 })}
          onDownload={download}
          onUpdated={(updated) => setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
        />
      )}

      {tab === 'inventory' && (
        <Inventory medicines={medicines} canManage={canManage} onChanged={refreshStockAndSales} />
      )}

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Invoice" size="md"
        footer={receipt && <>
          <button className="btn-secondary" onClick={() => setReceipt(null)}>Close</button>
          <button className="btn-secondary" disabled={downloading === receipt.sale.id} onClick={() => download(receipt.sale)}>
            {downloading === receipt.sale.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}PDF
          </button>
          <button className="btn-primary" onClick={() => receiptRef.current && printElement(receiptRef.current, receipt.sale.saleNumber)}>
            <Printer className="h-4 w-4" />Print
          </button>
        </>}>
        {receipt && <SaleReceipt ref={receiptRef} sale={receipt.sale} change={receipt.change} />}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New sale (point of sale)                                            */
/* ------------------------------------------------------------------ */

function NewSale({ medicines, patients, onCompleted }: {
  medicines: Medicine[];
  patients: Patient[];
  onCompleted: (sale: MedicineSale, change: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [mode, setMode] = useState<'patient' | 'walkin'>('walkin');
  const [patientId, setPatientId] = useState('');
  const [walkName, setWalkName] = useState('');
  const [walkPhone, setWalkPhone] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [received, setReceived] = useState('');
  const [receivedTouched, setReceivedTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  useEffect(() => {
    if (mode !== 'patient' || !patientId) { setPrescriptions([]); return; }
    prescriptionApi.list({ patientId }).then((rx) => setPrescriptions(rx.filter((r) => r.status === 'Active'))).catch(() => setPrescriptions([]));
  }, [mode, patientId]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines
      .filter((m) => !q || [m.name, m.genericName, m.manufacturer, m.category].join(' ').toLowerCase().includes(q))
      .slice(0, 30);
  }, [medicines, search]);

  const inCart = (id: string) => cart.find((l) => l.medicine.id === id)?.quantity ?? 0;

  const add = (m: Medicine, qty = 1) => {
    setFormError(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.medicine.id === m.id);
      const next = Math.min(m.stockQuantity, (existing?.quantity ?? 0) + qty);
      if (next <= 0) return prev;
      return existing
        ? prev.map((l) => (l.medicine.id === m.id ? { ...l, quantity: next } : l))
        : [...prev, { medicine: m, quantity: next }];
    });
  };
  const setQty = (id: string, qty: number) =>
    setCart((prev) => prev.map((l) => (l.medicine.id === id ? { ...l, quantity: Math.max(1, Math.min(l.medicine.stockQuantity, qty || 1)) } : l)));
  const remove = (id: string) => setCart((prev) => prev.filter((l) => l.medicine.id !== id));

  const loadPrescription = (rx: Prescription) => {
    const missing: string[] = [];
    rx.medications.forEach((med) => {
      const key = med.name.trim().toLowerCase();
      const match = medicines.find((m) =>
        m.name.toLowerCase().split(' ')[0] === key.split(' ')[0]
        || (m.genericName || '').toLowerCase() === key
        || m.name.toLowerCase().includes(key));
      if (match && match.stockQuantity > 0) add(match, 1);
      else missing.push(med.name);
    });
    setNotice(missing.length ? `Added from prescription. Not available in stock: ${missing.join(', ')}.` : 'All prescribed medicines added to the cart.');
  };

  const subtotal = round2(cart.reduce((s, l) => s + l.quantity * l.medicine.unitPrice, 0));
  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const taxNum = Math.max(0, parseFloat(tax) || 0);
  const total = round2(Math.max(0, subtotal - discountNum + taxNum));
  const receivedNum = receivedTouched ? Math.max(0, parseFloat(received) || 0) : total;
  const paidAmount = round2(Math.min(receivedNum, total));
  const change = round2(Math.max(0, receivedNum - total));
  const balance = round2(total - paidAmount);

  const reset = () => {
    setCart([]); setPatientId(''); setWalkName(''); setWalkPhone(''); setDiscount(''); setTax('');
    setReceived(''); setReceivedTouched(false); setNotes(''); setMethod('Cash'); setNotice(null); setFormError(null);
  };

  const complete = async () => {
    setFormError(null);
    if (cart.length === 0) { setFormError('Add at least one medicine to the cart.'); return; }
    if (mode === 'patient' && !patientId) { setFormError('Select a patient, or switch to walk-in.'); return; }
    if (mode === 'walkin' && !walkName.trim()) { setFormError("Enter the customer's name."); return; }
    if (discountNum > subtotal) { setFormError('Discount cannot exceed the subtotal.'); return; }

    setSubmitting(true);
    try {
      const sale = await medicineSaleApi.create({
        ...(mode === 'patient' ? { patientId } : { customerName: walkName.trim(), customerPhone: walkPhone.trim() || undefined }),
        items: cart.map((l) => ({ medicineId: l.medicine.id, quantity: l.quantity })),
        discount: discountNum,
        tax: taxNum,
        paidAmount,
        paymentMethod: method,
        notes: notes.trim() || undefined,
      });
      const changeDue = change;
      reset();
      onCompleted(sale, changeDue);
    } catch (err) {
      setFormError(errMsg(err, 'Could not complete the sale.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Catalogue */}
      <div className="card p-5 lg:col-span-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input autoFocus className="input-field pl-9" placeholder="Search medicine, generic name, brand..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mt-4 grid max-h-[560px] gap-2 overflow-y-auto scrollbar-thin pr-1 sm:grid-cols-2">
          {results.map((m) => {
            const available = m.stockQuantity - inCart(m.id);
            const out = m.stockQuantity === 0;
            return (
              <button key={m.id} onClick={() => add(m)} disabled={available <= 0}
                className={`group flex flex-col rounded-xl border p-3 text-left transition-all ${
                  available <= 0 ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 hover:border-primary-300 hover:shadow-soft'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{m.name}</p>
                    <p className="truncate text-xs text-gray-500">{m.genericName || m.category} · {m.unit}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gray-900">{money(m.unitPrice)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs ${out ? 'text-error-600' : m.lowStock ? 'text-warning-600' : 'text-gray-500'}`}>
                    {out ? 'Out of stock' : `${m.stockQuantity} in stock`}{m.lowStock && !out ? ' · low' : ''}
                  </span>
                  {available > 0 && <span className="flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100"><Plus className="h-3.5 w-3.5" />Add</span>}
                </div>
              </button>
            );
          })}
          {results.length === 0 && <p className="col-span-2 py-10 text-center text-sm text-gray-500">No medicines match "{search}".</p>}
        </div>
      </div>

      {/* Cart / checkout */}
      <div className="space-y-4 lg:col-span-2">
        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-900">Customer</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setMode('walkin')} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${mode === 'walkin' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
              <UserPlus className="h-4 w-4" />Walk-in
            </button>
            <button onClick={() => setMode('patient')} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${mode === 'patient' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
              <User className="h-4 w-4" />Registered patient
            </button>
          </div>

          {mode === 'walkin' ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="input-field" placeholder="Customer name" value={walkName} onChange={(e) => setWalkName(e.target.value)} />
              <input className="input-field" placeholder="Phone (optional)" value={walkPhone} onChange={(e) => setWalkPhone(e.target.value)} />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <select className="input-field" value={patientId} onChange={(e) => { setPatientId(e.target.value); setNotice(null); }}>
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>)}
              </select>
              {prescriptions.length > 0 && (
                <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3">
                  <p className="text-xs font-semibold text-primary-800">Active prescriptions</p>
                  <div className="mt-2 space-y-1.5">
                    {prescriptions.map((rx) => (
                      <div key={rx.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate text-primary-900">
                          <FileText className="mr-1 inline h-3.5 w-3.5" />{rx.diagnosis} · {rx.medications.map((m) => m.name).join(', ')}
                        </span>
                        <button onClick={() => loadPrescription(rx)} className="shrink-0 rounded bg-white px-2 py-1 font-medium text-primary-700 hover:bg-primary-100">Add to cart</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {notice && <p className="mt-2 text-xs text-primary-700">{notice}</p>}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Cart</p>
            {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-gray-500 hover:text-error-600">Clear</button>}
          </div>

          {cart.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-gray-300" />Tap a medicine to add it.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-gray-100">
              {cart.map((l) => (
                <div key={l.medicine.id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{l.medicine.name}</p>
                    <p className="text-xs text-gray-500">{money(l.medicine.unitPrice)} × {l.quantity}</p>
                  </div>
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button aria-label="Decrease" onClick={() => setQty(l.medicine.id, l.quantity - 1)} className="px-2 py-1 text-gray-500 hover:text-gray-900"><Minus className="h-3.5 w-3.5" /></button>
                    <input aria-label={`Quantity of ${l.medicine.name}`} className="w-10 border-x border-gray-200 py-1 text-center text-sm tabular-nums focus:outline-none" value={l.quantity}
                      onChange={(e) => setQty(l.medicine.id, parseInt(e.target.value))} />
                    <button aria-label="Increase" onClick={() => setQty(l.medicine.id, l.quantity + 1)} disabled={l.quantity >= l.medicine.stockQuantity}
                      className="px-2 py-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold tabular-nums">{money(l.quantity * l.medicine.unitPrice)}</span>
                  <button aria-label={`Remove ${l.medicine.name}`} onClick={() => remove(l.medicine.id)} className="text-gray-300 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Discount ($)</label>
              <input className="input-field" type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tax ($)</label>
              <input className="input-field" type="number" min={0} step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="mt-4 space-y-1 rounded-lg bg-gray-50 px-4 py-3 text-sm tabular-nums">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {discountNum > 0 && <div className="flex justify-between text-success-700"><span>Discount</span><span>−{money(discountNum)}</span></div>}
            {taxNum > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>{money(taxNum)}</span></div>}
            <div className="flex justify-between border-t border-gray-200 pt-1.5 text-lg font-bold text-gray-900"><span>Total</span><span>{money(total)}</span></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Payment</label>
              <select className="input-field" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Amount received ($)</label>
              <input className="input-field" type="number" min={0} step="0.01"
                value={receivedTouched ? received : total.toFixed(2)}
                onChange={(e) => { setReceivedTouched(true); setReceived(e.target.value); }} />
            </div>
          </div>
          {change > 0 && <p className="mt-2 text-sm font-medium text-primary-700">Change to return: {money(change)}</p>}
          {balance > 0 && cart.length > 0 && <p className="mt-2 text-sm font-medium text-warning-700">Balance due: {money(balance)} — sale will be marked {paidAmount > 0 ? 'Partial' : 'Pending'}.</p>}

          <input className="input-field mt-3" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          {formError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
              <AlertCircle className="h-4 w-4 shrink-0" />{formError}
            </div>
          )}

          <button onClick={complete} disabled={submitting || cart.length === 0} className="btn-primary mt-4 w-full py-3 text-base">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Complete Sale · {money(total)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sales history                                                       */
/* ------------------------------------------------------------------ */

function SalesHistory({ sales, downloading, onView, onDownload, onUpdated }: {
  sales: MedicineSale[];
  downloading: string | null;
  onView: (sale: MedicineSale) => void;
  onDownload: (sale: MedicineSale) => void;
  onUpdated: (sale: MedicineSale) => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [payTarget, setPayTarget] = useState<MedicineSale | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const filtered = sales
    .filter((s) => status === 'all' || s.status === status)
    .filter((s) => [s.saleNumber, s.customerName].join(' ').toLowerCase().includes(search.toLowerCase()));

  const recordPayment = async () => {
    if (!payTarget) return;
    const add = parseFloat(payAmount);
    if (!add || add <= 0) return;
    setPaying(true);
    try {
      const updated = await medicineSaleApi.update(payTarget.id, { paidAmount: Math.min(payTarget.total, payTarget.paidAmount + add) });
      onUpdated(updated);
      setPayTarget(null);
      setPayAmount('');
    } finally { setPaying(false); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by bill # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option><option>Paid</option><option>Partial</option><option>Pending</option>
        </select>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Bill #</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id} className="text-sm hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-medium text-primary-600">{s.saleNumber}</td>
                <td className="px-4 py-3 text-gray-600">{s.date}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.customerName}</p>
                  <p className="text-xs text-gray-500">{s.patientId ? 'Patient' : 'Walk-in'}{s.servedBy ? ` · ${s.servedBy}` : ''}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="px-4 py-3 font-semibold tabular-nums text-gray-900">{money(s.total)}</td>
                <td className="px-4 py-3"><Badge variant={s.status === 'Paid' ? 'success' : s.status === 'Partial' ? 'info' : 'warning'} dot>{s.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {s.status !== 'Paid' && (
                      <button onClick={() => { setPayTarget(s); setPayAmount(''); }} className="rounded-lg bg-success-50 px-2 py-1 text-xs font-medium text-success-700 hover:bg-success-100">Collect</button>
                    )}
                    <button title="View / print" onClick={() => onView(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
                    <button title="Download PDF" disabled={downloading === s.id} onClick={() => onDownload(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600">
                      {downloading === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-6 py-12 text-center text-sm text-gray-500">No sales found.</p>}
      </div>

      <Modal open={!!payTarget} onClose={() => setPayTarget(null)} title="Collect Payment" size="sm"
        footer={<>
          <button className="btn-secondary" onClick={() => setPayTarget(null)}>Cancel</button>
          <button className="btn-primary" onClick={recordPayment} disabled={paying}>{paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Record</button>
        </>}>
        {payTarget && (
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">{payTarget.saleNumber} · {payTarget.customerName}</p>
            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-2.5"><span>Balance due</span><span className="font-bold">{money(payTarget.total - payTarget.paidAmount)}</span></div>
            <input className="input-field" type="number" min={0} step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              placeholder={(payTarget.total - payTarget.paidAmount).toFixed(2)} />
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

const emptyMedicine = {
  name: '', genericName: '', category: 'Tablet' as MedicineCategory, manufacturer: '', unit: 'Strip of 10',
  unitPrice: 0, stockQuantity: 0, reorderLevel: 10, batchNumber: '', expiryDate: '',
};

function Inventory({ medicines, canManage, onChanged }: { medicines: Medicine[]; canManage: boolean; onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState<'all' | 'low' | 'expiring'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ ...emptyMedicine });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [restock, setRestock] = useState<Medicine | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);

  const filtered = medicines
    .filter((m) => category === 'all' || m.category === category)
    .filter((m) => filter === 'all' || (filter === 'low' ? m.lowStock : m.expiringSoon))
    .filter((m) => [m.name, m.genericName, m.manufacturer].join(' ').toLowerCase().includes(search.toLowerCase()));

  const stockValue = medicines.reduce((s, m) => s + m.stockQuantity * m.unitPrice, 0);

  const openCreate = () => { setEditing(null); setForm({ ...emptyMedicine }); setFormError(null); setModalOpen(true); };
  const openEdit = (m: Medicine) => {
    setEditing(m);
    setForm({
      name: m.name, genericName: m.genericName || '', category: m.category, manufacturer: m.manufacturer || '', unit: m.unit,
      unitPrice: m.unitPrice, stockQuantity: m.stockQuantity, reorderLevel: m.reorderLevel, batchNumber: m.batchNumber || '', expiryDate: m.expiryDate || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true); setFormError(null);
    const payload = { ...form, expiryDate: form.expiryDate || null, genericName: form.genericName || null, manufacturer: form.manufacturer || null, batchNumber: form.batchNumber || null };
    try {
      if (editing) await medicineApi.update(editing.id, payload);
      else await medicineApi.create(payload);
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setFormError(errMsg(err, 'Could not save the medicine.'));
    } finally { setSaving(false); }
  };

  const doRestock = async () => {
    if (!restock) return;
    const n = parseInt(restockQty);
    if (!n || n <= 0) return;
    await medicineApi.update(restock.id, { stockQuantity: restock.stockQuantity + n });
    setRestock(null); setRestockQty('');
    onChanged();
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await medicineApi.remove(deleteTarget.id);
    onChanged();
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field lg:w-40" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="flex gap-1">
          {(['all', 'low', 'expiring'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${filter === f ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f === 'all' ? 'All' : f === 'low' ? 'Low stock' : 'Expiring'}
            </button>
          ))}
        </div>
        {canManage && <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" />Add Medicine</button>}
      </div>

      <div className="flex items-center justify-between bg-gray-50/60 px-4 py-2 text-xs text-gray-500">
        <span>{filtered.length} of {medicines.length} medicines</span>
        <span>Stock value: <span className="font-semibold text-gray-700">{money(stockValue)}</span></span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Medicine</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th><th className="px-4 py-3">Expiry</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((m) => (
              <tr key={m.id} className="text-sm hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{[m.genericName, m.manufacturer].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="px-4 py-3"><Badge variant="info">{m.category}</Badge></td>
                <td className="px-4 py-3 tabular-nums"><span className="font-medium">{money(m.unitPrice)}</span><span className="text-xs text-gray-500"> / {m.unit}</span></td>
                <td className="px-4 py-3">
                  <span className={`font-semibold tabular-nums ${m.stockQuantity === 0 ? 'text-error-600' : m.lowStock ? 'text-warning-600' : 'text-gray-900'}`}>{m.stockQuantity}</span>
                  {m.lowStock && <Badge variant={m.stockQuantity === 0 ? 'error' : 'warning'} className="ml-2">{m.stockQuantity === 0 ? 'Out' : 'Low'}</Badge>}
                  <p className="text-xs text-gray-400">reorder at {m.reorderLevel}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={m.expiringSoon ? 'font-medium text-warning-700' : 'text-gray-600'}>{m.expiryDate || '—'}</span>
                  {m.batchNumber && <p className="font-mono text-xs text-gray-400">{m.batchNumber}</p>}
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button title="Restock" onClick={() => { setRestock(m); setRestockQty(''); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-success-600"><PackagePlus className="h-4 w-4" /></button>
                      <button title="Edit" onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-secondary-600"><Pencil className="h-4 w-4" /></button>
                      <button title="Delete" onClick={() => setDeleteTarget(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-6 py-12 text-center text-sm text-gray-500">No medicines match these filters.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Medicine' : 'Add Medicine'} size="lg"
        footer={<>
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save' : 'Add'}</button>
        </>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" /></Field>
          <Field label="Generic name"><input className="input-field" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} /></Field>
          <Field label="Category">
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MedicineCategory })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Manufacturer"><input className="input-field" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></Field>
          <Field label="Selling unit"><input className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Strip of 10, Bottle 100ml..." /></Field>
          <Field label="Unit price ($)"><input className="input-field" type="number" min={0} step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} /></Field>
          <Field label="Stock quantity"><input className="input-field" type="number" min={0} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Reorder level"><input className="input-field" type="number" min={0} value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Batch number"><input className="input-field" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></Field>
          <Field label="Expiry date"><input className="input-field" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
        </div>
        {formError && <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4" />{formError}</div>}
      </Modal>

      <Modal open={!!restock} onClose={() => setRestock(null)} title="Restock" size="sm"
        footer={<>
          <button className="btn-secondary" onClick={() => setRestock(null)}>Cancel</button>
          <button className="btn-primary" onClick={doRestock}><PackagePlus className="h-4 w-4" />Add stock</button>
        </>}>
        {restock && (
          <div className="space-y-3 text-sm">
            <p className="text-gray-600"><span className="font-medium text-gray-900">{restock.name}</span> — currently {restock.stockQuantity} in stock.</p>
            <Field label="Units received"><input autoFocus className="input-field" type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} /></Field>
            {parseInt(restockQty) > 0 && <p className="text-xs text-gray-500">New stock level: {restock.stockQuantity + parseInt(restockQty)}</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete}
        title="Delete Medicine" message={`Remove ${deleteTarget?.name} from inventory? Past invoices keep their line items.`} confirmLabel="Delete" danger />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
