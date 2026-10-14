import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api, { setMemoryToken } from '../api/client';

export interface User {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (jwtToken: string) => void;
  logout: () => void;
  updateToken: (newToken: string) => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // On mount: proactively attempt to refresh to get a token if we have a valid cookie
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      console.log('[Auth] Attempting proactive refresh on mount...');
      try {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.token && !cancelled) {
            console.log('[Auth] Proactive refresh succeeded');
            setMemoryToken(data.token);
            api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
            setToken(data.token);
          }
        } else {
          console.log('[Auth] Proactive refresh failed or not logged in:', res.status);
          if (!cancelled) {
            setMemoryToken(null);
            setToken(null);
          }
        }
      } catch {
        console.warn('[Auth] Proactive refresh network error');
        if (!cancelled) {
          setMemoryToken(null);
          setToken(null);
        }
      }

      if (!cancelled) setIsReady(true);
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (token) {
      setMemoryToken(token);

      try {
        const payload = jwtDecode<Record<string, unknown>>(token);
        setUser({
          email: payload.email as string,
          name: payload.name as string,
          picture: payload.picture as string,
        });
      } catch {
        console.error('Invalid token format');
        setToken(null);
        setMemoryToken(null);
      }
    } else {
      setMemoryToken(null);
      setUser(null);
    }

    const handleTokenRefresh = (e: Event) => {
      if (e instanceof CustomEvent) {
        setToken(e.detail);
      }
    };
    const handleAuthFailed = () => {
      setToken(null);
      setMemoryToken(null);
    };
    window.addEventListener('token_refresh', handleTokenRefresh);
    window.addEventListener('auth_failed', handleAuthFailed);
    return () => {
      window.removeEventListener('token_refresh', handleTokenRefresh);
      window.removeEventListener('auth_failed', handleAuthFailed);
    };
  }, [token]);

  const login = (jwtToken: string) => {
    setToken(jwtToken);
  };

  const updateToken = (newToken: string) => {
    setToken(newToken);
  };

  const logout = async () => {
    api.post('/auth/logout').catch(() => {});
    googleLogout();
    setToken(null);

    // Save custom theme, clear local storage to prevent data leaks between accounts, and reload
    const theme = localStorage.getItem('ascension_custom_color');
    localStorage.clear();
    if (theme) localStorage.setItem('ascension_custom_color', theme);

    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateToken, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
