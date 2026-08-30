import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Check, Trash2, Mail, Phone, Loader2, Inbox } from 'lucide-react';
import { SectionLoader, ErrorState } from '@/components/ui/SectionLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { messagesApi } from '@/services/api';
import type { ContactMessage } from '@/types';

export function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'handled'>('open');
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError(false);
    messagesApi.list().then(setMessages).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (m: ContactMessage) => {
    setBusy(m.id);
    try {
      const updated = await messagesApi.setHandled(m.id, !m.handled);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } finally { setBusy(null); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await messagesApi.remove(deleteTarget.id);
    setMessages((prev) => prev.filter((x) => x.id !== deleteTarget.id));
  };

  const shown = messages.filter((m) => filter === 'all' || (filter === 'open' ? !m.handled : m.handled));
  const openCount = messages.filter((m) => !m.handled).length;

  if (loading) return <SectionLoader label="Loading messages..." />;
  if (error) return <ErrorState message="Failed to load messages" onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Messages" value={messages.length} icon={MessageSquare} color="primary" />
        <StatCard label="Awaiting Reply" value={openCount} icon={Inbox} color={openCount ? 'warning' : 'success'} />
        <StatCard label="Handled" value={messages.length - openCount} icon={Check} color="success" />
      </div>

      <div className="flex gap-2">
        {(['open', 'handled', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${filter === f ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing here" message="Contact-form submissions from the website will appear here." />
      ) : (
        <div className="space-y-3">
          {shown.map((m) => (
            <div key={m.id} className={`card p-5 ${m.handled ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.name}
                    {m.handled && <Badge variant="success" className="ml-2">Handled</Badge>}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{m.email}</span>
                    {m.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{m.phone}</span>}
                    <span>{new Date(m.receivedAt).toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggle(m)} disabled={busy === m.id}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                    {busy === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 inline h-3.5 w-3.5" />}
                    {m.handled ? 'Reopen' : 'Mark handled'}
                  </button>
                  <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">{m.message}</p>
              <a href={`mailto:${m.email}?subject=Re: your enquiry to MediCore`} className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">Reply by email →</a>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete}
        title="Delete Message" message={`Delete the message from ${deleteTarget?.name}?`} confirmLabel="Delete" danger />
    </div>
  );
}
