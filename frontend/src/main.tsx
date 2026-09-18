import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './tailwind.css';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize theme before rendering to avoid FOUC
const savedTheme = localStorage.getItem('ascension_theme') || 'brutal';
document.documentElement.setAttribute('data-theme', savedTheme);

const queryClient = new QueryClient();

window.addEventListener('workout-migration-complete', () => {
  queryClient.invalidateQueries();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('Service worker registration failed', err);
    });
  });
}
