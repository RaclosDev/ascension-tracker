import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useQueryClient } from '@tanstack/react-query';
import api, {
  setMemoryToken,
  refreshAccessToken,
  authBroadcast,
  logoutSession,
  invalidateAuthSession,
} from '../api/client';
import { switchWorkoutAccount, getWorkoutAccount } from '@/lib/workout/account';
import { registerLegacyWorkoutOwner } from '@/lib/workout/storage';
import {
  clearSessionLogoutPending,
  isSessionLogoutPending,
  markSessionLogoutPending,
} from '@/auth/sessionBoundary';
import { clearIdempotencyIntents } from '@/api/idempotency';

export interface User {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (jwtToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (newToken: string) => Promise<void>;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const purgeAllCaches = async () => {
  if (typeof window !== 'undefined' && 'caches' in window && window.caches) {
    try {
      const cacheNames = await window.caches.keys();
      // Preserve workbox precache to keep PWA offline app shell intact
      const runtimeCaches = cacheNames.filter((name) =>
        ['api-cache', 'food-search-cache'].includes(name),
      );
      await Promise.all(runtimeCaches.map((name) => window.caches.delete(name)));
    } catch {
      // ignore
    }
  }
};

const CACHED_USER_KEY = 'ascension_cached_user';

const clearLocalSessionData = async () => {
  clearIdempotencyIntents();
  await switchWorkoutAccount(null);
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[kind];
      const preserved = new Set([
        'ascension_logout_pending',
        'ascension_workout_legacy_owner',
        'ascension_custom_color',
        'ascension_theme',
      ]);
      for (const key of Object.keys(storage)) {
        if ((key.startsWith('ascension_') || key.startsWith('ascension:')) && !preserved.has(key))
          storage.removeItem(key);
      }
    } catch {
      /* Continue clearing remaining stores when one storage is blocked. */
    }
  }
  await purgeAllCaches();
};

