import { useState } from 'react';
import { useClientData } from '../../lib/coach/api';
import type { FoodLog } from '../../types/api';
import { getLocalDateString } from '../../utils/dateHelper';
import { useNutritionAdherence } from '../../lib/coach/nutritionAdherence';
import { ClientFoodDay } from './ClientFoodDay';
import { QueryErrorNotice } from '../QueryErrorNotice';

export function CoachFoodSummary({ linkId, date }: { linkId: string; date: string }) {
  const [open, setOpen] = useState(false);
  const query = useNutritionAdherence(linkId, 12);
  const day = query.data?.flatMap((week) => week.days).find((day) => day.date === date);
  const older = useClientData<FoodLog[]>(
    linkId,
    `nutrition/logs?date=${date}`,
    query.isSuccess && !day && date <= getLocalDateString(),
  );
  const intake =
    day?.intake ??
    (older.data?.length
      ? older.data.reduce(
          (total, log) => ({
            kcal: total.kcal + log.kcal,
            protein: total.protein + log.protein,
            carbs: total.carbs + log.carbs,
            fat: total.fat + log.fat,
          }),
          { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        )
      : null);
  if (query.isPending) return <p role="status">Cargando comidas…</p>;
  if (query.isError) return <QueryErrorNotice retry={query.refetch} pending={query.isFetching} />;
  if (older.isFetching && !day && !older.data) return <p role="status">Cargando comidas…</p>;
  if (older.isError) return <QueryErrorNotice retry={older.refetch} pending={older.isFetching} />;
  const labels = { kcal: 'kcal', protein: 'Proteínas', carbs: 'Carbohidratos', fat: 'Grasas' };
  return (
    <details className="coach-food-summary" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>
        <strong>
          Comidas <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </strong>
        {intake ? (
          <dl>
            {(Object.keys(labels) as Array<keyof typeof labels>).map((key) => (
              <div key={key}>
                <dt>{labels[key]}</dt>
                <dd>
                  {Math.round(intake[key])} / {day?.target ? Math.round(day.target[key]) : '—'}
                  {key === 'kcal' ? '' : ' g'}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <span>Sin registro</span>
        )}
        {!day?.target && <small>Objetivo no disponible</small>}
      </summary>
      {open && <ClientFoodDay linkId={linkId} date={date} />}
    </details>
  );
}
