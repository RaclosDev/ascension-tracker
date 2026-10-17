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
  const getInitialSession = (): { token: string | null; user: User | null } => {
    try {
      const cached = localStorage.getItem('ascension_token');
      if (cached) {
        const payload = jwtDecode<Record<string, unknown>>(cached);
        const exp = (payload.exp as number) * 1000;
        if (exp > Date.now() + 60000) {
          setMemoryToken(cached);
          api.defaults.headers.common['Authorization'] = 'Bearer ' + cached;
          return {
            token: cached,
            user: {
              email: payload.email as string,
              name: payload.name as string,
              picture: payload.picture as string,
            },
          };
        }
      }
    } catch {
      localStorage.removeItem('ascension_token');
    }
    return { token: null, user: null };
  };

  const initialSession = getInitialSession();
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [user, setUser] = useState<User | null>(initialSession.user);
  const [isReady, setIsReady] = useState(initialSession.token !== null);

  // On mount: proactively attempt to refresh to get a token if we have a valid cookie or stored refresh token
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      console.log('[Auth] Attempting proactive refresh on mount...');
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const maxRetries = 2;
      const storedRefreshToken = localStorage.getItem('ascension_refresh_token');

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (cancelled) return;
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (storedRefreshToken) {
            headers['X-Refresh-Token'] = storedRefreshToken;
          }
          const res = await fetch(`${baseUrl}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify({ refreshToken: storedRefreshToken || '' }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.token && !cancelled) {
              console.log('[Auth] Proactive refresh succeeded');
              setMemoryToken(data.token);
              localStorage.setItem('ascension_token', data.token);
              if (data.refreshToken) {
                localStorage.setItem('ascension_refresh_token', data.refreshToken);
              }
              api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
              setToken(data.token);
            }
            break;
          } else if (res.status === 401 || res.status === 403) {
            // Explicitly unauthenticated / session expired — do not retry
            console.log('[Auth] Not authenticated or session expired:', res.status);
            const currentToken = localStorage.getItem('ascension_token');
            let hasValidToken = false;
            if (currentToken) {
              try {
                const payload = jwtDecode<Record<string, unknown>>(currentToken);
                if ((payload.exp as number) * 1000 > Date.now() + 60000) {
                  hasValidToken = true;
                }
              } catch {
                hasValidToken = false;
              }
            }
            if (!hasValidToken && !cancelled) {
              localStorage.removeItem('ascension_token');
              localStorage.removeItem('ascension_refresh_token');
              setMemoryToken(null);
              setToken(null);
              setUser(null);
            }
            break;
          } else {
            // Server error (500, 502, 503, 504) — retry if attempts remain
            console.warn(
              `[Auth] Transient server error ${res.status} on attempt ${attempt + 1}/${maxRetries + 1}`,
            );
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
            } else if (!cancelled && !initialSession.token) {
              setMemoryToken(null);
              setToken(null);
            }
          }
        } catch (err) {
          // Network error / connection glitch — retry if attempts remain
          console.warn(`[Auth] Network error on attempt ${attempt + 1}/${maxRetries + 1}`, err);
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          } else if (!cancelled && !initialSession.token) {
            setMemoryToken(null);
            setToken(null);
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
      localStorage.setItem('ascension_token', token);

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
        localStorage.removeItem('ascension_token');
        localStorage.removeItem('ascension_refresh_token');
      }
    } else {
      setMemoryToken(null);
      setUser(null);
      localStorage.removeItem('ascension_token');
      localStorage.removeItem('ascension_refresh_token');
    }

    const handleTokenRefresh = (e: Event) => {
      if (e instanceof CustomEvent) {
        setToken(e.detail);
      }
    };
    const handleAuthFailed = () => {
      setToken(null);
      setMemoryToken(null);
      localStorage.removeItem('ascension_token');
      localStorage.removeItem('ascension_refresh_token');
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
    const storedRefreshToken = localStorage.getItem('ascension_refresh_token');
    const headers: Record<string, string> = {};
    if (storedRefreshToken) {
      headers['X-Refresh-Token'] = storedRefreshToken;
    }
    api
      .post('/auth/logout', { refreshToken: storedRefreshToken || '' }, { headers })
      .catch(() => {});
    googleLogout();
    setToken(null);
    setUser(null);
    setMemoryToken(null);
    localStorage.removeItem('ascension_token');
    localStorage.removeItem('ascension_refresh_token');

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
