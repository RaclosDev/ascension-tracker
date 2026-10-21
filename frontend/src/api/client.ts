import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const baseUrl = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseUrl ? `${baseUrl}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000,
});

export let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    if (token && token !== 'offline-session') {
      try {
        sessionStorage.setItem('ascension_session_token', token);
      } catch {
        // ignore storage errors
      }
    } else if (!token) {
      try {
        sessionStorage.removeItem('ascension_session_token');
      } catch {
        // ignore
      }
    }
  }
};

export const getSessionToken = (): string | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const saved = sessionStorage.getItem('ascension_session_token');
    if (saved && isTokenValid(saved)) {
      return saved;
    }
    if (saved) {
      sessionStorage.removeItem('ascension_session_token');
    }
    return null;
  } catch {
    return null;
  }
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'offline-session') {
    return true;
  }
  try {
    const payload = jwtDecode<{ exp?: number }>(token);
    if (!payload.exp) return true;
    // Valid if it will not expire in the next 10 seconds
    return payload.exp * 1000 > Date.now() + 10_000;
  } catch {
    return false;
  }
};

const authBroadcast =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ascension_auth') : null;

if (authBroadcast) {
  authBroadcast.onmessage = (event: MessageEvent) => {
    if (event.data?.type === 'TOKEN_REFRESHED' && event.data.token) {
      setMemoryToken(event.data.token);
      api.defaults.headers.common['Authorization'] = 'Bearer ' + event.data.token;
      window.dispatchEvent(new CustomEvent('token_refresh', { detail: event.data.token }));
    }
  };
}

api.interceptors.request.use(
  (config) => {
    if (
      memoryToken &&
      memoryToken !== 'offline-session' &&
      config.url !== '/auth/refresh' &&
      config.url !== '/auth/logout'
    ) {
      config.headers.Authorization = 'Bearer ' + memoryToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: Error | null) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let activeRefreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (isTokenValid(memoryToken)) {
    return memoryToken;
  }
  const sessionToken = getSessionToken();
  if (isTokenValid(sessionToken)) {
    setMemoryToken(sessionToken);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + sessionToken;
    return sessionToken;
  }

  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const performRefresh = async (): Promise<string | null> => {
        if (isTokenValid(memoryToken)) {
          return memoryToken;
        }

        try {
          const res = await api.post<{ token: string }>(
            '/auth/refresh',
            {},
            { withCredentials: true },
          );
          const newToken = res.data.token;
          setMemoryToken(newToken);
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;

          if (authBroadcast) {
            try {
              authBroadcast.postMessage({ type: 'TOKEN_REFRESHED', token: newToken });
            } catch {
              // Ignore broadcast errors
            }
          }

          window.dispatchEvent(new CustomEvent('token_refresh', { detail: newToken }));
          return newToken;
        } catch (err) {
          const axiosErr = err as import('axios').AxiosError;
          // Only a 401 from /auth/refresh means the refresh session is invalid.
          // 403 can be an Origin/CORS policy failure and must not erase the user's session.
          if (axiosErr.response?.status === 401) {
            setMemoryToken(null);
            delete api.defaults.headers.common['Authorization'];
            window.dispatchEvent(new CustomEvent('auth_failed'));
            return null;
          }
          throw err;
        }
      };

      if (
        typeof navigator !== 'undefined' &&
        navigator.locks &&
        typeof navigator.locks.request === 'function'
      ) {
        return await navigator.locks.request('ascension_token_refresh', performRefresh);
      }
      return await performRefresh();
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/auth/logout' &&
      window.location.pathname !== '/login'
    ) {
      originalRequest._retry = true;

      const sentAuth =
        originalRequest.headers?.['Authorization'] || originalRequest.headers?.['authorization'];
      const alreadyUsedCurrentMemoryToken = Boolean(
        memoryToken && sentAuth === 'Bearer ' + memoryToken,
      );

      // If already valid in memory and was NOT the token that failed, another tab refreshed it
      if (isTokenValid(memoryToken) && !alreadyUsedCurrentMemoryToken) {
        originalRequest.headers['Authorization'] = 'Bearer ' + memoryToken;
        return api(originalRequest);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err: Error) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      const performTabLockedRefresh = async (): Promise<string> => {
        const currentSent =
          originalRequest.headers?.['Authorization'] || originalRequest.headers?.['authorization'];
        const currentlyUsed = Boolean(memoryToken && currentSent === 'Bearer ' + memoryToken);
        if (isTokenValid(memoryToken) && !currentlyUsed) {
          return memoryToken!;
        }

        let res: import('axios').AxiosResponse<{ token: string }>;
        try {
          res = await api.post('/auth/refresh', {}, { withCredentials: true });
        } catch (firstErr) {
          const axiosErr = firstErr as import('axios').AxiosError;
          if (axiosErr.response?.status === 401) {
            throw firstErr;
          }
          // Retry once after 1.5s for network hiccups or transient errors
          await new Promise((r) => setTimeout(r, 1500));
          res = await api.post('/auth/refresh', {}, { withCredentials: true });
        }

        const newToken = res.data.token;
        setMemoryToken(newToken);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;

        if (authBroadcast) {
          try {
            authBroadcast.postMessage({ type: 'TOKEN_REFRESHED', token: newToken });
          } catch {
            // Ignore broadcast errors
          }
        }

        window.dispatchEvent(new CustomEvent('token_refresh', { detail: newToken }));
        return newToken;
      };

      try {
        let newToken: string;
        if (
          typeof navigator !== 'undefined' &&
          navigator.locks &&
          typeof navigator.locks.request === 'function'
        ) {
          newToken = await navigator.locks.request(
            'ascension_token_refresh',
            performTabLockedRefresh,
          );
        } else {
          newToken = await performTabLockedRefresh();
        }

        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (error) {
        const err = error as import('axios').AxiosError;
        processQueue(err, null);
        // Do not convert policy/server errors (400/403) into a client-side logout.
        if (err.response?.status === 401) {
          setMemoryToken(null);
          delete api.defaults.headers.common['Authorization'];
          window.dispatchEvent(new CustomEvent('auth_failed'));
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
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
