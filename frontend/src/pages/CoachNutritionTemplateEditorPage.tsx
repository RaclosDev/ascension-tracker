import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { NutritionPlanFields } from '../components/coach/NutritionPlanFields';
import { NutritionPlanSummary } from '../components/coach/NutritionPlanSummary';
import { useSessionDraft } from '../hooks/useSessionDraft';
import { apiErrorMessage } from '../lib/coach/api';
import { useCoachRecipes } from '../lib/coach/coachRecipes';
import {
  isNutritionDraft,
  nutritionDraft,
  nutritionRequest,
  previewNutrition,
  type NutritionDraft,
} from '../lib/coach/nutritionDraft';
import {
  useNutritionTemplate,
  useSaveNutritionTemplate,
  type NutritionTemplate,
} from '../lib/coach/nutritionTemplates';

interface TemplateDraft {
  baseVersion: number | null;
  name: string;
  fields: NutritionDraft;
}
const isTemplateDraft = (value: unknown): value is TemplateDraft =>
  typeof value === 'object' &&
  value !== null &&
  'baseVersion' in value &&
  (value.baseVersion === null ||
    (typeof value.baseVersion === 'number' &&
      Number.isInteger(value.baseVersion) &&
      value.baseVersion > 0)) &&
  'name' in value &&
  typeof value.name === 'string' &&
  value.name.length <= 120 &&
  'fields' in value &&
  isNutritionDraft(value.fields);

export default function CoachNutritionTemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const existing = !!templateId && templateId !== 'nueva';
  const template = useNutritionTemplate(existing ? templateId : null);
  return (
    <CoachWorkspace>
      <CoachPageHeader
        title={existing ? 'Editar pauta de biblioteca' : 'Nueva pauta de biblioteca'}
        description="Los cambios se quedan en tu biblioteca. Desde la ficha podrás copiarlos, adaptarlos y publicarlos para un alumno."
      />
      <Link className="btn btn-secondary self-start" to="/entrenador/pautas">
        Volver a la biblioteca
      </Link>
      {existing && template.isPending ? (
        <p role="status">Cargando pauta…</p>
      ) : existing && template.isError ? (
        <div role="alert">
          No se pudo cargar la pauta.{' '}
          <button className="btn btn-secondary" onClick={() => void template.refetch()}>
            Reintentar pauta
          </button>
        </div>
      ) : (
        <TemplateEditor
          key={`${templateId}:${template.data?.version ?? 0}`}
          template={existing ? (template.data ?? null) : null}
          reload={() => void template.refetch()}
        />
      )}
    </CoachWorkspace>
  );
}

function TemplateEditor({
  template,
  reload,
}: {
  template: NutritionTemplate | null;
  reload: () => void;
}) {
  const navigate = useNavigate();
  const draft = useSessionDraft(
    `nutrition-template:${template?.id ?? 'new'}`,
    {
      baseVersion: template?.version ?? null,
      name: template?.name ?? '',
      fields: nutritionDraft(template?.content ?? null),
    },
    isTemplateDraft,
  );
  const recipes = useCoachRecipes();
  const save = useSaveNutritionTemplate();
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = nutritionRequest(draft.value.fields);
  const knownRecipes = recipes.data ?? [];
  const missing = draft.value.fields.meals.some(
    (meal) => !knownRecipes.some((recipe) => recipe.id === meal.recipeId),
  );
  const ready = !!request && !missing && !!draft.value.name.trim();
  const stale = draft.value.baseVersion !== (template?.version ?? null);
  const submit = (copy: boolean) => {
    if (!request || !ready || save.isPending || (!copy && stale)) return;
    setError(null);
    save.mutate(
      {
        id: copy ? null : (template?.id ?? null),
        name: draft.value.name.trim(),
        plan: request,
        expectedVersion: copy ? null : draft.value.baseVersion,
      },
      {
        onSuccess: (saved) => {
          draft.clear();
          toast.success('Pauta guardada en la biblioteca');
          navigate(`/entrenador/pautas/${encodeURIComponent(saved.id)}`, { replace: true });
        },
        onError: (cause) =>
          setError(apiErrorMessage(cause, 'No se pudo guardar la pauta. Conservamos tu borrador.')),
      },
    );
  };
  return (
    <section className="card flex flex-col gap-4 min-w-0">
      {draft.notice && <p role="status">{draft.notice}</p>}
      {stale && (
        <p role="alert">
          La versión guardada ha cambiado. Descarta el borrador para usarla o guarda tus cambios
          como una pauta nueva.
        </p>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          {template && (
            <button className="btn btn-secondary" onClick={reload}>
              Actualizar versión guardada
            </button>
          )}
        </div>
      )}
      <label className="flex flex-col gap-1">
        Nombre de la pauta
        <input
          className="form-input min-h-11"
          maxLength={120}
          value={draft.value.name}
          disabled={save.isPending}
          onChange={(e) => draft.setValue({ ...draft.value, name: e.target.value })}
        />
      </label>
      <p className="text-sm">
        Al guardar se copian las recetas actuales. La vista previa muestra esas comidas; las copias
        ya publicadas conservan su contenido.
      </p>
      {recipes.isError && (
        <div role="alert">
          No se pudieron cargar tus recetas.{' '}
          <button className="btn btn-secondary" onClick={() => void recipes.refetch()}>
            Reintentar recetas
          </button>
        </div>
      )}
      {missing && !recipes.isPending && !recipes.isError && (
        <p role="alert">
          Hay comidas sin receta disponible. Elige otra receta o quita esas comidas antes de
          guardar.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-secondary"
          disabled={!ready || save.isPending}
          aria-pressed={preview}
          onClick={() => setPreview(!preview)}
        >
          {preview ? 'Volver al editor' : 'Vista previa de la pauta'}
        </button>
        {draft.dirty && (
          <button
            className="btn btn-secondary"
            disabled={save.isPending}
            onClick={() => {
              if (window.confirm('¿Descartar los cambios locales de esta pauta?')) {
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
      {preview && ready && request ? (
        <section aria-label="Vista previa de la pauta">
          <NutritionPlanSummary plan={previewNutrition(request, knownRecipes)} />
        </section>
      ) : (
        <NutritionPlanFields
          value={draft.value.fields}
          onChange={(fields) => draft.setValue({ ...draft.value, fields })}
          recipes={knownRecipes}
          disabled={save.isPending}
        />
      )}
      {template && (
        <details>
          <summary className="cursor-pointer py-2">Ver versión guardada</summary>
          <NutritionPlanSummary plan={template.content} />
        </details>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          disabled={!ready || save.isPending || stale || (!draft.dirty && !!template)}
          onClick={() => submit(false)}
        >
          Guardar en biblioteca
        </button>
        {template && (
          <button
            className="btn btn-secondary"
            disabled={!ready || save.isPending}
            onClick={() => submit(true)}
          >
            Guardar como nueva
          </button>
        )}
      </div>
    </section>
  );
}
