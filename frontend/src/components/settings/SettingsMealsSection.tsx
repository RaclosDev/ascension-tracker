import type { MouseEvent } from 'react';
import { Utensils } from 'lucide-react';
import MealConfigurator from '../MealConfigurator';
import { SettingsAccordionHeader } from './SettingsAccordionHeader';

interface Props {
  isOpen: boolean;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  onSaved: () => void;
}
export function SettingsMealsSection({ isOpen, onToggle, onSaved }: Props) {
  return (
    <div
      id="meals-section"
      className={`card accordion-card transition-all duration-300 ease-out ${isOpen ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
    >
      <SettingsAccordionHeader
        panelId="settings-meals-panel"
        title="Configurar Comidas"
        icon={Utensils}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen && (
        <div
          id="settings-meals-panel"
          className="accordion-content fade-in mt-5 pt-5 border-t border-white/10"
        >
          <MealConfigurator onSaved={onSaved} />
        </div>
      )}
    </div>
  );
}
