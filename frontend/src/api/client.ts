import axios, { type InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { isSessionLogoutPending, markSessionLogoutPending } from '../auth/sessionBoundary';
import { clearIdempotencyIntents, prepareIdempotency, settleIdempotency } from './idempotency';
import { getWorkoutAccountRevision } from '../lib/workout/accountIdentity';

const baseUrl = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseUrl ? `${baseUrl}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000,
});

export let memoryToken: string | null = null;
let sessionRevision = 0;
let sessionGeneration = 0;
let logoutInProgress = false;
let sessionInvalidated = false;
type SessionRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _sessionGeneration?: number;
  _sessionSubject?: string | null;
  _accountRevision?: number;
};

const tokenSubject = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const subject = jwtDecode<{ sub?: unknown }>(token).sub;
    return typeof subject === 'string' ? subject : null;
  } catch {
    return null;
  }
};

const LEGACY_TOKEN_KEY = 'ascension_session_token';

// The access token lives only in memory; the HttpOnly refresh cookie restores it on reload.
// Older builds persisted it in Web Storage, so drop any copy they left behind.
const clearLegacyStoredToken = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage?.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
  try {
    sessionStorage?.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
};

clearLegacyStoredToken();

export const setMemoryToken = (token: string | null) => {
  if (memoryToken !== token) sessionRevision++;
  memoryToken = token;
  if (token) sessionInvalidated = false;
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'offline-session') return false;
  try {
    const payload = jwtDecode<{ exp?: number }>(token);
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return false;
    // Valid if it will not expire in the next 10 seconds
    return payload.exp * 1000 > Date.now() + 10_000;
  } catch {
    return false;
  }
};

export const authBroadcast =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ascension_auth') : null;

if (authBroadcast) {
  authBroadcast.onmessage = (event: MessageEvent) => {
    if (event.data?.type === 'TOKEN_REFRESHED' && event.data.token) {
      if (
        sessionInvalidated ||
        logoutInProgress ||
        isSessionLogoutPending() ||
        !isTokenValid(event.data.token)
      )
        return;
      setMemoryToken(event.data.token);
      api.defaults.headers.common['Authorization'] = 'Bearer ' + event.data.token;
      window.dispatchEvent(new CustomEvent('token_refresh', { detail: event.data.token }));
    } else if (event.data?.type === 'REQUEST_SESSION') {
      if (memoryToken && isTokenValid(memoryToken)) {
        try {
          authBroadcast.postMessage({ type: 'TOKEN_REFRESHED', token: memoryToken });
        } catch {
          // ignore
        }
      }
    } else if (event.data?.type === 'AUTH_LOGOUT') {
      clearIdempotencyIntents();
      invalidateAuthSession();
      window.dispatchEvent(new CustomEvent('auth_failed', { detail: { reason: 'logout' } }));
    }
  };
}

api.interceptors.request.use(
  async (config) => {
    const sessionRequest = config as SessionRequest;
    sessionRequest._sessionGeneration ??= sessionGeneration;
    sessionRequest._accountRevision ??= getWorkoutAccountRevision();
    const authRequest = config.url?.startsWith('/auth/');
    const originalAuthorization = config.headers.Authorization;
    sessionRequest._sessionSubject ??= tokenSubject(
      typeof originalAuthorization === 'string' && originalAuthorization.startsWith('Bearer ')
        ? originalAuthorization.slice(7)
        : memoryToken,
    );
    const ensureSessionUnchanged = () => {
      if (
        !authRequest &&
        (sessionRequest._sessionGeneration !== sessionGeneration ||
          sessionRequest._accountRevision !== getWorkoutAccountRevision() ||
          (sessionRequest._sessionSubject !== null &&
            sessionRequest._sessionSubject !== tokenSubject(memoryToken)) ||
          isSessionLogoutPending())
      ) {
        settleIdempotency(config, 400);
        throw new axios.CanceledError('Session changed before request dispatch', config);
      }
    };
    ensureSessionUnchanged();
    if (
      memoryToken &&
      memoryToken !== 'offline-session' &&
      config.url !== '/auth/refresh' &&
      config.url !== '/auth/logout'
    ) {
      config.headers.Authorization = 'Bearer ' + memoryToken;
    }
    await prepareIdempotency(config, tokenSubject(memoryToken));
    ensureSessionUnchanged();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let activeRefreshPromise: Promise<string | null> | null = null;

export const invalidateAuthSession = () => {
  sessionGeneration++;
  sessionRevision++;
  setMemoryToken(null);
  sessionInvalidated = true;
  delete api.defaults.headers.common['Authorization'];
};

// A rejected token forces rotation even if its exp claim is still in the future.
export const refreshAccessToken = async (rejectedToken?: string | null): Promise<string | null> => {
  if (logoutInProgress || sessionInvalidated || isSessionLogoutPending()) return null;
  const canReuseToken = () => isTokenValid(memoryToken) && memoryToken !== rejectedToken;
  if (canReuseToken()) return memoryToken;
  if (activeRefreshPromise) return activeRefreshPromise;
  const revision = sessionRevision;

  activeRefreshPromise = (async () => {
    const performRefresh = async (): Promise<string | null> => {
      if (revision !== sessionRevision || canReuseToken()) return memoryToken;
      try {
        const res = await api.post<{ token: string }>(
          '/auth/refresh',
          {},
          { withCredentials: true },
        );
        // Logout or another login may have completed while the request was in flight.
        if (revision !== sessionRevision) return memoryToken;
        const newToken = res.data.token;
        if (typeof newToken !== 'string' || !newToken) throw new Error('Invalid refresh response');
        setMemoryToken(newToken);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        try {
          authBroadcast?.postMessage({ type: 'TOKEN_REFRESHED', token: newToken });
        } catch {
          /* unavailable channel */
        }
        window.dispatchEvent(new CustomEvent('token_refresh', { detail: newToken }));
        return newToken;
      } catch (err) {
        if (revision !== sessionRevision) return memoryToken;
        // Policy, rate-limit and network errors must not be converted into logout.
        if ((err as import('axios').AxiosError).response?.status === 401) {
          invalidateAuthSession();
          window.dispatchEvent(new CustomEvent('auth_failed'));
          return null;
        }
        throw err;
      }
    };
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function') {
        return await navigator.locks.request('ascension_token_refresh', performRefresh);
      }
      return await performRefresh();
    } finally {
      activeRefreshPromise = null;
    }
  })();
  return activeRefreshPromise;
};

export const logoutSession = async () => {
  markSessionLogoutPending();
  clearIdempotencyIntents();
  logoutInProgress = true;
  invalidateAuthSession();
  // Let a pending Set-Cookie finish before revoking it, so it cannot restore the cookie after logout.
  try {
    await activeRefreshPromise?.catch(() => null);
    await api.post('/auth/logout');
  } finally {
    logoutInProgress = false;
  }
};

api.interceptors.response.use(
  (response) => {
    settleIdempotency(response.config, response.status);
    return response;
  },
  async (error: import('axios').AxiosError) => {
    if (error.response?.status !== 401) settleIdempotency(error.config, error.response?.status);
    const originalRequest = error.config as SessionRequest | undefined;
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh' ||
      originalRequest.url === '/auth/logout' ||
      window.location.pathname === '/login'
    ) {
      settleIdempotency(originalRequest, error.response?.status);
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    const authorization = originalRequest.headers.Authorization;
    const rejectedToken =
      typeof authorization === 'string' && authorization.startsWith('Bearer ')
        ? authorization.slice(7)
        : null;
    const subject = tokenSubject(rejectedToken);
    const sessionChanged = () =>
      originalRequest._sessionGeneration !== sessionGeneration ||
      (subject !== null &&
        tokenSubject(memoryToken) !== null &&
        subject !== tokenSubject(memoryToken));
    if (sessionChanged()) {
      settleIdempotency(originalRequest, 401);
      return Promise.reject(error);
    }
    let token: string | null;
    try {
      token = await refreshAccessToken(rejectedToken);
    } catch (refreshError) {
      settleIdempotency(originalRequest);
      throw refreshError;
    }
    if (!token || sessionChanged()) {
      settleIdempotency(originalRequest, 401);
      return Promise.reject(error);
    }
    originalRequest.headers.Authorization = 'Bearer ' + token;
    // Axios checks the original AbortSignal before dispatching this retry.
    return api(originalRequest);
  },
);

export const exportUserData = async (): Promise<void> => {
  const response = await api.get<Blob>('/user/export', {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'] as string | undefined;
  let filename = `ascension-backup-${new Date().toISOString().split('T')[0]}.json`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].trim();
    }
  }

  const blob = new Blob([response.data], { type: 'application/json' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

export interface UserDataRestoreSummary {
  mode: 'OVERWRITE' | 'MERGE';
  workoutsRestored: number;
  customExercisesRestored: number;
  workoutTemplatesRestored: number;
  foodLogsRestored: number;
  mealsRestored: number;
  recipesRestored: number;
  savedFoodsRestored: number;
  stepsEntriesRestored: number;
  weightEntriesRestored: number;
  settingsRestored: boolean;
  restoredAt: string;
}

export const restoreUserData = async (
  backup: unknown,
  mode: 'OVERWRITE' | 'MERGE' = 'MERGE',
  confirmEmpty = false,
): Promise<UserDataRestoreSummary> => {
  const query = new URLSearchParams({ mode });
  if (confirmEmpty) {
    query.set('confirmEmpty', 'true');
  }
  const response = await api.post<UserDataRestoreSummary>(
    `/user/restore?${query.toString()}`,
    backup,
  );
  return response.data;
};

export default api;
