import { useState } from 'react';
import { SegmentedControl } from '../components/ui/segmented-control';
import OneRepMaxCalculator from '../components/utilities/OneRepMaxCalculator';
import PlateLoaderCalculator from '../components/utilities/PlateLoaderCalculator';
import TdeeCalculator from '../components/utilities/TdeeCalculator';
import MacroDistributionCalculator from '../components/utilities/MacroDistributionCalculator';
import UnitConverter from '../components/utilities/UnitConverter';
import AiNutritionChef from '../components/utilities/AiNutritionChef';
import CalculatorCard from '../components/calculators/CalculatorCard';
import NutritionCalculators from '../components/calculators/NutritionCalculators';

type UtilityTab = 'training' | 'nutrition' | 'tools' | 'aiChef';

const TAB_OPTIONS = [
  { label: '🏋️ Fuerza', value: 'training' },
  { label: '🥗 Nutrición', value: 'nutrition' },
  { label: '📏 Unidades', value: 'tools' },
  { label: '🤖 Chef IA', value: 'aiChef' },
];

export default function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState<UtilityTab>('training');

  return (
    <div className="fade-in max-w-4xl mx-auto px-4 pb-16 pt-4">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Utilidades y Calculadoras
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Herramientas biomecánicas, cálculo de cargas, nutrición deportiva y conversión de
          unidades.
        </p>
      </header>

      <nav aria-label="Secciones de utilidades" className="mb-6">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={(val) => setActiveTab(val as UtilityTab)}
        />
      </nav>

      <main role="region" aria-live="polite">
        {activeTab === 'training' && (
          <div className="flex flex-col gap-6">
            <CalculatorCard title="Calculadora de 1RM y Porcentajes de Fuerza" defaultOpen={true}>
              <OneRepMaxCalculator />
            </CalculatorCard>
            <CalculatorCard
              title="Distribución de Discos en Barra (Plate Loader)"
              defaultOpen={true}
            >
              <PlateLoaderCalculator />
            </CalculatorCard>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="flex flex-col gap-6">
            <CalculatorCard title="Gasto Energético (BMR y TDEE)" defaultOpen={true}>
              <TdeeCalculator />
            </CalculatorCard>
            <CalculatorCard title="Reparto de Macronutrientes por Comidas" defaultOpen={true}>
              <MacroDistributionCalculator />
            </CalculatorCard>
            <CalculatorCard title="Composición Corporal y Grasa Marina (Navy)" defaultOpen={false}>
              <NutritionCalculators />
            </CalculatorCard>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="flex flex-col gap-6">
            <CalculatorCard title="Conversor de Unidades Fitness" defaultOpen={true}>
              <UnitConverter />
            </CalculatorCard>
          </div>
        )}

        {activeTab === 'aiChef' && (
          <div className="flex flex-col gap-6">
            <AiNutritionChef />
          </div>
        )}
      </main>
    </div>
  );
}
