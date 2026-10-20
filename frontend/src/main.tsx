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

// Automatic recovery from deployment chunk load errors (Vite native event)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const reloadKey = 'ascension_preload_retry';
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
  if (now - lastReload > 8000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
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
