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
      <SettingsSectionHeader
        title="Configurar Comidas"
        icon={Utensils}
        description="Las comidas en las que registras lo que comes cada día."
      />
      <div className="settings-card-body">
        <Suspense fallback={<div className="spinner" style={{ margin: 'auto' }} />}>
          <MealConfigurator onSaved={onSaved} />
        </Suspense>
      </div>
    </div>
  );
}
