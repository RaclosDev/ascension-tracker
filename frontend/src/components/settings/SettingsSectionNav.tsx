import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  Dumbbell,
  GraduationCap,
  LucideIcon,
  Palette,
  Scale,
  User,
  Utensils,
} from 'lucide-react';

export const SETTINGS_SECTIONS = [
  { id: 'personal', label: 'Datos personales', icon: User },
  { id: 'plan', label: 'Plan de adelgazamiento', icon: Activity },
  { id: 'macros', label: 'Macros', icon: Scale },
  { id: 'meals', label: 'Comidas', icon: Utensils },
  { id: 'theme', label: 'Apariencia', icon: Palette },
  { id: 'workout', label: 'Entrenamiento', icon: Dumbbell },
  { id: 'coach', label: 'Entrenador', icon: GraduationCap },
  { id: 'data', label: 'Datos y cuenta', icon: Database },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

export function isSettingsSection(value: string | null): value is SettingsSectionId {
  return SETTINGS_SECTIONS.some((section) => section.id === value);
}

interface SettingsSectionNavProps {
  active: SettingsSectionId;
}

/**
 * Menú de secciones de ajustes: columna fija a la izquierda en escritorio y tira de
 * pestañas desplazable en móvil. Cada entrada es un enlace a `?section=`, así que se puede
 * compartir y el botón atrás vuelve a la sección anterior.
 */
export function SettingsSectionNav({ active }: SettingsSectionNavProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  // En móvil la tira se desplaza en horizontal: mantiene visible la sección activa.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft = item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2;
  }, [active]);

  // Difumina el borde por el que quedan pestañas ocultas, para que se vea que la tira se desplaza.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      const max = list.scrollWidth - list.clientWidth;
      setEdges({ start: list.scrollLeft > 2, end: max > 2 && list.scrollLeft < max - 2 });
    };
    update();
    list.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      list.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [active]);

  const fade = `${edges.start ? ' fade-start' : ''}${edges.end ? ' fade-end' : ''}`;

  return (
    <nav className="settings-nav" aria-label="Secciones de ajustes">
      <ul ref={listRef} className={`settings-nav-list${fade}`}>
        {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <li key={id}>
              <Link
                to={{ search: `?section=${id}` }}
                className={`settings-nav-item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
