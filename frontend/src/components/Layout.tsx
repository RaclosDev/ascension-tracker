import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import BottomSheet from './BottomSheet';

import { Home, LineChart, Utensils, Dumbbell, Wrench, Settings } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: <Home className="w-5 h-5" />, label: 'Dashboard', shortLabel: 'Inicio' },
  { path: '/tracking', icon: <LineChart className="w-5 h-5" />, label: 'Tracking Semanal', shortLabel: 'Tracking' },
  { path: '/nutrition', icon: <Utensils className="w-5 h-5" />, label: 'Nutrición & Macros', shortLabel: 'Nutrición' },
  { path: '/workout', icon: <Dumbbell className="w-5 h-5" />, label: 'Entreno', shortLabel: 'Entreno' },
  { path: '/utilities', icon: <Wrench className="w-5 h-5" />, label: 'Utilidades', shortLabel: 'Utilidades' },
  { path: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Configuración', shortLabel: 'Ajustes' },
];

const bottomNavPaths = ['/dashboard', '/tracking', '/nutrition', '/workout'];
const moreMenuPaths = ['/utilities', '/settings'];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar el menú automáticamente al cambiar de página y resetear scroll
  useEffect(() => {
    setSidebarOpen(false);
    setMoreMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [moreMenuOpen]);

  // Interceptar cualquier enlace de navegación interna en modo PWA standalone
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a');
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

  return (
    <div className="app-root">
      {/* Barra superior de app para móvil */}
      <header className="mobile-top-bar">
        <div style={{ width: '48px' }} />
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
            {navItems.map(item => {
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
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

        </aside>

        <main className="main-content">
          <div className="main-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Nav */}
      <nav className="mobile-bottom-nav" aria-label="Navegación inferior">
        {navItems.filter(i => bottomNavPaths.includes(i.path)).map(item => {
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
            >
              <span className="mobile-bottom-icon">{item.icon}</span>
              <span className="mobile-bottom-label">{item.shortLabel}</span>
              {isActive && <span className="mobile-bottom-indicator" />}
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
        >
          <span className="mobile-bottom-icon">☰</span>
          <span className="mobile-bottom-label">Más</span>
          {isMoreActive && <span className="mobile-bottom-indicator" />}
        </button>
      </nav>

      {/* Bottom Sheet Menu */}
      <BottomSheet 
        isOpen={moreMenuOpen} 
        onClose={() => setMoreMenuOpen(false)}
        title="Más opciones"
      >
        <div className="bottom-sheet-grid">
          {navItems.filter(i => moreMenuPaths.includes(i.path)).map(item => {
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
              >
                <div className="bottom-sheet-item-icon">{item.icon}</div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
