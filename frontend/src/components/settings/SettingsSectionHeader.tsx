import { LucideIcon } from 'lucide-react';

interface SettingsSectionHeaderProps {
  title: string;
  icon: LucideIcon;
  /** Una frase que dice para qué sirve la sección. */
  description?: string;
}

/** Título de la sección de ajustes que se está mostrando. */
export function SettingsSectionHeader({
  title,
  icon: Icon,
  description,
}: SettingsSectionHeaderProps) {
  return (
    <>
      <h2 className="flex items-center gap-2 m-0">
        <Icon size={20} className="text-primary" aria-hidden="true" />
        <span className="card-title m-0 text-base font-semibold">{title}</span>
      </h2>
      {description && <p className="settings-card-desc">{description}</p>}
    </>
  );
}
