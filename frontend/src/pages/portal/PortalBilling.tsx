import { useEffect, useState, useCallback } from 'react';
import { Receipt, Download, Loader2, Wallet } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { InvoiceStatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { portalApi } from '@/services/api';
import type { Invoice } from '@/types';

export function PortalBilling() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [view, setView] = useState<Invoice | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    portalApi.invoices().then(setItems).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const download = async (inv: Invoice) => {
    setDownloading(inv.id);
    try { await portalApi.downloadInvoice(inv.id, inv.invoiceNumber); }
    finally { setDownloading(null); }
  };

  if (loading) return <SectionLoader label="Loading invoices..." />;
  if (error) return <ErrorState message="Could not load your invoices" onRetry={load} />;

  const balance = items.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const paid = items.reduce((s, i) => s + i.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Invoices" value={items.length} icon={Receipt} color="primary" />
        <StatCard label="Total Paid" value={`$${paid.toLocaleString()}`} icon={Wallet} color="success" />
        <StatCard label="Outstanding" value={`$${balance.toLocaleString()}`} icon={Wallet} color={balance > 0 ? 'warning' : 'success'} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices" message="Your billing history will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((inv) => (
                <tr key={inv.id} className="text-sm hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <button className="font-mono text-xs font-medium text-primary-600 hover:underline" onClick={() => setView(inv)}>
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{inv.date}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">${inv.amount.toLocaleString()}</td>
                  <td className="px-5 py-3.5"><InvoiceStatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="btn-secondary text-xs" disabled={downloading === inv.id} onClick={() => download(inv)}>
                      {downloading === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title="Invoice Details" size="lg">
        {view && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div><p className="text-lg font-bold text-gray-900">{view.invoiceNumber}</p><p className="text-sm text-gray-500">Issued {view.date} · Due {view.dueDate}</p></div>
              <InvoiceStatusBadge status={view.status} />
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-2">Description</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Unit</th><th className="px-4 py-2 text-right">Total</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {view.items.map((it, i) => (
                    <tr key={i}><td className="px-4 py-2.5 text-gray-700">{it.description}</td><td className="px-4 py-2.5 text-center text-gray-600">{it.quantity}</td><td className="px-4 py-2.5 text-right text-gray-600">${it.unitPrice}</td><td className="px-4 py-2.5 text-right font-medium text-gray-900">${it.total}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3">
              <span className="text-sm font-medium text-primary-700">Paid: ${view.paidAmount.toLocaleString()}</span>
              <span className="text-sm font-bold text-primary-900">Balance: ${(view.amount - view.paidAmount).toLocaleString()}</span>
            </div>
            <button className="btn-primary w-full" disabled={downloading === view.id} onClick={() => download(view)}>
              {downloading === view.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
