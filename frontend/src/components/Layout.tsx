import { useState } from 'react';
import { UserSettings } from '../types/api';
import { useRef } from 'react';
import { useEffect } from 'react';
import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import BottomSheet from './BottomSheet';
import { useWorkoutStore } from '@/lib/workout/store';
import { useQuery } from '@tanstack/react-query';
import { useNow } from '@/hooks/use-now';
import { formatDuration } from '@/lib/workout/format';
import OnboardingScreen from './OnboardingScreen';

import { Skeleton } from './ui/skeleton';
import { Home, LineChart, Utensils, Dumbbell, Wrench, Settings, Plus } from 'lucide-react';

const navItems = [
  {
    path: '/dashboard',
    icon: <Home className="w-5 h-5" />,
    label: 'Dashboard',
    shortLabel: 'Inicio',
  },
  {
    path: '/tracking',
    icon: <LineChart className="w-5 h-5" />,
    label: 'Tracking Semanal',
    shortLabel: 'Tracking',
  },
  {
    path: '/nutrition',
    icon: <Utensils className="w-5 h-5" />,
    label: 'Nutrición & Macros',
    shortLabel: 'Nutrición',
  },
  {
    path: '/workout',
    icon: <Dumbbell className="w-5 h-5" />,
    label: 'Entreno',
    shortLabel: 'Entreno',
  },
  {
    path: '/utilities',
    icon: <Wrench className="w-5 h-5" />,
    label: 'Utilidades',
    shortLabel: 'Utilidades',
  },
  {
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Configuración',
    shortLabel: 'Ajustes',
  },
];

const bottomNavPaths = ['/dashboard', '/tracking', '/nutrition', '/workout'];
const moreMenuPaths = ['/utilities', '/settings'];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const activeWorkout = useWorkoutStore((s) => s.active);
  const hideNav = activeWorkout !== null && location.pathname === '/workout';
  const now = useNow(hideNav, 500);
  const elapsed = activeWorkout ? now - activeWorkout.startedAt : 0;

  const { data: settings, isLoading: loadingConfig } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: () =>
      api.get('/settings').then((res) => {
        if (res.status === 204 || !res.data) return null;
        return res.data;
      }),
  });
  const needsOnboarding = !loadingConfig && settings === null;

  // Cerrar el menú automáticamente al cambiar de página y resetear scroll
  useEffect(() => {
    setSidebarOpen(false);
    setMoreMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node | null)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [moreMenuOpen]);

  // Interceptar cualquier enlace de navegación interna en modo PWA standalone
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const anchor = target?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//') && anchor.target !== '_blank') {
        e.preventDefault();
        e.stopPropagation();
        navigate(href);
      }
    };
    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [navigate]);

  const closeSidebar = () => setSidebarOpen(false);
  const isMoreActive = moreMenuPaths.includes(location.pathname);
  if (needsOnboarding && !loadingConfig) {
    return <OnboardingScreen onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="app-root">
      {/* Barra superior de app para móvil */}
      <header className="mobile-top-bar">
        {hideNav ? (
          <div
            className="active-workout-timer"
            style={{ pointerEvents: 'auto', minWidth: '48px', justifyContent: 'center' }}
          >
            <span className="active-workout-timer-dot" />
            <span className="active-workout-timer-text">{formatDuration(elapsed)}</span>
          </div>
        ) : (
          <div style={{ width: '48px' }} />
        )}
        <div className="mobile-top-logo">
          <img src="/ascension-title.png" alt="Ascension" className="mobile-header-title-img" />
        </div>
        <div style={{ width: '48px' }} />
      </header>

      {/* Capa de fondo oscurecida para cerrar el menú */}
      <div className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />

      <div className="app-container">
        {/* Barra lateral / Cajón deslizable (desktop) */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-brand-container">
              <img src="/ascension-title.png" alt="Ascension" className="sidebar-title-img" />
              <div className="logo-subtitle">Weight Tracker</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSidebar();
                    if (location.pathname !== item.path) navigate(item.path);
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center' }}
                >
                  <span className="nav-icon" style={{ pointerEvents: 'none' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', pointerEvents: 'none' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="main-content">
          <div className="main-content-inner">
            <Suspense
              fallback={
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: 'var(--space-md) 0',
                  }}
                >
                  <Skeleton style={{ height: '160px', width: '100%', borderRadius: '16px' }} />
                  <Skeleton style={{ height: '240px', width: '100%', borderRadius: '16px' }} />
                  <Skeleton style={{ height: '140px', width: '100%', borderRadius: '16px' }} />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Bottom Nav */}
      <nav
        className={`mobile-bottom-nav${hideNav ? ' nav-hidden' : ''}`}
        aria-label="Navegación inferior"
      >
        {navItems
          .filter((i) => bottomNavPaths.includes(i.path))
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                className={`mobile-bottom-item ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMoreMenuOpen(false);
                  if (location.pathname !== item.path) navigate(item.path);
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="mobile-bottom-icon" style={{ pointerEvents: 'none' }}>
                  {item.icon}
                </span>
                <span className="mobile-bottom-label" style={{ pointerEvents: 'none' }}>
                  {item.shortLabel}
                </span>
                {isActive && (
                  <span className="mobile-bottom-indicator" style={{ pointerEvents: 'none' }} />
                )}
              </button>
            );
          })}
        {/* Botón 'Más' */}
        <button
          type="button"
          className={`mobile-bottom-item ${isMoreActive ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMoreMenuOpen(!moreMenuOpen);
          }}
          aria-label="Más opciones"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="mobile-bottom-icon" style={{ pointerEvents: 'none' }}>
            <Plus className="w-5 h-5" />
          </span>
          <span className="mobile-bottom-label" style={{ pointerEvents: 'none' }}>
            Más
          </span>
          {isMoreActive && (
            <span className="mobile-bottom-indicator" style={{ pointerEvents: 'none' }} />
          )}
        </button>
      </nav>

      {/* Bottom Sheet Menu */}
      <BottomSheet
        isOpen={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        title="Más opciones"
      >
        <div className="bottom-sheet-grid">
          {navItems
            .filter((i) => moreMenuPaths.includes(i.path))
            .map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`bottom-sheet-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMoreMenuOpen(false);
                    if (location.pathname !== item.path) navigate(item.path);
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center' }}
                >
                  <div className="bottom-sheet-item-icon" style={{ pointerEvents: 'none' }}>
                    {item.icon}
                  </div>
                  <span style={{ pointerEvents: 'none', flex: 1, textAlign: 'left' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
        </div>
      </BottomSheet>
    </div>
  );
}