export const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (
      !value ||
      typeof value !== 'object' ||
      !('email' in value) ||
      !('name' in value) ||
      typeof value.email !== 'string' ||
      !value.email.trim() ||
      typeof value.name !== 'string' ||
      ('picture' in value && value.picture != null && typeof value.picture !== 'string')
    )
      return null;
    return {
      email: value.email,
      name: value.name,
      ...('picture' in value && typeof value.picture === 'string'
        ? { picture: value.picture }
        : {}),
    };
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
  const activationRevision = useRef(0);
  const cleanupInFlight = useRef<Promise<void> | null>(null);
  // No access token survives a reload; initAuth gets a fresh one from the refresh cookie.
  const getInitialSession = (): { token: string | null; user: User | null } => {
    const cachedUser = getCachedUser();
    registerLegacyWorkoutOwner(cachedUser?.email ?? null);
    return { token: null, user: isSessionLogoutPending() ? null : cachedUser };
  };

  const [initialSession] = useState(getInitialSession);
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [user, setUser] = useState<User | null>(initialSession.user);
  const [isReady, setIsReady] = useState(initialSession.token !== null);

  const beginSessionCleanup = useCallback((serverLogout?: Promise<unknown>) => {
    setIsReady(false);
    const revision = activationRevision.current;
    const previous = cleanupInFlight.current ?? Promise.resolve();
    const pending = previous
      .then(clearLocalSessionData)
      .then(() => serverLogout)
      .then(() => {});
    cleanupInFlight.current = pending;
    void pending.then(
      () => {
        if (cleanupInFlight.current === pending) cleanupInFlight.current = null;
        if (activationRevision.current === revision) setIsReady(true);
      },
      () => {
        // Keep the account gate closed if an unexpected cleanup failure occurs.
        if (cleanupInFlight.current === pending) cleanupInFlight.current = null;
      },
    );
    return pending;
  }, []);

  // On mount: proactively attempt to refresh to get an access token in memory via HttpOnly cookie
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      if (isSessionLogoutPending()) {
        await beginSessionCleanup();
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

      const maxRetries = 3;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (cancelled) return;
        try {
          const freshToken = await refreshAccessToken();

          if (freshToken && !cancelled) {
            try {
              const payload = jwtDecode<Record<string, unknown>>(freshToken);
              const u: User = {
                email: payload.email as string,
                name: payload.name as string,
                picture: payload.picture as string,
              };
              const revision = ++activationRevision.current;
              await switchWorkoutAccount(u.email);
              if (cancelled || revision !== activationRevision.current || isSessionLogoutPending())
                return;
              setToken(freshToken);
              setUser(u);
              setCachedUser(u);
            } catch {
              setUser(null);
            }
          } else if (!cancelled && !initialSession.user) {
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

              if (cachedUser && isOffline) {
                // Offline, or the backend is down or redeploying: enter offline PWA mode with the cached profile.
                const revision = ++activationRevision.current;
                await switchWorkoutAccount(cachedUser.email);
                if (
                  cancelled ||
                  revision !== activationRevision.current ||
                  isSessionLogoutPending()
                )
                  return;
                setToken('offline-session');
                setUser(cachedUser);
              } else if (!initialSession.user) {
                setMemoryToken(null);
                delete api.defaults.headers.common['Authorization'];
                setToken(null);
                setUser(null);
              }
            }
          } else {
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      if (!cancelled && !isSessionLogoutPending()) setIsReady(true);
    }

    initAuth();

    const handleOnline = async () => {
      try {
        const freshToken = await refreshAccessToken();
        if (freshToken && !cancelled) {
          const payload = jwtDecode<{ email: string }>(freshToken);
          const revision = ++activationRevision.current;
          if (getWorkoutAccount() !== payload.email?.trim().toLowerCase()) {
            setIsReady(false);
            queryClient.clear();
          }
          await switchWorkoutAccount(payload.email);
          if (cancelled || revision !== activationRevision.current || isSessionLogoutPending())
            return;
          setToken(freshToken);
          setIsReady(true);
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
  }, [initialSession.user, queryClient, beginSessionCleanup]);

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

    const handleTokenRefresh = async (e: Event) => {
      if (e instanceof CustomEvent && e.detail) {
        try {
          const payload = jwtDecode<{ email: string }>(e.detail);
          const revision = ++activationRevision.current;
          if (getWorkoutAccount() !== payload.email?.trim().toLowerCase()) {
            setIsReady(false);
            queryClient.clear();
          }
          await switchWorkoutAccount(payload.email);
          if (revision !== activationRevision.current || isSessionLogoutPending()) return;
          setToken(e.detail);
          setIsReady(true);
        } catch {
          /* Ignore malformed refresh notifications. */
        }
      }
    };
    const handleAuthFailed = (event: Event) => {
      activationRevision.current++;
      setToken(null);
      invalidateAuthSession();
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setCachedUser(null);
      queryClient.clear();
      if (event instanceof CustomEvent && event.detail?.reason === 'logout') {
        markSessionLogoutPending();
        void beginSessionCleanup();
      }
    };
    window.addEventListener('token_refresh', handleTokenRefresh);
    window.addEventListener('auth_failed', handleAuthFailed);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'ascension_logout_pending' && isSessionLogoutPending()) {
        handleAuthFailed(new CustomEvent('auth_failed', { detail: { reason: 'logout' } }));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('token_refresh', handleTokenRefresh);
      window.removeEventListener('auth_failed', handleAuthFailed);
      window.removeEventListener('storage', handleStorage);
    };
  }, [token, queryClient, beginSessionCleanup]);

  const login = async (jwtToken: string) => {
    const revision = ++activationRevision.current;
    setIsReady(false);
    await cleanupInFlight.current;
    if (revision !== activationRevision.current) return;
    const payload = jwtDecode<{ email: string; name: string; picture?: string }>(jwtToken);
    if (typeof payload.email !== 'string' || !payload.email.trim()) return;
    clearSessionLogoutPending();
    queryClient.clear();
    setMemoryToken(jwtToken);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + jwtToken;
    await switchWorkoutAccount(payload.email);
    if (revision !== activationRevision.current || isSessionLogoutPending()) return;
    setToken(jwtToken);
    setIsReady(true);
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

  const updateToken = async (newToken: string) => {
    const revision = ++activationRevision.current;
    await cleanupInFlight.current;
    if (revision !== activationRevision.current || isSessionLogoutPending()) return;
    const payload = jwtDecode<{ email: string }>(newToken);
    if (getWorkoutAccount() !== payload.email?.trim().toLowerCase()) {
      setIsReady(false);
      queryClient.clear();
    }
    await switchWorkoutAccount(payload.email);
    if (revision !== activationRevision.current || isSessionLogoutPending()) return;
    setToken(newToken);
    setIsReady(true);
  };

  const logout = async () => {
    activationRevision.current++;
    setIsReady(false);
    markSessionLogoutPending();
    const serverLogout = logoutSession().catch(() => {});
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

    queryClient.clear();
    await beginSessionCleanup(serverLogout);

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
