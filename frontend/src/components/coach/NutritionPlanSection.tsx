import { confirmAction } from '../../lib/confirmation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSessionDraft } from '@/hooks/useSessionDraft';
import { apiErrorMessage, formatCoachDate } from '@/lib/coach/api';
import { useCoachRecipes } from '@/lib/coach/coachRecipes';
import {
  isNutritionDraft,
  previewNutrition,
  nutritionDraft,
  nutritionRequest,
  type NutritionDraft,
} from '@/lib/coach/nutritionDraft';
import {
  useCoachNutritionPlan,
  useEndNutritionPlan,
  useSetNutritionPlan,
  type NutritionPlan,
} from '@/lib/coach/nutritionPlan';
import { NutritionPlanFields } from './NutritionPlanFields';
import { NutritionPlanHistory } from './NutritionPlanHistory';
import { NutritionPlanSummary } from './NutritionPlanSummary';
import { NutritionTemplatePicker } from './NutritionTemplatePicker';

interface ClientDraft {
  baseId: string | null;
  fields: NutritionDraft;
}
const isClientDraft = (value: unknown): value is ClientDraft =>
  typeof value === 'object' &&
  value !== null &&
  'baseId' in value &&
  (value.baseId === null || typeof value.baseId === 'string') &&
  'fields' in value &&
  isNutritionDraft(value.fields);

export function NutritionPlanSection({ linkId, canEdit }: { linkId: string; canEdit: boolean }) {
  const plan = useCoachNutritionPlan(linkId);
  if (plan.isPending) return <p role="status">Cargando pauta…</p>;
  if (plan.isError)
    return (
      <div role="alert">
        No se pudo cargar la pauta de nutrición.
        <button type="button" className="btn btn-secondary" onClick={() => void plan.refetch()}>
          Reintentar pauta
        </button>
      </div>
    );
  return (
    <div data-tour="nutrition-plan">
      {canEdit ? (
        <PlanForm
          key={`${linkId}:${plan.data?.id ?? 'none'}`}
          linkId={linkId}
          plan={plan.data ?? null}
          reload={() => void plan.refetch()}
        />
      ) : plan.data ? (
        <NutritionPlanSummary plan={plan.data} />
      ) : (
        <p className="text-sm">
          Sin pauta de nutrición. Tu atleta no te ha dado permiso para pautarla.
        </p>
      )}
      <NutritionPlanHistory key={linkId} linkId={linkId} />
    </div>
  );
}

