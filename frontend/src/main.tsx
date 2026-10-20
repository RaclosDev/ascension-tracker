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
      staleTime: 1000 * 60 * 5, // 5 minutes
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

// Automatic recovery from deployment chunk load errors (Vite native event, unhandled rejections, and uncaught error events)
const handleChunkError = async (error: unknown) => {
  if (!isChunkLoadError(error)) return;
  const reloadKey = 'ascension_chunk_reload_lock';
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
  if (now - lastReload > 8000) {
    sessionStorage.setItem(reloadKey, String(now));
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // ignore
      }
    }
    window.location.reload();
  }
};

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  void handleChunkError(event);
});

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    void handleChunkError(event.reason);
  }
});

window.addEventListener('error', (event) => {
  if (isChunkLoadError(event.error || event.message)) {
    void handleChunkError(event.error || event.message);
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
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Activate new service worker and refresh window to load the latest HTML & chunks
      updateSW(true);
      window.location.reload();
    },
  });
}
