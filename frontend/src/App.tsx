import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TrackingPage from './pages/TrackingPage';
import NutritionPage from './pages/NutritionPage';
import MyFoodsPage from './pages/MyFoodsPage';
import SettingsPage from './pages/SettingsPage';
import WorkoutPage from './pages/WorkoutPage';
import UtilitiesPage from './pages/UtilitiesPage';
import LoginPage from './pages/LoginPage';
import { useEffect, useState } from 'react';
import api from './api/client';
import { applyThemeColor } from './utils/colorHelper';


let currentAppVersion = null;

function AppContent() {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      api.get('/version').then(res => {
        currentAppVersion = res.data.version;
      }).catch(err => console.error("Error fetching app version", err));
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          api.get('/version').then(res => {
            if (currentAppVersion && res.data.version !== currentAppVersion) {
              window.location.reload();
            }
          }).catch(err => console.error("Error fetching app version", err));
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [token]);

  if (!token) {
    return (
      <>
        <LoginPage />
              </>
    );
  }

  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
          </BrowserRouter>
  );
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('ascension_custom_color') || '#0085FF';
    applyThemeColor(savedTheme);
  }, []);
  useEffect(() => {
    const handleTouchStart = (e) => {
      const x = e.touches[0].clientX;
      if (x < 20 || x > window.innerWidth - 20) {
        e.preventDefault();
      }
    };
    
    const handleFocusIn = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        document.body.classList.add('keyboard-open');
      }
    };
    
    const handleFocusOut = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        document.body.classList.remove('keyboard-open');
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!googleClientId) {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort(); }, 5000);

      fetch(baseUrl + '/api/auth/config', { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error('Failed config fetch');
          return res.json();
        })
        .then(data => {
          clearTimeout(timeoutId);
          if (data.googleClientId && data.googleClientId !== 'CHANGE_ME') {
            setGoogleClientId(data.googleClientId);
          } else {
            setAuthError(true);
          }
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error("Error al cargar la config de auth:", err);
          setAuthError(true);
        });
    }
  }, [googleClientId]);

  if (authError && !googleClientId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'var(--text-primary)', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '10px' }}>Error de conexión</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>No se pudo cargar la configuración segura. Comprueba tu conexión y que el servidor está online.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  if (!googleClientId) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        Cargando configuración...
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}


