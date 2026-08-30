import { useEffect, useState, useCallback } from 'react';
import { FileText, FileImage, FlaskConical, Activity, Stethoscope, HeartPulse } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { portalApi } from '@/services/api';
import type { MedicalRecord } from '@/types';

const ICONS: Record<string, typeof FileText> = {
  'Lab Report': FlaskConical, Diagnosis: Stethoscope, Treatment: Activity, Imaging: FileImage, Vitals: HeartPulse,
};

export function PortalRecords() {
  const [items, setItems] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    portalApi.records().then(setItems).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <SectionLoader label="Loading records..." />;
  if (error) return <ErrorState message="Could not load your records" onRetry={load} />;
  if (items.length === 0) return <EmptyState icon={FileText} title="No medical records" message="Lab reports, diagnoses and imaging results will appear here." />;

  return (
    <div className="space-y-3">
      {items.map((r) => {
        const Icon = ICONS[r.type] || FileText;
        return (
          <div key={r.id} className="card flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                <Badge variant={r.status === 'Critical' ? 'error' : r.status === 'Under Observation' ? 'warning' : 'success'} dot>{r.status}</Badge>
              </div>
              <p className="text-xs text-gray-500">{r.type} · {r.doctorName} · {r.date}</p>
              {r.description && <p className="mt-2 text-sm text-gray-600">{r.description}</p>}
              {!!r.attachments && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-600">
                  <FileImage className="h-3.5 w-3.5" />{r.attachments} attachment{r.attachments > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
