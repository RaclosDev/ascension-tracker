import { LucideIcon } from 'lucide-react';

interface SettingsSectionHeaderProps {
  title: string;
  icon: LucideIcon;
}

/** Título de la sección de ajustes que se está mostrando. */
export function SettingsSectionHeader({ title, icon: Icon }: SettingsSectionHeaderProps) {
  return (
    <h2 className="flex items-center gap-2 m-0">
      <Icon size={20} className="text-primary" aria-hidden="true" />
      <span className="card-title m-0 text-base font-semibold">{title}</span>
    </h2>
  );
}
