import { useEffect, useState, useCallback } from 'react';
import { ListOrdered, Clock, Play, Check, SkipForward, ArrowUp, ArrowDown } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { StatCard } from '@/components/ui/StatCard';
import { QueueStatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { queueApi } from '@/services/api';
import type { QueueEntry, QueueStatus } from '@/types';

export function QueuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    queueApi.list().then(setQueue).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (entry: QueueEntry, status: QueueStatus) => {
    await queueApi.update(entry.id, { status, estimatedWait: status === 'In Consultation' || status === 'Done' ? 0 : entry.estimatedWait });
    load();
  };

  const movePriority = async (entry: QueueEntry, dir: 'up' | 'down') => {
    const sorted = [...queue].sort((a, b) => a.tokenNumber - b.tokenNumber);
    const idx = sorted.findIndex((q) => q.id === entry.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapEntry = sorted[swapIdx];
    await queueApi.update(entry.id, { tokenNumber: swapEntry.tokenNumber });
    await queueApi.update(swapEntry.id, { tokenNumber: entry.tokenNumber });
    load();
  };

  const waiting = queue.filter((q) => q.status === 'Waiting');
  const inConsult = queue.filter((q) => q.status === 'In Consultation');
  const done = queue.filter((q) => q.status === 'Done');
  const sorted = [...queue].sort((a, b) => a.tokenNumber - b.tokenNumber);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="In Queue" value={waiting.length} icon={ListOrdered} color="warning" />
        <StatCard label="In Consultation" value={inConsult.length} icon={Play} color="primary" />
        <StatCard label="Completed" value={done.length} icon={Check} color="success" />
        <StatCard label="Avg Wait" value={`${Math.round(waiting.reduce((s, q) => s + q.estimatedWait, 0) / (waiting.length || 1))} min`} icon={Clock} color="secondary" />
      </div>

      {error ? <ErrorState message="Failed to load queue" onRetry={load} /> : loading ? <SectionLoader /> : (
        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">Patient Queue</h3>
            <p className="text-sm text-gray-500">Manage patient flow and consultation order</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Doctor / Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Est. Wait</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">{entry.tokenNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><p className="text-sm font-medium text-gray-900">{entry.patientName}</p><p className="text-xs text-gray-500">{entry.patientId}</p></td>
                    <td className="px-4 py-3.5"><p className="text-sm text-gray-700">{entry.doctorName}</p><p className="text-xs text-gray-500">{entry.department}</p></td>
                    <td className="px-4 py-3.5"><PriorityBadge priority={entry.priority} /></td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{entry.checkInTime}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{entry.estimatedWait > 0 ? `${entry.estimatedWait} min` : '—'}</td>
                    <td className="px-4 py-3.5"><QueueStatusBadge status={entry.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => movePriority(entry, 'up')} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Move up"><ArrowUp className="h-4 w-4" /></button>
                        <button onClick={() => movePriority(entry, 'down')} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Move down"><ArrowDown className="h-4 w-4" /></button>
                        {entry.status === 'Waiting' && <button onClick={() => updateStatus(entry, 'In Consultation')} className="rounded-lg bg-primary-50 p-1.5 text-primary-600 transition-colors hover:bg-primary-100" title="Start"><Play className="h-4 w-4" /></button>}
                        {entry.status === 'In Consultation' && <button onClick={() => updateStatus(entry, 'Done')} className="rounded-lg bg-success-50 p-1.5 text-success-600 transition-colors hover:bg-success-100" title="Complete"><Check className="h-4 w-4" /></button>}
                        {entry.status !== 'Done' && entry.status !== 'Skipped' && <button onClick={() => updateStatus(entry, 'Skipped')} className="rounded-lg bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100" title="Skip"><SkipForward className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && <div className="px-6 py-12 text-center text-sm text-gray-500">Queue is empty</div>}
        </div>
      )}
    </div>
  );
}
