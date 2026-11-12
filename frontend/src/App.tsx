import React, { Component, useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfirmationDialog } from './components/ui/ConfirmationDialog';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { isCoachTourFrame } from './components/coach/tour/frame';
const CoachTourRunPage = lazyWithRetry(() => import('./pages/CoachTourRunPage'));
const CoachTourBridge = lazyWithRetry(() => import('./components/coach/tour/CoachTourBridge'));
import api from './api/client';
import { applyThemeColor, readThemeColor } from './utils/colorHelper';
import { applyColorMode, readColorMode, watchSystemColorMode } from './utils/colorMode';
import { lazyWithRetry, isChunkLoadError } from './utils/lazyWithRetry';

const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const TrackingPage = lazyWithRetry(() => import('./pages/TrackingPage'));
const TrackingMetricPage = lazyWithRetry(() => import('./pages/TrackingMetricPage'));
const NutritionPage = lazyWithRetry(() => import('./pages/NutritionPage'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const WorkoutPage = lazyWithRetry(() => import('./pages/WorkoutPage'));
const UtilitiesPage = lazyWithRetry(() => import('./pages/UtilitiesPage'));
const CoachPage = lazyWithRetry(() => import('./pages/CoachPage'));
const CoachTourPage = lazyWithRetry(() => import('./pages/CoachTourPage'));
const CoachClientsPage = lazyWithRetry(() => import('./pages/CoachClientsPage'));
const CoachReviewsPage = lazyWithRetry(() => import('./pages/CoachReviewsPage'));
const CoachPlanningPage = lazyWithRetry(() => import('./pages/CoachPlanningPage'));
const CoachSettingsPage = lazyWithRetry(() => import('./pages/CoachSettingsPage'));
const CoachClientPage = lazyWithRetry(() => import('./pages/CoachClientPage'));
const CoachProgramsPage = lazyWithRetry(() => import('./pages/CoachProgramsPage'));
const CoachProgramEditorPage = lazyWithRetry(() => import('./pages/CoachProgramEditorPage'));
const CoachProgramAdaptPage = lazyWithRetry(() => import('./pages/CoachProgramAdaptPage'));
const CoachRecipesPage = lazyWithRetry(() => import('./pages/CoachRecipesPage'));
const CoachNutritionTemplatesPage = lazyWithRetry(
  () => import('./pages/CoachNutritionTemplatesPage'),
);
const CoachNutritionTemplateEditorPage = lazyWithRetry(
  () => import('./pages/CoachNutritionTemplateEditorPage'),
);
const CoachPlanPage = lazyWithRetry(() => import('./pages/CoachPlanPage'));
const LegalPage = lazyWithRetry(() => import('./pages/LegalPage'));
const AdminPlansPage = lazyWithRetry(() => import('./pages/AdminPlansPage'));
const CoachCheckinPage = lazyWithRetry(() => import('./pages/CoachCheckinPage'));
const InvitationPage = lazyWithRetry(() => import('./pages/InvitationPage'));
import LandingPage from './pages/LandingPage';
import { HomeRedirect, RememberInvitation } from './components/coach/InvitationRedirects';

import { PageLoader } from './components/PageLoader';
import { LEGAL_DOCS } from './lib/legal/docs';
import ErrorBoundary from './components/ErrorBoundary';
import { ConsentGate } from './components/consent/ConsentGate';
import { preloadAllRoutes } from './utils/routePreload';
import { useWorkoutStore } from './lib/workout/store';

let currentAppVersion: string | null = null;

function AppConfirmations() {
  const { token, user } = useAuth();
  const location = useLocation();
  return <ConfirmationDialog scope={`${location.key}:${user?.email ?? ''}:${!!token}`} />;
}

function LegacyCoachClientsRedirect() {
  const { pathname, search, hash } = useLocation();
  const athletePath = pathname.replace(/^\/entrenador\/alumnos(?=\/|$)/i, '/entrenador/atletas');
  return <Navigate to={{ pathname: athletePath, search, hash }} replace />;
}

function AppContent() {
  const { token, isReady } = useAuth();

  useEffect(() => {
    if (token) {
      preloadAllRoutes();
      api
        .get('/version')
        .then((res) => {
          currentAppVersion = res.data.version;
        })
        .catch((err: unknown) =>
          console.error(
            'Error fetching app version:',
            err instanceof Error ? err.message : String(err),
          ),
        );

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Do not interrupt an active workout with a version reload
          try {
            const active = useWorkoutStore.getState().active;
            if (active != null) return;
          } catch {
            // ignore
          }

          api
            .get('/version')
            .then((res) => {
              if (currentAppVersion && res.data.version !== currentAppVersion) {
                window.location.reload();
              }
            })
            .catch(() => {
              // Ignore background version check errors silently without logging out
            });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [token]);

  const legalRoutes = LEGAL_DOCS.map((doc) => (
    <Route
      key={doc}
      path={`/${doc}`}
      element={
        <Suspense fallback={<PageLoader />}>
          <LegalPage doc={doc} />
        </Suspense>
      }
    />
  ));

  // Wait for auth to finish (proactive refresh if JWT was expired); the legal pages need no session.
  if (!isReady) {
    return (
      <ErrorBoundary>
        <Routes>
          {legalRoutes}
          <Route path="*" element={null} />
        </Routes>
      </ErrorBoundary>
    );
  }

  if (!token) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LandingPage />} />
          <Route path="/invitacion/:token" element={<RememberInvitation />} />
          <Route
            path="/restablecer-contrasena"
            element={
              <Suspense fallback={<PageLoader />}>
                <ResetPasswordPage />
              </Suspense>
            }
          />
          {legalRoutes}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ConsentGate>
        <Suspense fallback={<PageLoader />}>
          {isCoachTourFrame() && <CoachTourBridge />}
          <Routes>
            <Route path="/entrenador/guia/recorrido" element={<CoachTourRunPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<HomeRedirect />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tracking" element={<TrackingPage />} />
              <Route
                path="tracking/pasos"
                element={<TrackingMetricPage key="steps" metric="steps" />}
              />
              <Route
                path="tracking/peso"
                element={<TrackingMetricPage key="weight" metric="weight" />}
              />
              <Route path="nutrition" element={<NutritionPage />} />
              <Route path="workout" element={<WorkoutPage />} />
              <Route path="utilities" element={<UtilitiesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="entrenador" element={<CoachPage />} />
              <Route path="entrenador/guia" element={<CoachTourPage />} />
              <Route path="entrenador/atletas" element={<CoachClientsPage />} />
              <Route path="entrenador/alumnos/*" element={<LegacyCoachClientsRedirect />} />
              <Route path="entrenador/revisiones" element={<CoachReviewsPage />} />
              <Route path="entrenador/planificacion" element={<CoachPlanningPage />} />
              <Route path="entrenador/ajustes" element={<CoachSettingsPage />} />
              <Route path="entrenador/atletas/:linkId" element={<CoachClientPage />} />
              <Route
                path="entrenador/atletas/:linkId/programas/:assignmentId/adaptar"
                element={<CoachProgramAdaptPage />}
              />
              <Route path="entrenador/programas" element={<CoachProgramsPage />} />
              <Route path="entrenador/programas/:programId" element={<CoachProgramEditorPage />} />
              <Route path="entrenador/recetas" element={<CoachRecipesPage />} />
              <Route path="entrenador/pautas" element={<CoachNutritionTemplatesPage />} />
              <Route
                path="entrenador/pautas/:templateId"
                element={<CoachNutritionTemplateEditorPage />}
              />
              <Route path="entrenador/plan" element={<CoachPlanPage />} />
              {LEGAL_DOCS.map((doc) => (
                <Route key={doc} path={doc} element={<LegalPage doc={doc} />} />
              ))}
              <Route path="admin/planes" element={<AdminPlansPage />} />
              <Route path="checkin/:linkId" element={<CoachCheckinPage />} />
              <Route path="invitacion/:token" element={<InvitationPage />} />
            </Route>
            <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
            <Route path="/login" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ConsentGate>
    </ErrorBoundary>
  );
}

class GlobalErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem('ascension_eb_reload_lock');
      if (!alreadyReloaded) {
        sessionStorage.setItem('ascension_eb_reload_lock', 'true');
        window.location.reload();
      }
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
            color: 'var(--ink)',
            background: 'var(--paper)',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '10px' }}>Nueva versión disponible</h2>
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
    const savedTheme = readThemeColor();
    applyThemeColor(savedTheme);
  }, []);

  useEffect(() => {
    applyColorMode(readColorMode());
    return watchSystemColorMode();
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
    if (!googleClientId) {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const controller = new AbortController();
      let disposed = false;
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);

      fetch(baseUrl + '/api/auth/config', { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error('Failed config fetch');
          return res.json();
        })
        .then((data: { googleClientId?: string }) => {
          clearTimeout(timeoutId);
          if (disposed) return;
          if (data.googleClientId && data.googleClientId !== 'CHANGE_ME') {
            setGoogleClientId(data.googleClientId);
          } else {
            setAuthError(true);
          }
        })
        .catch((err: Error) => {
          clearTimeout(timeoutId);
          if (disposed) return;
          console.error('Error al cargar la config de auth:', err);
          setAuthError(true);
        });
      return () => {
        disposed = true;
        controller.abort();
        clearTimeout(timeoutId);
      };
    }
  }, [googleClientId]);

  if (authError && !googleClientId) {
    return (
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--ink)',
          background: 'var(--paper)',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '10px', fontSize: '1.5rem' }}>Error de conexión</h1>
        <p style={{ color: '#3f4652', marginBottom: '20px' }}>
          No se pudo cargar la configuración segura. Comprueba tu conexión y que el servidor está
          online.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </main>
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
                className: 'paper-toast',
              }}
            />
            <AppContent />
            <AppConfirmations />
          </AuthProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}
