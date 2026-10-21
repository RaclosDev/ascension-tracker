import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { del } from 'idb-keyval';
import { useQueryClient } from '@tanstack/react-query';
import api, {
  setMemoryToken,
  refreshAccessToken,
  getSessionToken,
  authBroadcast,
  isTokenValid,
} from '../api/client';
import { useWorkoutStore } from '@/lib/workout/store';

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

export const purgeAllCaches = async () => {
  if (typeof window !== 'undefined' && 'caches' in window && window.caches) {
    try {
      const cacheNames = await window.caches.keys();
      // Preserve workbox precache to keep PWA offline app shell intact
      const runtimeCaches = cacheNames.filter((name) => !name.startsWith('workbox-precache'));
      await Promise.all(runtimeCaches.map((name) => window.caches.delete(name)));
    } catch {
      // ignore
    }
  }
};

const CACHED_USER_KEY = 'ascension_cached_user';

export const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {
    // ignore storage write errors
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const getInitialSession = (): { token: string | null; user: User | null } => {
    const sessionToken = getSessionToken();
    const cachedUser = getCachedUser();
    if (sessionToken && cachedUser) {
      setMemoryToken(sessionToken);
      api.defaults.headers.common['Authorization'] = 'Bearer ' + sessionToken;
      return { token: sessionToken, user: cachedUser };
    }
    return { token: null, user: null };
  };

  const initialSession = getInitialSession();
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [user, setUser] = useState<User | null>(initialSession.user);
  const [isReady, setIsReady] = useState(initialSession.token !== null);

  // On mount: proactively attempt to refresh to get an access token in memory via HttpOnly cookie
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // If we already have a valid session from getInitialSession (e.g. from shared storage),
      // we do not need to block on network refresh or risk dropping the session.
      if (initialSession.token && isTokenValid(initialSession.token)) {
        setIsReady(true);
        return;
      }

      // Query any active peer tabs for a live session over BroadcastChannel
      if (authBroadcast) {
        try {
          authBroadcast.postMessage({ type: 'REQUEST_SESSION' });
        } catch {
          // ignore
        }
      }

      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (cancelled) return;
        try {
          const freshToken = await refreshAccessToken();

          if (freshToken && !cancelled) {
            setToken(freshToken);
            try {
              const payload = jwtDecode<Record<string, unknown>>(freshToken);
              const u: User = {
                email: payload.email as string,
                name: payload.name as string,
                picture: payload.picture as string,
              };
              setUser(u);
              setCachedUser(u);
            } catch {
              setUser(null);
            }
          } else if (!cancelled && !initialSession.token) {
            setToken(null);
            setUser(null);
            setCachedUser(null);
          }
          break;
        } catch (err: unknown) {
          if (attempt === maxRetries) {
            if (!cancelled) {
              const cachedUser = getCachedUser();
              const axiosErr = err as { response?: { status?: number } };
              const isNetworkOrServerError =
                !axiosErr?.response ||
                (Boolean(axiosErr.response.status) && axiosErr.response.status! >= 500);
              const isOffline =
                (typeof navigator !== 'undefined' && !navigator.onLine) || isNetworkOrServerError;

              if (cachedUser && (isOffline || initialSession.token)) {
                // Gym / airplane mode / dead wifi: allow entering offline PWA mode with cached user profile
                if (!initialSession.token) {
                  setToken('offline-session');
                }
                setUser(cachedUser);
              } else if (!initialSession.token) {
                setMemoryToken(null);
                delete api.defaults.headers.common['Authorization'];
                setToken(null);
                setUser(null);
              }
            }
          } else {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }

      if (!cancelled) setIsReady(true);
    }

    initAuth();

    const handleOnline = async () => {
      try {
        const freshToken = await refreshAccessToken();
        if (freshToken && !cancelled) {
          setToken(freshToken);
        }
      } catch {
        // Still recovering network
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (token) {
      setMemoryToken(token);
      if (token !== 'offline-session') {
        api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      }

      try {
        const payload = jwtDecode<Record<string, unknown>>(token);
        const u: User = {
          email: payload.email as string,
          name: payload.name as string,
          picture: payload.picture as string,
        };
        setUser(u);
        setCachedUser(u);
      } catch {
        if (token !== 'offline-session') {
          setToken(null);
          setMemoryToken(null);
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        }
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
      setCachedUser(null);
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ascension_session_token') {
        if (e.newValue && isTokenValid(e.newValue)) {
          setMemoryToken(e.newValue);
          api.defaults.headers.common['Authorization'] = 'Bearer ' + e.newValue;
          setToken(e.newValue);
          const cached = getCachedUser();
          if (cached) setUser(cached);
        } else if (!e.newValue) {
          setToken(null);
          setMemoryToken(null);
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setCachedUser(null);
        }
      }
    };
    window.addEventListener('token_refresh', handleTokenRefresh);
    window.addEventListener('auth_failed', handleAuthFailed);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('token_refresh', handleTokenRefresh);
      window.removeEventListener('auth_failed', handleAuthFailed);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [token, queryClient]);

  const login = (jwtToken: string) => {
    queryClient.clear();
    setMemoryToken(jwtToken);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + jwtToken;
    setToken(jwtToken);
    try {
      const payload = jwtDecode<Record<string, unknown>>(jwtToken);
      const u: User = {
        email: payload.email as string,
        name: payload.name as string,
        picture: payload.picture as string,
      };
      setUser(u);
      setCachedUser(u);
    } catch {
      // ignore
    }
    if (authBroadcast) {
      try {
        authBroadcast.postMessage({ type: 'TOKEN_REFRESHED', token: jwtToken });
      } catch {
        // ignore
      }
    }
  };

  const updateToken = (newToken: string) => {
    setToken(newToken);
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    googleLogout();
    setToken(null);
    setUser(null);
    setCachedUser(null);
    setMemoryToken(null);
    delete api.defaults.headers.common['Authorization'];
    if (authBroadcast) {
      try {
        authBroadcast.postMessage({ type: 'AUTH_LOGOUT' });
      } catch {
        // ignore
      }
    }

    await purgeAllCaches();

    // Save custom theme, clear local storage to prevent data leaks between accounts, and reload
    const theme = localStorage.getItem('ascension_custom_color');
    localStorage.clear();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
    if (theme) localStorage.setItem('ascension_custom_color', theme);

    try {
      await del('ascension-workout-v1');
      await del('forja-v1');
    } catch (e) {
      console.error(
        'Error clearing IndexedDB on logout:',
        e instanceof Error ? e.message : String(e),
      );
    }
    queryClient.clear();
    useWorkoutStore.setState({ active: null, restUntil: null, restTimers: {} });

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
