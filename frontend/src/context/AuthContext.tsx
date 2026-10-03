import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '../api/client';

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

function isTokenExpired(token: string): boolean {
  try {
    const payload = jwtDecode<{ exp?: number }>(token);
    if (!payload.exp) return true;
    // Consider expired if less than 60 seconds remaining
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // On mount: if we have a token but it's expired, try to refresh it silently
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const stored = localStorage.getItem('jwt_token');

      if (!stored) {
        // No token at all â€” not logged in
        setIsReady(true);
        return;
      }

      if (!isTokenExpired(stored)) {
        // Token is still valid â€” use it directly
        setIsReady(true);
        return;
      }

      // Token is expired â€” try to refresh using fetch (bypasses axios interceptors entirely)
      console.log('[Auth] JWT expired, attempting proactive refresh...');
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
            localStorage.setItem('jwt_token', data.token);
            api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
            setToken(data.token);
          }
        } else {
          console.warn('[Auth] Proactive refresh failed:', res.status);
          if (!cancelled) {
            localStorage.removeItem('jwt_token');
            setToken(null);
          }
        }
      } catch {
        console.warn('[Auth] Proactive refresh network error');
        if (!cancelled) {
          localStorage.removeItem('jwt_token');
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
      localStorage.setItem('jwt_token', token);

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
        localStorage.removeItem('jwt_token');
      }
    } else {
      localStorage.removeItem('jwt_token');
      setUser(null);
    }

    const handleTokenRefresh = (e: Event) => {
      if (e instanceof CustomEvent) {
        setToken(e.detail);
      }
    };
    const handleAuthFailed = () => {
      setToken(null);
      localStorage.removeItem('jwt_token');
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




