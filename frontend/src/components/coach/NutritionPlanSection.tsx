import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage, formatCoachDate } from '@/lib/coach/api';
import {
  dayKcal,
  useCoachNutritionPlan,
  useEndNutritionPlan,
  useSetNutritionPlan,
  type DayGrams,
  type NutritionPlan,
} from '@/lib/coach/nutritionPlan';

const DAYS = [
  { key: 'training', label: 'Día de entreno' },
  { key: 'rest', label: 'Día de descanso' },
] as const;
const MACROS = [
  { key: 'protein', label: 'Proteína' },
  { key: 'carbs', label: 'Carbohidratos' },
  { key: 'fat', label: 'Grasa' },
] as const;

type Draft = Record<'training' | 'rest', Record<keyof DayGrams, string>>;

const toDraft = (plan: NutritionPlan | null | undefined): Draft => {
  const grams = (day: 'training' | 'rest') => ({
    protein: plan ? String(plan[day].protein) : '',
    carbs: plan ? String(plan[day].carbs) : '',
    fat: plan ? String(plan[day].fat) : '',
  });
  return { training: grams('training'), rest: grams('rest') };
};

const parseGrams = (value: string) => {
  const n = Number(value);
  return value.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 1000 ? n : null;
};

const parseDay = (day: Record<keyof DayGrams, string>): DayGrams | null => {
  const protein = parseGrams(day.protein);
  const carbs = parseGrams(day.carbs);
  const fat = parseGrams(day.fat);
  if (protein == null || carbs == null || fat == null || protein + carbs + fat === 0) return null;
  return { protein, carbs, fat };
};

/** The calorie and macro targets the coach sets, per training and rest day. */
export function NutritionPlanSection({ linkId, canEdit }: { linkId: string; canEdit: boolean }) {
  const plan = useCoachNutritionPlan(linkId);

  if (plan.isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (plan.isError) return <p role="alert">No se pudo cargar la pauta de nutrición.</p>;
  return (
    <PlanForm
      key={plan.data?.id ?? 'none'}
      linkId={linkId}
      plan={plan.data ?? null}
      canEdit={canEdit}
    />
  );
}

function PlanForm({
  linkId,
  plan,
  canEdit,
}: {
  linkId: string;
  plan: NutritionPlan | null;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState(() => toDraft(plan));
  const [notes, setNotes] = useState(plan?.notes ?? '');
  const save = useSetNutritionPlan(linkId);
  const end = useEndNutritionPlan(linkId);
  const training = parseDay(draft.training);
  const rest = parseDay(draft.rest);
  const busy = save.isPending || end.isPending;

  if (!canEdit && !plan) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Sin pauta de nutrición. Tu alumno no te ha dado permiso para pautarla.
      </p>
    );
  }

  const submit = () => {
    if (!training || !rest) return;
    save.mutate(
      { training, rest, notes: notes.trim() || null },
      {
        onSuccess: () => toast.success('Pauta de nutrición guardada'),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar la pauta')),
      },
    );
  };

  const remove = () =>
    end.mutate(undefined, {
      onSuccess: () => toast.success('Pauta de nutrición retirada'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo retirar la pauta')),
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {plan
          ? `Pauta activa desde ${formatCoachDate(plan.createdAt)}. Sustituye los objetivos de tu alumno.`
          : 'Sin pauta: tu alumno usa sus propios objetivos.'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {DAYS.map((day) => {
          const parsed = day.key === 'training' ? training : rest;
          return (
            <fieldset key={day.key} className="flex flex-col gap-2" disabled={!canEdit || busy}>
              <legend className="font-semibold text-white mb-1">{day.label}</legend>
              {MACROS.map((macro) => (
                <label key={macro.key} className="flex items-center justify-between gap-3 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{macro.label} (g)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000}
                    step={1}
                    className="w-24 rounded-lg px-3 py-2 bg-black/20 border text-right"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    aria-label={`${macro.label} ${day.label.toLowerCase()}`}
                    value={draft[day.key][macro.key]}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [day.key]: { ...d[day.key], [macro.key]: e.target.value },
                      }))
                    }
                  />
                </label>
              ))}
              <p className="text-sm font-bold text-white">
                {parsed ? `${dayKcal(parsed)} kcal` : 'Gramos enteros entre 0 y 1000'}
              </p>
            </fieldset>
          );
        })}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Notas para tu alumno</span>
        <textarea
          className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
          style={{ borderColor: 'var(--border-subtle)' }}
          rows={2}
          maxLength={1000}
          disabled={!canEdit || busy}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !training || !rest}
            onClick={submit}
          >
            Guardar pauta
          </button>
          {plan && (
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={remove}>
              Quitar pauta
            </button>
          )}
        </div>
      )}
    </div>
  );
}
