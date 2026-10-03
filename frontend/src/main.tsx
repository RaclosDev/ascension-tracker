import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './tailwind.css';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      // Silently update the PWA when a new version is detected
      updateSW(true);
    },
  });
}




