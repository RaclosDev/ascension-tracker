import { NotebookPen, Utensils } from 'lucide-react';
import { useClientData, type CoachTargets } from '../../lib/coach/api';
import { useCoachNutritionPlan } from '../../lib/coach/nutritionPlan';
import { NutritionDiary } from './NutritionDiary';
import { NutritionPlanSection } from './NutritionPlanSection';
import { Section, num } from './ClientSection';

/** What the coach prescribes on top, and under it what the athlete actually ate, day by day. */
export default function NutritionSection({
  linkId,
  canEditPlan,
}: {
  linkId: string;
  canEditPlan: boolean;
}) {
  const plan = useCoachNutritionPlan(linkId);
  const targets = useClientData<CoachTargets>(linkId, 'targets', true);
  const own = targets.data;

  return (
    <div className="athlete-nutrition">
      <Section title="Pauta de nutrición" icon={<Utensils size={18} aria-hidden />}>
        <NutritionPlanSection linkId={linkId} canEdit={canEditPlan} />
        {plan.isSuccess && !plan.data && own && (
          <p className="athlete-nutrition-own">
            Objetivos propios de tu atleta: {num(own.kcal, ' kcal')} · P{' '}
            {num(own.customProteinGrams, ' g')} · C {num(own.customCarbsGrams, ' g')} · G{' '}
            {num(own.customFatGrams, ' g')}
          </p>
        )}
      </Section>
      <Section title="Diario de comidas" icon={<NotebookPen size={18} aria-hidden />}>
        <NutritionDiary linkId={linkId} />
      </Section>
    </div>
  );
}
