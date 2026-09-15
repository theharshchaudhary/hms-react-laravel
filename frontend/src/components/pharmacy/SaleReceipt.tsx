import { forwardRef } from 'react';
import { HeartPulse } from 'lucide-react';
import { useHospitalProfile } from '@/lib/hospital';
import type { MedicineSale } from '@/types';

const money = (n: number) => `$${n.toFixed(2)}`;

// Deterministic "barcode" stripes derived from the sale number.
function stripes(seed: string): number[] {
  return Array.from({ length: 42 }, (_, i) => ((seed.charCodeAt(i % seed.length) * (i + 7)) % 3) + 1);
}

interface SaleReceiptProps {
  sale: MedicineSale;
  change?: number;
}

export const SaleReceipt = forwardRef<HTMLDivElement, SaleReceiptProps>(({ sale, change = 0 }, ref) => {
  const seller = useHospitalProfile();
  const balance = Math.max(0, sale.total - sale.paidAmount);

  return (
    <div ref={ref} className="mx-auto w-full max-w-md bg-white text-gray-900">
      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft">
        {/* Header */}
        <div className="bg-gradient-to-br from-success-600 to-success-700 px-6 py-6 text-center text-white">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <HeartPulse className="h-6 w-6" />
          </div>
          <p className="mt-2 font-display text-lg font-bold tracking-wide">{seller?.pharmacyName ?? 'MediCore Pharmacy'}</p>
          {seller && <p className="text-xs text-success-100">{seller.address} · {seller.phone}</p>}
          {seller?.taxNumber && <p className="mt-1 text-xs font-semibold tracking-wide">{seller.taxLabel}: {seller.taxNumber}</p>}
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start justify-between text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Invoice</p>
              <p className="font-mono font-semibold">{sale.saleNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-400">Date</p>
              <p className="font-medium">{new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{sale.customerName}</span></div>
            {sale.customerPhone && <div className="mt-1 flex justify-between"><span className="text-gray-500">Phone</span><span>{sale.customerPhone}</span></div>}
            {sale.servedBy && <div className="mt-1 flex justify-between"><span className="text-gray-500">Served by</span><span>{sale.servedBy}</span></div>}
          </div>

          {/* Items */}
          <div className="mt-5 border-y border-dashed border-gray-300 py-3">
            <div className="flex text-xs font-semibold uppercase tracking-wider text-gray-400">
              <span className="flex-1">Item</span><span className="w-10 text-center">Qty</span><span className="w-20 text-right">Amount</span>
            </div>
            <div className="mt-2 space-y-2">
              {sale.items.map((it, i) => (
                <div key={i} className="flex items-start text-sm">
                  <div className="flex-1 pr-2">
                    <p className="font-medium leading-tight">{it.name}</p>
                    <p className="text-xs text-gray-500">{money(it.unitPrice)} / {it.unit}</p>
                  </div>
                  <span className="w-10 text-center tabular-nums">{it.quantity}</span>
                  <span className="w-20 text-right font-medium tabular-nums">{money(it.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-3 space-y-1.5 text-sm tabular-nums">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-success-700"><span>Discount</span><span>−{money(sale.discount)}</span></div>}
            {sale.tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>{money(sale.tax)}</span></div>}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold"><span>Total</span><span>{money(sale.total)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Paid{sale.paymentMethod ? ` · ${sale.paymentMethod}` : ''}</span><span>{money(sale.paidAmount + change)}</span></div>
            {change > 0 && <div className="flex justify-between font-medium text-primary-700"><span>Change returned</span><span>{money(change)}</span></div>}
            {balance > 0 && <div className="flex justify-between font-semibold text-error-600"><span>Balance due</span><span>{money(balance)}</span></div>}
          </div>

          <div className="mt-4 flex justify-center">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              sale.status === 'Paid' ? 'bg-success-100 text-success-700' : sale.status === 'Partial' ? 'bg-primary-100 text-primary-700' : 'bg-warning-100 text-warning-700'
            }`}>{sale.status}</span>
          </div>

          {/* Barcode + footer */}
          <div className="mt-5 flex h-10 items-end justify-center gap-[2px]">
            {stripes(sale.saleNumber).map((w, i) => (
              <span key={i} className="block h-full bg-gray-800" style={{ width: `${w}px`, opacity: i % 5 === 0 ? 0.6 : 1 }} />
            ))}
          </div>
          <p className="mt-1 text-center font-mono text-[10px] tracking-[0.3em] text-gray-500">{sale.saleNumber}</p>

          <p className="mt-4 text-center text-xs text-gray-500">
            Please verify medicines and dosage before use.<br />Thank you for choosing MediCore.
          </p>
        </div>
      </div>
    </div>
  );
});

SaleReceipt.displayName = 'SaleReceipt';
