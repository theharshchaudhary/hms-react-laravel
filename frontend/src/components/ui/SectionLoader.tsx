import { Loader2 } from 'lucide-react';

export function SectionLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      <p className="mt-3 text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-100 text-error-600">
        <span className="text-xl font-bold">!</span>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-900">Something went wrong</p>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-4" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}
