import { Link } from 'react-router-dom';
import { NotebookPen, Utensils } from 'lucide-react';
import { useClientData, type CoachTargets } from '../../lib/coach/api';
import { NUTRITION_DAYS } from '../../lib/coach/nutritionDraft';
import { useCoachNutritionPlan } from '../../lib/coach/nutritionPlan';
import { useAthleteLinks } from './AthleteShell';
import { NutritionDiary } from './NutritionDiary';
import { NutritionPlanSection } from './NutritionPlanSection';
import { Section, num } from './ClientSection';

/** Nutrition in two views: what the athlete ate, and the plan the coach sets. */
export default function NutritionSection({
  linkId,
  view,
  canEditPlan,
}: {
  linkId: string;
  view: 'diario' | 'pauta';
  canEditPlan: boolean;
}) {
  const plan = useCoachNutritionPlan(linkId);
  const targets = useClientData<CoachTargets>(linkId, 'targets', true);
  const { sectionHref } = useAthleteLinks(linkId);
  const own = targets.data;
  const current = plan.data;
  const ownLine = plan.isSuccess && !plan.data && own && (
    <p className="athlete-nutrition-own">
      Objetivos propios de tu atleta: {num(own.kcal, ' kcal')} · P{' '}
      {num(own.customProteinGrams, ' g')} · H {num(own.customCarbsGrams, ' g')} · G{' '}
      {num(own.customFatGrams, ' g')}
    </p>
  );

  if (view === 'pauta')
    return (
      <div className="athlete-nutrition">
        <Section title="Pauta de nutrición" icon={<Utensils size={18} aria-hidden />}>
          <NutritionPlanSection linkId={linkId} canEdit={canEditPlan} />
          {ownLine}
        </Section>
      </div>
    );

  return (
    <div className="athlete-nutrition">
      {plan.isSuccess && (
        <div className="athlete-nutrition-targets">
          {current ? (
            <dl>
              {NUTRITION_DAYS.map((day) => (
                <div key={day.key}>
                  <dt>{day.label}</dt>
                  <dd>
                    <b>{current[day.key].kcal.toLocaleString('es-ES')} kcal</b> · P{' '}
                    {current[day.key].protein} g · C {current[day.key].carbs} g · G{' '}
                    {current[day.key].fat} g
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div>
              <p>Sin pauta publicada.</p>
              {ownLine}
            </div>
          )}
          <Link className="btn btn-secondary" to={sectionHref('pauta')}>
            {plan.data ? 'Ver pauta' : canEditPlan ? 'Crear pauta' : 'Ver pauta'}
          </Link>
        </div>
      )}
      <Section title="Diario de comidas" icon={<NotebookPen size={18} aria-hidden />}>
        <NutritionDiary linkId={linkId} />
      </Section>
    </div>
  );
}
