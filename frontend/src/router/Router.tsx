import { useState, useEffect, useCallback } from 'react';
import type { UserRole } from '@/types';
import { peekBookingHandoff } from '@/lib/handoff';

/** Where a user lands after authenticating, based on role. */
export function homePathForRole(role: UserRole | undefined): string {
  return role === 'patient' ? '/portal' : '/dashboard';
}

/** Same, but resume a pending public booking if the patient has one in progress. */
export function afterAuthPath(role: UserRole | undefined): string {
  const b = peekBookingHandoff();
  if (role === 'patient' && (b?.doctorId || b?.doctorName)) return '/book';
  return homePathForRole(role);
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return { route, navigate };
}

export function navigate(to: string) {
  window.location.hash = to;
}

export function parseRoute(route: string): { path: string; params: Record<string, string> } {
  const parts = route.split('/').filter(Boolean);
  return {
    path: '/' + parts.join('/'),
    params: {},
  };
}
