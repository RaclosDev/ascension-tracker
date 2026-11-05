import { Suspense } from 'react';
import { Utensils } from 'lucide-react';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { SettingsSectionHeader } from './SettingsSectionHeader';

// Loaded on demand: meal setup needs the network anyway and keeps the drag library out of the precache.
const MealConfigurator = lazyWithRetry(() => import('../MealConfigurator'));

interface Props {
  onSaved: () => void;
}
export function SettingsMealsSection({ onSaved }: Props) {
  return (
    <div id="meals-section" className="card p-4 sm:p-6">
      <SettingsSectionHeader title="Configurar Comidas" icon={Utensils} />
      <div className="mt-5 pt-5 border-t border-white/10">
        <Suspense fallback={<div className="spinner" style={{ margin: 'auto' }} />}>
          <MealConfigurator onSaved={onSaved} />
        </Suspense>
      </div>
    </div>
  );
}
