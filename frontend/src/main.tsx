import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

// Initialize theme before rendering to avoid FOUC
const savedTheme = localStorage.getItem('ascension_theme') || 'brutal';
document.documentElement.setAttribute('data-theme', savedTheme);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

window.addEventListener('workout-migration-complete', () => {
  queryClient.invalidateQueries({ queryKey: ['workouts'] });
  queryClient.invalidateQueries({ queryKey: ['workout-history'] });
  queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
  queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
});

import { isChunkLoadError } from './utils/lazyWithRetry';

// Keep this guard separate from lazyWithRetry's lock: the two code paths used
// incompatible values ("true" vs a timestamp) for the same key, preventing recovery.
const handleChunkError = (error: unknown) => {
  if (!isChunkLoadError(error)) return;
  const reloadKey = 'ascension_global_chunk_reload_at';
  const now = Date.now();
  const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
  if (!Number.isFinite(lastReload) || now - lastReload > 60_000) {
    sessionStorage.setItem(reloadKey, String(now));
    // Do not delete Workbox's precache: it is the offline application shell.
    window.location.reload();
  }
};

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  handleChunkError(event);
});

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    handleChunkError(event.reason);
  }
});

window.addEventListener('error', (event) => {
  if (isChunkLoadError(event.error || event.message)) {
    handleChunkError(event.error || event.message);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

import { registerSW } from 'virtual:pwa-register';

if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
) {
  // autoUpdate already coordinates activation/reload. A second manual reload races
  // the controller change and can reload under the previous worker.
  registerSW({ immediate: true });
}
