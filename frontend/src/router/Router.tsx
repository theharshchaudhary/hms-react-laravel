import { useState, useEffect, useCallback } from 'react';
import type { UserRole } from '@/types';

/** Where a user lands after authenticating, based on role. */
export function homePathForRole(role: UserRole | undefined): string {
  return role === 'patient' ? '/portal' : '/dashboard';
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