function PlanForm({
  linkId,
  plan,
  reload,
}: {
  linkId: string;
  plan: NutritionPlan | null;
  reload: () => void;
}) {
  const draft = useSessionDraft(
    `nutrition:${linkId}`,
    { baseId: plan?.id ?? null, fields: nutritionDraft(plan) },
    isClientDraft,
  );
  const recipes = useCoachRecipes();
  const save = useSetNutritionPlan(linkId);
  const end = useEndNutritionPlan(linkId);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = nutritionRequest(draft.value.fields);
  const busy = save.isPending || end.isPending;
  const stale = draft.value.baseId !== (plan?.id ?? null);
  const knownRecipes = recipes.data ?? [];
  const missingRecipe = draft.value.fields.meals.some(
    (meal) => !knownRecipes.some((r) => r.id === meal.recipeId),
  );
  const ready = request !== null && !missingRecipe;

  const submit = async () => {
    if (!request || !ready || stale || busy) return;
    if (
      !(await confirmAction({
        title: 'Publicar pauta nutricional',
        description:
          '¿Publicar esta pauta solo para este atleta? Se aplicará ahora y sustituirá la anterior, que se conservará en el historial.',
        confirmLabel: 'Publicar pauta',
        destructive: false,
      }))
    )
      return;
    setError(null);
    save.mutate(
      {
        plan: {
          ...request,
          meals: request.meals.map((meal) => ({
            ...meal,
            expectedRecipeUpdatedAt: knownRecipes.find((recipe) => recipe.id === meal.recipeId)
              ?.updatedAt,
          })),
        },
        expectedPlanId: draft.value.baseId,
      },
      {
        onSuccess: () => {
          draft.clear();
          toast.success('Pauta de nutrición publicada');
        },
        onError: (cause) =>
          setError(apiErrorMessage(cause, 'No se pudo publicar. Conservamos tus cambios.')),
      },
    );
  };

  const remove = async () => {
    if (
      !plan ||
      busy ||
      !(await confirmAction({
        title: 'Retirar pauta nutricional',
        description:
          '¿Retirar la pauta activa? El atleta volverá a usar sus propios objetivos. Se conserva el historial y se descarta el borrador local.',
        confirmLabel: 'Retirar pauta',
        destructive: true,
      }))
    )
      return;
    setError(null);
    end.mutate(plan.id, {
      onSuccess: () => {
        draft.clear();
        toast.success('Pauta de nutrición retirada');
      },
      onError: (cause) => setError(apiErrorMessage(cause, 'No se pudo retirar la pauta.')),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {plan
          ? `Pauta activa desde ${formatCoachDate(plan.createdAt)}. Sustituye los objetivos de tu atleta.`
          : 'Sin pauta: tu atleta usa sus propios objetivos.'}
      </p>
      <p className="text-sm">
        Los cambios son un borrador hasta publicarlos. Las comidas se copian de tus recetas
        actuales; las versiones anteriores conservan su contenido.
      </p>
      {plan && (
        <details>
          <summary className="cursor-pointer py-2">Ver pauta publicada</summary>
          <NutritionPlanSummary plan={plan} />
        </details>
      )}
      <NutritionTemplatePicker
        dirty={draft.dirty}
        disabled={busy || stale}
        onCopy={(fields) => {
          draft.setValue({ ...draft.value, fields });
          setPreview(false);
          setError(null);
        }}
      />
      {draft.notice && (
        <p role="status" className="text-sm">
          {draft.notice}
        </p>
      )}
      {stale && (
        <p role="alert">
          La pauta publicada ha cambiado desde que empezaste este borrador. Revisa la versión actual
          y descarta los cambios locales para empezar desde ella.
        </p>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => {
              reload();
              void recipes.refetch();
              setPreview(false);
            }}
          >
            Actualizar pauta y recetas
          </button>
        </div>
      )}
      {recipes.isError && (
        <div role="alert">
          No se pudieron cargar tus recetas.{' '}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void recipes.refetch()}
          >
            Reintentar recetas
          </button>
        </div>
      )}
      {missingRecipe && !recipes.isPending && !recipes.isError && (
        <p role="alert">
          Hay comidas sin receta disponible. Elige otra receta o quita esas comidas antes de
          publicar.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!ready}
          aria-pressed={preview}
          onClick={() => setPreview(!preview)}
        >
          {preview ? 'Volver al editor' : 'Vista previa de la pauta'}
        </button>
        {draft.dirty && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={async () => {
              if (
                await confirmAction({
                  title: 'Descartar cambios',
                  description: '¿Descartar los cambios locales y volver a la pauta publicada?',
                  confirmLabel: 'Descartar cambios',
                  destructive: true,
                })
              ) {
                draft.clear();
                setPreview(false);
                setError(null);
              }
            }}
          >
            Descartar cambios locales
          </button>
        )}
      </div>
      {preview && request && ready ? (
        <section aria-label="Vista previa de la pauta">
          <NutritionPlanSummary plan={previewNutrition(request, knownRecipes)} />
        </section>
      ) : (
        <NutritionPlanFields
          value={draft.value.fields}
          onChange={(fields) => draft.setValue({ ...draft.value, fields })}
          recipes={knownRecipes}
          disabled={busy}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !ready || stale || (!draft.dirty && !!plan)}
          onClick={submit}
        >
          Publicar pauta
        </button>
        {plan && (
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={remove}>
            Quitar pauta
          </button>
        )}
      </div>
    </div>
  );
}
