import { useEffect, useState, useCallback } from 'react';
import { Receipt, Eye, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { InvoiceStatusBadge } from '@/components/ui/StatusBadge';
import { invoiceApi } from '@/services/api';
import type { Invoice, InvoiceStatus } from '@/types';

export function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<Invoice | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    invoiceApi.list().then(setInvoices).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices
    .filter((i) => i.patientName.toLowerCase().includes(search.toLowerCase()) || i.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
    .filter((i) => statusFilter === 'all' || i.status === statusFilter);
  const pageSize = 8;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalRevenue = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const pending = invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', sortable: true, render: (i) => <span className="font-mono text-xs font-medium text-primary-600">{i.invoiceNumber}</span> },
    { key: 'patientName', header: 'Patient', sortable: true, render: (i) => <span className="font-medium text-gray-900">{i.patientName}</span> },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'dueDate', header: 'Due Date', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, render: (i) => <span className="font-semibold text-gray-900">${i.amount.toLocaleString()}</span> },
    { key: 'paidAmount', header: 'Paid', render: (i) => <span className="text-gray-600">${i.paidAmount.toLocaleString()}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (i) => <InvoiceStatusBadge status={i.status} /> },
    { key: 'actions', header: '', align: 'right', render: (i) => (
      <button onClick={(e) => { e.stopPropagation(); setViewTarget(i); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="success" trend={{ value: 15, positive: true }} />
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
          onRowClick={(i) => setViewTarget(i)}
          actions={
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-primary-500 focus:outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              {(['Paid', 'Pending', 'Overdue', 'Partial'] as InvoiceStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          }
        />
      )}

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
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Line Items</h4>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-200 bg-gray-50"><th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Description</th><th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-500">Qty</th><th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Unit Price</th><th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Total</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewTarget.items.map((item, i) => (
                      <tr key={i}><td className="px-4 py-2.5 text-sm text-gray-700">{item.description}</td><td className="px-4 py-2.5 text-center text-sm text-gray-600">{item.quantity}</td><td className="px-4 py-2.5 text-right text-sm text-gray-600">${item.unitPrice}</td><td className="px-4 py-2.5 text-right text-sm font-medium text-gray-900">${item.total}</td></tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t border-gray-200 bg-gray-50"><td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total:</td><td className="px-4 py-3 text-right text-lg font-bold text-gray-900">${viewTarget.amount.toLocaleString()}</td></tr></tfoot>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3">
              <span className="text-sm font-medium text-primary-700">Paid: ${viewTarget.paidAmount.toLocaleString()}</span>
              <span className="text-sm font-bold text-primary-900">Balance: ${(viewTarget.amount - viewTarget.paidAmount).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
