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

/** Los grupos del índice, en el orden en que se muestran. */
const SETTINGS_GROUPS = ['Perfil', 'Nutrición', 'Entreno', 'Aplicación'] as const;

type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export const SETTINGS_SECTIONS = [
  {
    id: 'personal',
    group: 'Perfil',
    label: 'Datos personales',
    hint: 'Edad, altura, actividad y objetivo de peso',
    icon: User,
  },
  {
    id: 'modules',
    group: 'Perfil',
    label: 'Módulos',
    hint: 'Elige qué partes de la app usas',
    icon: LayoutGrid,
  },
  {
    id: 'plan',
    group: 'Nutrición',
    label: 'Plan de peso',
    hint: 'Calcula tus calorías según tu meta y tu plazo',
    icon: Activity,
  },
  {
    id: 'macros',
    group: 'Nutrición',
    label: 'Macros',
    hint: 'Calorías, proteína, grasa y carbohidratos',
    icon: Scale,
  },
  {
    id: 'meals',
    group: 'Nutrición',
    label: 'Comidas',
    hint: 'Las comidas en las que registras tu día',
    icon: Utensils,
  },
  {
    id: 'workout',
    group: 'Entreno',
    label: 'Entrenamiento',
    hint: 'Descanso, RPE, material e importación de Hevy',
    icon: Dumbbell,
  },
  {
    id: 'coach',
    group: 'Entreno',
    label: 'Entrenador',
    hint: 'Quién te entrena y qué ha consultado',
    icon: GraduationCap,
  },
  {
    id: 'theme',
    group: 'Aplicación',
    label: 'Apariencia',
    hint: 'Modo claro u oscuro y color principal',
    icon: Palette,
  },
  {
    id: 'data',
    group: 'Aplicación',
    label: 'Datos y cuenta',
    hint: 'Llaves de acceso, privacidad, copias y sesión',
    icon: Database,
  },
] as const satisfies readonly {
  id: string;
  group: SettingsGroup;
  label: string;
  hint: string;
  icon: LucideIcon;
}[];

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
 * Índice de Ajustes, agrupado. En móvil es la pantalla de entrada (cada fila explica qué hay
 * dentro); en escritorio, la columna lateral. El nombre accesible de cada enlace es solo su
 * etiqueta: la pista va como descripción.
 */
export function SettingsSectionNav({ active, only }: SettingsSectionNavProps) {
  const groups = SETTINGS_GROUPS.map((title, index) => ({
    title,
    headingId: `settings-nav-group-${index}`,
    sections: SETTINGS_SECTIONS.filter(
      (section) => section.group === title && (!only || only.includes(section.id)),
    ),
  })).filter((group) => group.sections.length > 0);

  return (
    <nav className="settings-nav" aria-label="Secciones de ajustes">
      {groups.map(({ title, headingId, sections }) => (
        <div key={title}>
          <h2 id={headingId} className="settings-nav-heading">
            {title}
          </h2>
          <ul className="settings-nav-list" aria-labelledby={headingId}>
            {sections.map(({ id, label, hint, icon: Icon }) => {
              const isActive = id === active;
              return (
                <li key={id}>
                  <Link
                    to={{ search: `?section=${id}` }}
                    className={`settings-nav-item ${isActive ? 'is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-labelledby={`settings-nav-${id}-label`}
                    aria-describedby={`settings-nav-${id}-hint`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="settings-nav-text">
                      <span id={`settings-nav-${id}-label`}>{label}</span>
                      <span id={`settings-nav-${id}-hint`} className="settings-nav-hint">
                        {hint}
                      </span>
                    </span>
                    <ChevronRight size={18} className="settings-nav-chevron" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
