import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authApi, getToken, setToken } from '@/services/api';
import type { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  bootstrapping: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_CACHE_KEY = 'medicore_user';

function readCachedUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_CACHE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch { /* storage unavailable */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => (getToken() ? readCachedUser() : null));
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(!!getToken());
  const [error, setError] = useState<string | null>(null);

  const applyUser = useCallback((next: User | null) => {
    setUserState(next);
    cacheUser(next);
  }, []);

  // Validate a persisted token on first load.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    authApi.me()
      .then((u) => { if (!cancelled) applyUser(u); })
      .catch(() => { if (!cancelled) { setToken(null); applyUser(null); } })
      .finally(() => { if (!cancelled) setBootstrapping(false); });
    return () => { cancelled = true; };
  }, [applyUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const u = await authApi.login(email, password);
      applyUser(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const u = await authApi.register(name, email, password, role);
      applyUser(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  const logout = useCallback(() => {
    void authApi.logout();
    applyUser(null);
  }, [applyUser]);

  const refreshUser = useCallback(async () => {
    const u = await authApi.me();
    applyUser(u);
  }, [applyUser]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user, loading, bootstrapping, error,
        login, register, logout, refreshUser,
        setUser: applyUser, clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
