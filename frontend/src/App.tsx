import React, { Component, useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import api from './api/client';
import { applyThemeColor } from './utils/colorHelper';
import { fetchExerciseCatalog } from './lib/workout/exercises';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const NutritionPage = lazy(() => import('./pages/NutritionPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WorkoutPage = lazy(() => import('./pages/WorkoutPage'));
const UtilitiesPage = lazy(() => import('./pages/UtilitiesPage'));
import LoginPage from './pages/LoginPage';

import { PageLoader } from './components/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';

let currentAppVersion: string | null = null;

function AppContent() {
  const { token, isReady } = useAuth();

  useEffect(() => {
    if (token) {
      api
        .get('/version')
        .then((res) => {
          currentAppVersion = res.data.version;
        })
        .catch((err: any) => console.error('Error fetching app version', err));

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          api
            .get('/version')
            .then((res) => {
              if (currentAppVersion && res.data.version !== currentAppVersion) {
                window.location.reload();
              }
            })
            .catch((err: any) => console.error('Error fetching app version', err));
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [token]);

  // Wait for auth to finish (proactive refresh if JWT was expired)
  if (!isReady) return null;

  if (!token) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tracking" element={<TrackingPage />} />
            <Route path="nutrition" element={<NutritionPage />} />
            <Route path="workout" element={<WorkoutPage />} />
            <Route path="utilities" element={<UtilitiesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
}

class GlobalErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (error.name === 'ChunkLoadError' || error.message?.includes('fetch')) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#f1f5f9',
            background: '#09090B',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '10px' }}>Nueva versiÃ³n disponible</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Estamos actualizando la app. Por favor, recarga.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('ascension_custom_color') || '#0085FF';
    applyThemeColor(savedTheme);
  }, []);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        document.body.classList.add('keyboard-open');
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        document.body.classList.remove('keyboard-open');
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || null,
  );
  const [authError, setAuthError] = useState(false);
  useEffect(() => {
    fetchExerciseCatalog().catch(console.error);

    if (!googleClientId) {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);

      fetch(baseUrl + '/api/auth/config', { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error('Failed config fetch');
          return res.json();
        })
        .then((data: any) => {
          clearTimeout(timeoutId);
          if (data.googleClientId && data.googleClientId !== 'CHANGE_ME') {
            setGoogleClientId(data.googleClientId);
          } else {
            setAuthError(true);
          }
        })
        .catch((err: any) => {
          clearTimeout(timeoutId);
          console.error('Error al cargar la config de auth:', err);
          setAuthError(true);
        });
      return () => {
        controller.abort();
        clearTimeout(timeoutId);
      };
    }
  }, [googleClientId]);

  if (authError && !googleClientId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#f1f5f9',
          background: '#09090B',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: '10px' }}>Error de conexiÃ³n</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
          No se pudo cargar la configuraciÃ³n segura. Comprueba tu conexiÃ³n y que el servidor estÃ¡
          online.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!googleClientId) {
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <Toaster
              position="top-center"
              containerStyle={{
                top: 70,
                left: 20,
                right: 20,
              }}
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--bg-glass-strong, rgba(17, 24, 39, 0.95))',
                  color: 'var(--text-primary, #f1f5f9)',
                  border: '1px solid var(--border-medium, rgba(255,255,255,0.1))',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                },
              }}
            />
            <AppContent />
          </AuthProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}




