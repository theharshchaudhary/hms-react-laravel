import { useEffect, useState, useCallback } from 'react';
import { Pill, Plus, Eye, Search } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { prescriptionApi } from '@/services/api';
import type { Prescription } from '@/types';

export function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<Prescription | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    prescriptionApi.list().then(setPrescriptions).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = prescriptions.filter((p) => p.patientName.toLowerCase().includes(search.toLowerCase()) || p.doctorName.toLowerCase().includes(search.toLowerCase()) || p.diagnosis.toLowerCase().includes(search.toLowerCase()));
  const pageSize = 8;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Prescription>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (p) => <span className="text-sm text-gray-600">{p.date}</span> },
    { key: 'patientName', header: 'Patient', sortable: true, render: (p) => <span className="font-medium text-gray-900">{p.patientName}</span> },
    { key: 'doctorName', header: 'Prescribed By', sortable: true },
    { key: 'diagnosis', header: 'Diagnosis', render: (p) => <span className="text-gray-700">{p.diagnosis}</span> },
    { key: 'medications', header: 'Medications', render: (p) => <Badge variant="info">{p.medications.length} items</Badge> },
    { key: 'status', header: 'Status', sortable: true, render: (p) => <Badge variant={p.status === 'Active' ? 'success' : p.status === 'Completed' ? 'neutral' : 'warning'} dot>{p.status}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => (
      <button onClick={(e) => { e.stopPropagation(); setViewTarget(p); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><Eye className="h-4 w-4" /></button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Prescriptions" value={prescriptions.length} icon={Pill} color="primary" />
        <StatCard label="Active" value={prescriptions.filter((p) => p.status === 'Active').length} icon={Pill} color="success" />
        <StatCard label="Completed" value={prescriptions.filter((p) => p.status === 'Completed').length} icon={Pill} color="primary" />
      </div>

      {error ? <ErrorState message="Failed to load prescriptions" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(p) => p.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by patient, doctor, or diagnosis..."
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          onRowClick={(p) => setViewTarget(p)}
        />
      )}

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Prescription Details" size="lg">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div><p className="text-lg font-bold text-gray-900">{viewTarget.patientName}</p><p className="text-sm text-gray-500">Prescribed by {viewTarget.doctorName}</p></div>
              <div className="text-right"><p className="text-sm text-gray-500">{viewTarget.date}</p><Badge variant={viewTarget.status === 'Active' ? 'success' : viewTarget.status === 'Completed' ? 'neutral' : 'warning'} dot>{viewTarget.status}</Badge></div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-primary-50 px-4 py-3"><p className="text-sm font-medium text-primary-700">Diagnosis: {viewTarget.diagnosis}</p></div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Medications</h4>
              <div className="mt-3 space-y-3">
                {viewTarget.medications.map((med, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                      <Badge variant="info">{med.dosage}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Duration: {med.duration}</p>
                    <p className="mt-1 text-sm text-gray-600">{med.instructions}</p>
                  </div>
                ))}
              </div>
            </div>
            {viewTarget.notes && <div className="rounded-lg bg-warning-50 p-3"><p className="text-sm text-warning-700"><span className="font-semibold">Notes:</span> {viewTarget.notes}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
