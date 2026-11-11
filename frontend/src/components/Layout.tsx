import { QueryErrorNotice } from './QueryErrorNotice';
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  Suspense,
  startTransition,
  CSSProperties,
} from 'react';
import { UserSettings } from '../types/api';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import BottomSheet from './BottomSheet';
import { useWorkoutStore } from '@/lib/workout/store';
import { useQuery } from '@tanstack/react-query';
import { WorkoutElapsedTimer } from './workout/WorkoutElapsedTimer';
import OnboardingScreen from './OnboardingScreen';
import { PasskeyPrompt } from './PasskeyPrompt';
import { preloadRoute } from '../utils/routePreload';

import { Skeleton } from './ui/skeleton';
import {
  Home,
  LineChart,
  Utensils,
  Dumbbell,
  Wrench,
  Settings,
  Plus,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { ActiveWorkoutBanner } from './workout/ActiveWorkoutBanner';
import { haptics } from '@/lib/haptics';
import { useAuth } from '../context/AuthContext';
import { isPathEnabled } from '../lib/appModules';
import { useCoachProfile } from '../lib/coach/api';
import { coachNavItems, coachBottomPaths, isItemActive } from './coach/navigation';

const navItems = [
  {
    path: '/dashboard',
    icon: <Home className="w-5 h-5" />,
    label: 'Inicio',
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
    path: '/entrenador',
    icon: <GraduationCap className="w-5 h-5" />,
    label: 'Entrenador',
    shortLabel: 'Entrenador',
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

const personalPaths = ['/dashboard', '/tracking', '/nutrition', '/workout'];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstPathRef = useRef(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userInitial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const hasActiveWorkout = useWorkoutStore((s) => s.active !== null);
  const hideNav = hasActiveWorkout && location.pathname === '/workout';

  const {
    data: settings,
    isLoading: loadingConfig,
    isError: configError,
    isFetching: fetchingConfig,
    refetch: retryConfig,
  } = useQuery<UserSettings | null>({
    queryKey: ['settings'],
    queryFn: () =>
      api.get<UserSettings | null>('/settings').then((res) => {
        if (res.status === 204 || !res.data) return null;
        return res.data;
      }),
  });
  const needsOnboarding = !loadingConfig && !configError && settings === null;
  const isCoach = useCoachProfile().data?.coach === true;

  useEffect(() => {
    if (isCoach && personalPaths.includes(location.pathname)) {
      navigate('/entrenador', { replace: true });
    }
  }, [isCoach, location.pathname, navigate]);

  // Cerrar el menú automáticamente al cambiar de página y resetear scroll
  useEffect(() => {
    setSidebarOpen(false);
    setMoreMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Move focus to the new page so screen readers announce it; not on the first load.
    if (firstPathRef.current) {
      firstPathRef.current = false;
      return;
    }
    contentRef.current?.focus({ preventScroll: true });
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

  // The page fades in on its own (.route-fade); a whole-document View Transition used to
  // animate the fixed header and nav too, and captured the old page because the router
  // commits inside its own transition.
  const navigateTo = useCallback(
    (path: string) => {
      if (`${location.pathname}${location.search}` !== path) {
        haptics.light();
        startTransition(() => {
          navigate(path);
        });
      }
    },
    [location.pathname, location.search, navigate],
  );

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
        navigateTo(href);
      }
    };
    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [navigateTo]);

  const closeSidebar = () => setSidebarOpen(false);
  // Hide the sections of the modules the user switched off (Ajustes › Módulos).
  // «Entrenador» solo aparece a quien tiene activado el modo entrenador (y entonces es lo único).
  const visibleNav = isCoach
    ? coachNavItems
    : navItems.filter((i) =>
        i.path === '/entrenador' ? false : isPathEnabled(i.path, settings?.appModules),
      );
  const bottomPaths = isCoach ? coachBottomPaths : bottomNavPaths;
  const bottomItems = visibleNav.filter((i) => bottomPaths.includes(i.path));
  const moreItems = visibleNav.filter((i) => !bottomPaths.includes(i.path));
  const isMoreActive = moreItems.some((i) => isItemActive(i.path, location.pathname));
  // Index of the highlighted tab; the "Más" button is the last slot. -1 hides the pill.
  const activeBottomIndex = isMoreActive
    ? bottomItems.length
    : bottomItems.findIndex((i) => isItemActive(i.path, location.pathname));
  if (needsOnboarding && !loadingConfig) {
    return (
      <OnboardingScreen
        onComplete={(path) => (path ? window.location.assign(path) : window.location.reload())}
      />
    );
  }

  return (
    <div className="app-root">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      {/* Capa de fondo oscurecida para cerrar el menú */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`}
        aria-hidden="true"
        onClick={closeSidebar}
      />

      <div className="app-container">
        {/* Barra lateral / Cajón deslizable (desktop) */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-brand-container">
              <span className="app-wordmark">
                Ascension<span className="app-wordmark-dot">.</span>
              </span>
              <div className="logo-subtitle">
                {isCoach ? 'Panel de entrenador' : 'Entreno · Nutrición · Peso'}
              </div>
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Navegación principal">
            {visibleNav.map((item) => {
              const isActive = isItemActive(item.path, location.pathname);
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onMouseEnter={() => preloadRoute(item.path)}
                  onTouchStart={() => preloadRoute(item.path)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSidebar();
                    navigateTo(item.path);
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
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                closeSidebar();
                void logout();
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: 'auto' }}
            >
              <span className="nav-icon" style={{ pointerEvents: 'none' }}>
                <LogOut className="w-5 h-5" aria-hidden />
              </span>
              <span style={{ flex: 1, textAlign: 'left', pointerEvents: 'none' }}>
                Cerrar sesión
              </span>
            </button>
          </nav>
        </aside>

        <main className="main-content">
          {/* Cabecera móvil: marca a la izquierda y sesión a la derecha; se desplaza con el contenido */}
          <header className="mobile-top-bar">
            <span className="app-wordmark">
              Ascension<span className="app-wordmark-dot">.</span>
            </span>
            <div className="mobile-top-actions">
              {hideNav && <WorkoutElapsedTimer />}
              <button
                type="button"
                className="mobile-avatar-btn"
                aria-label="Cuenta y ajustes"
                title="Cuenta y ajustes"
                onClick={() => navigateTo(isCoach ? '/entrenador/ajustes' : '/settings')}
              >
                {user?.picture ? (
                  <img src={user.picture} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span aria-hidden="true">{userInitial}</span>
                )}
              </button>
            </div>
          </header>
          <div id="contenido" ref={contentRef} tabIndex={-1} className="main-content-inner">
            {configError && <QueryErrorNotice retry={retryConfig} pending={fetchingConfig} />}
            <Suspense
              fallback={
                <div className="flex flex-col gap-4 py-4">
                  <Skeleton className="h-40 w-full rounded-2xl" />
                  <Skeleton className="h-60 w-full rounded-2xl" />
                  <Skeleton className="h-36 w-full rounded-2xl" />
                </div>
              }
            >
              <div key={location.pathname} className="route-fade">
                {user?.email && location.pathname !== '/entrenador/guia' && (
                  <PasskeyPrompt email={user.email} />
                )}
                <Outlet />
              </div>
            </Suspense>
          </div>
        </main>
      </div>

      {/* Banner flotante de entrenamiento activo en segundo plano */}
      <ActiveWorkoutBanner />

      {/* Bottom Nav */}
      <nav
        className={`mobile-bottom-nav${hideNav ? ' nav-hidden' : ''}`}
        aria-label="Navegación inferior"
        style={
          {
            '--nav-count': bottomItems.length + 1,
            '--nav-active': Math.max(activeBottomIndex, 0),
            display: location.pathname === '/entrenador/guia' ? 'none' : undefined,
          } as CSSProperties
        }
      >
        {/* One shared highlight that slides between tabs instead of appearing on each one */}
        <span
          className={`mobile-bottom-pill${activeBottomIndex < 0 ? ' is-hidden' : ''}`}
          aria-hidden="true"
        />
        {bottomItems.map((item) => {
          const isActive = isItemActive(item.path, location.pathname);
          return (
            <button
              key={item.path}
              type="button"
              className={`mobile-bottom-item ${isActive ? 'active' : ''}`}
              onMouseEnter={() => preloadRoute(item.path)}
              onTouchStart={() => preloadRoute(item.path)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMoreMenuOpen(false);
                navigateTo(item.path);
              }}
              aria-current={isActive ? 'page' : undefined}
              title={item.shortLabel}
            >
              <span className="mobile-bottom-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sr-only">{item.shortLabel}</span>
            </button>
          );
        })}
        {/* Botón 'Más' */}
        <button
          type="button"
          className={`mobile-bottom-item ${isMoreActive ? 'active' : ''}`}
          onMouseEnter={() => {
            preloadRoute('/utilities');
            preloadRoute('/settings');
          }}
          onTouchStart={() => {
            preloadRoute('/utilities');
            preloadRoute('/settings');
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            haptics.medium();
            preloadRoute('/utilities');
            preloadRoute('/settings');
            setMoreMenuOpen(!moreMenuOpen);
          }}
          aria-label="Más opciones"
          aria-expanded={moreMenuOpen}
          aria-haspopup="dialog"
          title="Más opciones"
        >
          <span className="mobile-bottom-icon" aria-hidden="true">
            <Plus className="w-5 h-5" />
          </span>
        </button>
      </nav>

      {/* Bottom Sheet Menu */}
      <BottomSheet
        isOpen={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        title="Más opciones"
      >
        <div className="bottom-sheet-grid">
          {moreItems.map((item) => {
            const isActive = isItemActive(item.path, location.pathname);
            return (
              <button
                key={item.path}
                type="button"
                className={`bottom-sheet-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={() => preloadRoute(item.path)}
                onTouchStart={() => preloadRoute(item.path)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMoreMenuOpen(false);
                  navigateTo(item.path);
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
          <button
            type="button"
            className="bottom-sheet-item"
            onClick={() => {
              setMoreMenuOpen(false);
              void logout();
            }}
            style={{ width: '100%', display: 'flex', alignItems: 'center' }}
          >
            <div className="bottom-sheet-item-icon" style={{ pointerEvents: 'none' }}>
              <LogOut className="w-5 h-5" aria-hidden />
            </div>
            <span style={{ pointerEvents: 'none', flex: 1, textAlign: 'left' }}>Cerrar sesión</span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
