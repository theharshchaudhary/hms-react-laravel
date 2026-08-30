import { Badge } from './Badge';
import type { AppointmentStatus, QueueStatus, InvoiceStatus } from '@/types';

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' }> = {
    Scheduled: { variant: 'info' },
    Confirmed: { variant: 'primary' },
    'In Progress': { variant: 'warning' },
    Completed: { variant: 'success' },
    Cancelled: { variant: 'error' },
    'No Show': { variant: 'neutral' },
  };
  const { variant } = map[status];
  return <Badge variant={variant} dot>{status}</Badge>;
}

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
  const map: Record<QueueStatus, { variant: 'success' | 'warning' | 'error' | 'neutral' | 'primary' }> = {
    Waiting: { variant: 'warning' },
    'In Consultation': { variant: 'primary' },
    Done: { variant: 'success' },
    Skipped: { variant: 'neutral' },
  };
  const { variant } = map[status];
  return <Badge variant={variant} dot>{status}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { variant: 'success' | 'warning' | 'error' | 'info' }> = {
    Paid: { variant: 'success' },
    Pending: { variant: 'warning' },
    Overdue: { variant: 'error' },
    Partial: { variant: 'info' },
  };
  const { variant } = map[status];
  return <Badge variant={variant} dot>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: 'Normal' | 'Urgent' | 'Emergency' }) {
  const map = {
    Normal: { variant: 'neutral' as const },
    Urgent: { variant: 'warning' as const },
    Emergency: { variant: 'error' as const },
  };
  const { variant } = map[priority];
  return <Badge variant={variant} dot>{priority}</Badge>;
}
