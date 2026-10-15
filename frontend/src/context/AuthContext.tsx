import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { del } from 'idb-keyval';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // On mount: proactively attempt to refresh to get an access token in memory via HttpOnly cookie
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (cancelled) return;
        try {
          const res = await fetch(`${baseUrl}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.token && !cancelled) {
              setMemoryToken(data.token);
              api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
              setToken(data.token);
              try {
                const payload = jwtDecode<Record<string, unknown>>(data.token);
                setUser({
                  email: payload.email as string,
                  name: payload.name as string,
                  picture: payload.picture as string,
                });
              } catch {
                setUser(null);
              }
            }
            break;
          } else if (res.status === 401 || res.status === 403) {
            // Explicitly unauthenticated / session expired — do not retry
            if (!cancelled) {
              setMemoryToken(null);
              delete api.defaults.headers.common['Authorization'];
              setToken(null);
              setUser(null);
            }
            break;
          } else {
            // Server error (500, 502, 503, 504) — retry if attempts remain
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
            } else if (!cancelled) {
              setMemoryToken(null);
              delete api.defaults.headers.common['Authorization'];
              setToken(null);
              setUser(null);
            }
          }
        } catch {
          // Network error / connection glitch — retry if attempts remain
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          } else if (!cancelled) {
            setMemoryToken(null);
            delete api.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
          }
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
      api.defaults.headers.common['Authorization'] = 'Bearer ' + token;

      try {
        const payload = jwtDecode<Record<string, unknown>>(token);
        setUser({
          email: payload.email as string,
          name: payload.name as string,
          picture: payload.picture as string,
        });
      } catch {
        setToken(null);
        setMemoryToken(null);
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      }
    } else {
      setMemoryToken(null);
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }

    const handleTokenRefresh = (e: Event) => {
      if (e instanceof CustomEvent && e.detail) {
        setToken(e.detail);
      }
    };
    const handleAuthFailed = () => {
      setToken(null);
      setMemoryToken(null);
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
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
    setUser(null);
    setMemoryToken(null);
    delete api.defaults.headers.common['Authorization'];

    // Save custom theme, clear local storage to prevent data leaks between accounts, and reload
    const theme = localStorage.getItem('ascension_custom_color');
    localStorage.clear();
    if (theme) localStorage.setItem('ascension_custom_color', theme);

    try {
      await del('forja-v1');
    } catch (e) {
      console.error('Error clearing IndexedDB on logout:', e);
    }
    queryClient.clear();

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
