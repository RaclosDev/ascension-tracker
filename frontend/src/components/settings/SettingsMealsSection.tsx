import { Utensils } from 'lucide-react';
import MealConfigurator from '../MealConfigurator';
import { SettingsSectionHeader } from './SettingsSectionHeader';

interface Props {
  onSaved: () => void;
}
export function SettingsMealsSection({ onSaved }: Props) {
  return (
    <div id="meals-section" className="card p-4 sm:p-6">
      <SettingsSectionHeader title="Configurar Comidas" icon={Utensils} />
      <div className="mt-5 pt-5 border-t border-white/10">
        <MealConfigurator onSaved={onSaved} />
      </div>
    </div>
  );
}
