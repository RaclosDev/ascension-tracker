import { Link } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  Database,
  Dumbbell,
  GraduationCap,
  LayoutGrid,
  LucideIcon,
  Palette,
  Scale,
  User,
  Utensils,
} from 'lucide-react';

export const SETTINGS_SECTIONS = [
  { id: 'personal', label: 'Datos personales', icon: User },
  { id: 'modules', label: 'Módulos', icon: LayoutGrid },
  { id: 'plan', label: 'Plan de peso', icon: Activity },
  { id: 'macros', label: 'Macros', icon: Scale },
  { id: 'meals', label: 'Comidas', icon: Utensils },
  { id: 'theme', label: 'Apariencia', icon: Palette },
  { id: 'workout', label: 'Entrenamiento', icon: Dumbbell },
  { id: 'coach', label: 'Entrenador', icon: GraduationCap },
  { id: 'data', label: 'Datos y cuenta', icon: Database },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

/** A coach account only coaches: no personal data, plan, macros, meals or workouts of its own. */
export const COACH_SETTINGS_SECTIONS: readonly SettingsSectionId[] = ['theme', 'data'];

export function isSettingsSection(value: string | null): value is SettingsSectionId {
  return SETTINGS_SECTIONS.some((section) => section.id === value);
}

interface SettingsSectionNavProps {
  active: SettingsSectionId;
  /** Only these sections; all of them when omitted. */
  only?: readonly SettingsSectionId[];
}

/**
 * Menú de secciones de ajustes: columna fija a la izquierda en escritorio e índice a
 * pantalla completa en móvil, donde cada sección se abre en su propia pantalla. Cada
 * entrada es un enlace a `?section=`, así que se puede compartir y el botón atrás funciona.
 */
export function SettingsSectionNav({ active, only }: SettingsSectionNavProps) {
  return (
    <nav className="settings-nav" aria-label="Secciones de ajustes">
      <ul className="settings-nav-list">
        {SETTINGS_SECTIONS.filter((s) => !only || only.includes(s.id)).map(
          ({ id, label, icon: Icon }) => {
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
                  <ChevronRight size={18} className="settings-nav-chevron" aria-hidden="true" />
                </Link>
              </li>
            );
          },
        )}
      </ul>
    </nav>
  );
}
