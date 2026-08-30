import { useEffect, useState, useCallback } from 'react';
import { FileText, Search, Filter, FileImage, FlaskConical, Activity, Stethoscope, HeartPulse } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { recordApi } from '@/services/api';
import type { MedicalRecord } from '@/types';

const typeIcons: Record<string, typeof FileText> = {
  'Lab Report': FlaskConical, 'Diagnosis': Stethoscope, 'Treatment': Activity, 'Imaging': FileImage, 'Vitals': HeartPulse,
};

export function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<MedicalRecord | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    recordApi.list().then(setRecords).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = records
    .filter((r) => r.patientName.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase()) || r.doctorName.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => typeFilter === 'all' || r.type === typeFilter);
  const pageSize = 8;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<MedicalRecord>[] = [
    { key: 'date', header: 'Date', sortable: true, render: (r) => <span className="text-sm text-gray-600">{r.date}</span> },
    { key: 'type', header: 'Type', sortable: true, render: (r) => {
      const Icon = typeIcons[r.type] || FileText;
      return <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary-500" /><span className="text-sm text-gray-700">{r.type}</span></div>;
    }},
    { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="font-medium text-gray-900">{r.title}</span> },
    { key: 'patientName', header: 'Patient', sortable: true },
    { key: 'doctorName', header: 'Doctor', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge variant={r.status === 'Critical' ? 'error' : r.status === 'Under Observation' ? 'warning' : 'success'} dot>{r.status}</Badge> },
    { key: 'attachments', header: 'Files', render: (r) => r.attachments ? <Badge variant="neutral">{r.attachments} file{r.attachments > 1 ? 's' : ''}</Badge> : <span className="text-xs text-gray-400">—</span> },
    { key: 'actions', header: '', align: 'right', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); setViewTarget(r); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"><FileText className="h-4 w-4" /></button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Records" value={records.length} icon={FileText} color="primary" />
        <StatCard label="Critical" value={records.filter((r) => r.status === 'Critical').length} icon={HeartPulse} color="error" />
        <StatCard label="Observation" value={records.filter((r) => r.status === 'Under Observation').length} icon={Activity} color="warning" />
        <StatCard label="Normal" value={records.filter((r) => r.status === 'Normal').length} icon={FileText} color="success" />
      </div>

      {error ? <ErrorState message="Failed to load records" onRetry={load} /> : loading ? <SectionLoader /> : (
        <DataTable
          columns={columns} data={paged} rowKey={(r) => r.id}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by patient, title, or doctor..."
          currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length}
          onRowClick={(r) => setViewTarget(r)}
          actions={
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select className="rounded-lg border border-gray-200 py-2 pl-9 pr-8 text-sm text-gray-600 focus:border-primary-500 focus:outline-none" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                <option value="all">All Types</option>
                {['Lab Report', 'Diagnosis', 'Treatment', 'Imaging', 'Vitals'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          }
        />
      )}

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Medical Record" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div><p className="text-lg font-bold text-gray-900">{viewTarget.title}</p><p className="text-sm text-gray-500">{viewTarget.patientName} · {viewTarget.date}</p></div>
              <Badge variant={viewTarget.status === 'Critical' ? 'error' : viewTarget.status === 'Under Observation' ? 'warning' : 'success'} dot>{viewTarget.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs font-medium text-gray-500">Type</p><p className="mt-0.5 text-gray-900">{viewTarget.type}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Doctor</p><p className="mt-0.5 text-gray-900">{viewTarget.doctorName}</p></div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4"><p className="text-sm text-gray-600">{viewTarget.description}</p></div>
            {viewTarget.attachments && <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-3"><FileImage className="h-5 w-5 text-primary-600" /><span className="text-sm text-primary-700">{viewTarget.attachments} attachment{viewTarget.attachments > 1 ? 's' : ''}</span></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
