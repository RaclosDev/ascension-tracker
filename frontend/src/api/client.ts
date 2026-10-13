import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseUrl ? `${baseUrl}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
  memoryToken = token;
};

api.interceptors.request.use(
  (config) => {
    let token = memoryToken;
    if (!token) {
      token = localStorage.getItem('ascension_token');
      if (token) {
        setMemoryToken(token);
      }
    }
    if (token && config.url !== '/auth/refresh' && config.url !== '/auth/logout') {
      config.headers.Authorization = 'Bearer ' + token;
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      window.location.pathname !== '/login'
    ) {
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

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let res: import('axios').AxiosResponse<{ token: string; refreshToken?: string }>;
        const storedRefreshToken = localStorage.getItem('ascension_refresh_token');
        const headers: Record<string, string> = {};
        if (storedRefreshToken) {
          headers['X-Refresh-Token'] = storedRefreshToken;
        }
        const refreshPayload = { refreshToken: storedRefreshToken || '' };

        try {
          res = await api.post('/auth/refresh', refreshPayload, { withCredentials: true, headers });
        } catch (firstErr) {
          const axiosErr = firstErr as import('axios').AxiosError;
          if (
            axiosErr.response &&
            (axiosErr.response.status === 401 || axiosErr.response.status === 403)
          ) {
            throw firstErr;
          }
          // Retry once after 1.5s for network hiccups or transient errors
          await new Promise((r) => setTimeout(r, 1500));
          res = await api.post('/auth/refresh', refreshPayload, { withCredentials: true, headers });
        }
        const newToken = res.data.token;

        setMemoryToken(newToken);
        localStorage.setItem('ascension_token', newToken);
        if (res.data.refreshToken) {
          localStorage.setItem('ascension_refresh_token', res.data.refreshToken);
        }

        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

        window.dispatchEvent(new CustomEvent('token_refresh', { detail: newToken }));
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (error) {
        const err = error as import('axios').AxiosError;
        processQueue(err, null);
        if (
          err.response &&
          (err.response.status === 400 ||
            err.response.status === 401 ||
            err.response.status === 403)
        ) {
          console.error(
            'Refresh token failed with status:',
            err.response.status,
            err.response.data,
          );
          setMemoryToken(null);
          localStorage.removeItem('ascension_token');
          localStorage.removeItem('ascension_refresh_token');
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

export default api;
