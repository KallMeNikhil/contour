import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../services/api/auth';
import { clearToken, getToken, onUnauthenticated, setToken } from '../services/api/client';
import { disconnectSocket } from '../services/realtime/socket';
import { queryClient } from './queryClient';
import type { PublicUser } from '../services/api/types';

const USER_STORAGE_KEY = 'contour.user';

function readStoredUser(): PublicUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: PublicUser | null;
  isAuthenticated: boolean;

  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => readStoredUser());
  const [sessionExpired, setSessionExpired] = useState(false);

  const applySession = useCallback((nextUser: PublicUser, token: string) => {
    setToken(token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    queryClient.clear();
    disconnectSocket();
  }, []);

  useEffect(() => {
    onUnauthenticated(() => {
      setSessionExpired(getToken() !== null || readStoredUser() !== null);
      logout();
    });
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login({ email, password });
      applySession(result.user, result.token);
    },
    [applySession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await authApi.register({ name, email, password });
      applySession(result.user, result.token);
    },
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      sessionExpired,
      login,
      register,
      logout,
      clearSessionExpired: () => setSessionExpired(false),
    }),
    [user, sessionExpired, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
