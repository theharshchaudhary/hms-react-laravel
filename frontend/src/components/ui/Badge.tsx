import type { ReactNode } from 'react';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary';

const variantClasses: Record<Variant, string> = {
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  info: 'bg-primary-100 text-primary-700',
  neutral: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-600 text-white',
  secondary: 'bg-secondary-100 text-secondary-700',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = 'neutral', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
