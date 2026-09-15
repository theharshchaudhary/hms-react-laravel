import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, Download, Loader2, Pill } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { portalApi } from '@/services/api';
import type { MedicineSale } from '@/types';

const statusVariant = (s: MedicineSale['status']) => (s === 'Paid' ? 'success' : s === 'Partial' ? 'info' : 'warning');

export function PortalPharmacy() {
  const [items, setItems] = useState<MedicineSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [view, setView] = useState<MedicineSale | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    portalApi.medicineSales().then(setItems).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const download = async (sale: MedicineSale) => {
    setDownloading(sale.id);
    try { await portalApi.downloadMedicineSale(sale.id, sale.saleNumber); }
    finally { setDownloading(null); }
  };

  if (loading) return <SectionLoader label="Loading your pharmacy purchases..." />;
  if (error) return <ErrorState message="Could not load your pharmacy purchases" onRetry={load} />;

  const totalSpent = items.reduce((s, i) => s + i.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Purchases" value={items.length} icon={ShoppingBag} color="primary" />
        <StatCard label="Total Spent" value={`$${totalSpent.toFixed(2)}`} icon={Pill} color="success" />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No pharmacy purchases" message="Medicines you buy at our pharmacy counter will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3">Bill #</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((sale) => (
                <tr key={sale.id} className="text-sm hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <button className="font-mono text-xs font-medium text-primary-600 hover:underline" onClick={() => setView(sale)}>{sale.saleNumber}</button>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{sale.date}</td>
                  <td className="px-5 py-3.5 text-gray-600">{sale.items.length} medicine{sale.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">${sale.total.toFixed(2)}</td>
                  <td className="px-5 py-3.5"><Badge variant={statusVariant(sale.status)} dot>{sale.status}</Badge></td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="btn-secondary text-xs" disabled={downloading === sale.id} onClick={() => download(sale)}>
                      {downloading === sale.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title="Pharmacy Bill" size="lg">
        {view && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-lg font-bold text-gray-900">{view.saleNumber}</p>
                <p className="text-sm text-gray-500">{view.date}{view.servedBy ? ` · Served by ${view.servedBy}` : ''}</p>
              </div>
              <Badge variant={statusVariant(view.status)} dot>{view.status}</Badge>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-2">Medicine</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Unit</th><th className="px-4 py-2 text-right">Total</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {view.items.map((it, i) => (
                    <tr key={i}><td className="px-4 py-2.5 text-gray-700">{it.name} <span className="text-xs text-gray-400">({it.unit})</span></td><td className="px-4 py-2.5 text-center text-gray-600">{it.quantity}</td><td className="px-4 py-2.5 text-right text-gray-600">${it.unitPrice.toFixed(2)}</td><td className="px-4 py-2.5 text-right font-medium text-gray-900">${it.total.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${view.subtotal.toFixed(2)}</span></div>
              {view.discount > 0 && <div className="flex justify-between text-gray-600"><span>Discount</span><span>-${view.discount.toFixed(2)}</span></div>}
              {view.tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>${view.tax.toFixed(2)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900"><span>Total</span><span>${view.total.toFixed(2)}</span></div>
            </div>
            <button className="btn-primary w-full" disabled={downloading === view.id} onClick={() => download(view)}>
              {downloading === view.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download Invoice
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
