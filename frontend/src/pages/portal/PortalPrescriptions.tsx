import { useEffect, useState, useCallback } from 'react';
import { Pill, RefreshCw, Check, Loader2 } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { portalApi } from '@/services/api';
import type { Prescription } from '@/types';

export function PortalPrescriptions() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refilling, setRefilling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    portalApi.prescriptions().then(setItems).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const requestRefill = async (id: string) => {
    setRefilling(id);
    try {
      const updated = await portalApi.requestRefill(id);
      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } finally {
      setRefilling(null);
    }
  };

  if (loading) return <SectionLoader label="Loading prescriptions..." />;
  if (error) return <ErrorState message="Could not load your prescriptions" onRetry={load} />;
  if (items.length === 0) return <EmptyState icon={Pill} title="No prescriptions" message="Prescriptions from your doctors will appear here." />;

  return (
    <div className="space-y-4">
      {items.map((rx) => (
        <div key={rx.id} className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-gray-900">{rx.diagnosis || 'Prescription'}</p>
              <p className="text-sm text-gray-500">Prescribed by {rx.doctorName} · {rx.date}</p>
            </div>
            <Badge variant={rx.status === 'Active' ? 'success' : rx.status === 'Completed' ? 'neutral' : 'warning'} dot>{rx.status}</Badge>
          </div>

          <div className="mt-4 space-y-2">
            {rx.medications.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm">
                <span className="font-medium text-gray-900">{m.name}</span>
                <Badge variant="info">{m.dosage}</Badge>
                <span className="text-gray-500">· {m.duration}</span>
                <span className="w-full text-xs text-gray-500 sm:w-auto sm:before:content-['·_']">{m.instructions}</span>
              </div>
            ))}
          </div>

          {rx.notes && <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700"><span className="font-semibold">Notes:</span> {rx.notes}</p>}

          {rx.status === 'Active' && (
            <div className="mt-4">
              {rx.refillRequested ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-medium text-success-700">
                  <Check className="h-3.5 w-3.5" />Refill requested
                </span>
              ) : (
                <button className="btn-secondary text-xs" disabled={refilling === rx.id} onClick={() => requestRefill(rx.id)}>
                  {refilling === rx.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Request Refill
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
