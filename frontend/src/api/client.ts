import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
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
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> =
  [];

const processQueue = (error: any, token: string | null = null) => {
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
          .catch((err: any) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let res;
        try {
          res = await api.post('/auth/refresh', {}, { withCredentials: true });
        } catch {
          // Retry once after 1s (handles Railway cold starts, network hiccups)
          await new Promise((r) => setTimeout(r, 1000));
          res = await api.post('/auth/refresh', {}, { withCredentials: true });
        }
        const newToken = res.data.token;

        localStorage.setItem('jwt_token', newToken);

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
          localStorage.removeItem('jwt_token');
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

export default api;




