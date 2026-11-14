import { confirmAction } from '../lib/confirmation';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { CoachPageHeader } from '../components/coach/CoachWorkspace';
import { apiErrorMessage } from '../lib/coach/api';
import {
  recipeKcal,
  useCoachRecipes,
  useDeleteRecipe,
  useSaveRecipe,
  type CoachRecipe,
} from '../lib/coach/coachRecipes';

const MACROS = [
  { key: 'protein', label: 'Proteína' },
  { key: 'carbs', label: 'Carbohidratos' },
  { key: 'fat', label: 'Grasa' },
] as const;
type MacroKey = (typeof MACROS)[number]['key'];

const parseGrams = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 1000 ? n : null;
};

/** The coach's recipe library: dishes with macros per serving to build meal plans from. */
export default function CoachRecipesPage() {
  const recipes = useCoachRecipes();
  const remove = useDeleteRecipe();
  // null: no form open; 'new': creating; otherwise the recipe being edited.
  const [editing, setEditing] = useState<CoachRecipe | 'new' | null>(null);

  return (
    <div className="fade-in coach-page coach-workspace">
      <Link to="/entrenador/planificacion" className="coach-back-link">
        <ArrowLeft size={16} aria-hidden /> Volver a biblioteca
      </Link>
      <CoachPageHeader
        title="Recetas"
        description="Platos con sus macros por ración para pautar comidas a tus atletas."
      >
        {editing === null && (
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={16} aria-hidden /> Nueva receta
          </button>
        )}
      </CoachPageHeader>

      {editing !== null && (
        <RecipeForm
          key={editing === 'new' ? 'new' : editing.id}
          recipe={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {recipes.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {recipes.isError && (
        <p role="alert">{apiErrorMessage(recipes.error, 'No se pudieron cargar tus recetas.')}</p>
      )}
      {recipes.data?.length === 0 && editing === null && (
        <section className="card">
          <p style={{ color: 'var(--text-secondary)' }}>
            Aún no tienes recetas. Guarda platos con sus macros por ración para pautar comidas a tus
            atletas.
          </p>
        </section>
      )}

      {recipes.data && recipes.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {recipes.data.map((recipe) => (
            <li key={recipe.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white truncate">{recipe.name}</div>
                <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  {recipe.kcal} kcal · P {recipe.protein} g · C {recipe.carbs} g · G {recipe.fat} g
                  por ración
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Editar ${recipe.name}`}
                  onClick={() => setEditing(recipe)}
                >
                  <Pencil size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Borrar ${recipe.name}`}
                  disabled={remove.isPending}
                  onClick={async () => {
                    if (
                      !(await confirmAction({
                        title: 'Borrar receta',
                        description: `¿Borrar «${recipe.name}»? No se puede deshacer.`,
                        confirmLabel: 'Borrar receta',
                        destructive: true,
                      }))
                    )
                      return;
                    remove.mutate(recipe.id, {
                      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo borrar')),
                    });
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecipeForm({ recipe, onDone }: { recipe: CoachRecipe | null; onDone: () => void }) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [grams, setGrams] = useState<Record<MacroKey, string>>({
    protein: recipe ? String(recipe.protein) : '',
    carbs: recipe ? String(recipe.carbs) : '',
    fat: recipe ? String(recipe.fat) : '',
  });
  const save = useSaveRecipe();
  const protein = parseGrams(grams.protein);
  const carbs = parseGrams(grams.carbs);
  const fat = parseGrams(grams.fat);
  const valid = name.trim() !== '' && protein != null && carbs != null && fat != null;

  const submit = () => {
    if (!valid) return;
    save.mutate(
      {
        id: recipe?.id ?? null,
        request: {
          name: name.trim(),
          description: description.trim() || null,
          protein,
          carbs,
          fat,
        },
      },
      {
        onSuccess: () => {
          toast.success('Receta guardada');
          onDone();
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar la receta')),
      },
    );
  };

  return (
    <section className="card mb-6 flex flex-col gap-3">
      <h2 className="card-title">{recipe ? 'Editar receta' : 'Nueva receta'}</h2>
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Nombre</span>
        <input
          className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
          style={{ borderColor: 'var(--border-subtle)' }}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Ingredientes y preparación</span>
        <textarea
          className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
          style={{ borderColor: 'var(--border-subtle)' }}
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Macros por ración
        </legend>
        {MACROS.map((macro) => (
          <label key={macro.key} className="flex items-center justify-between gap-3 text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{macro.label} (g)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={1000}
              step={0.1}
              className="w-24 rounded-lg px-3 py-2 bg-black/20 border text-right"
              style={{ borderColor: 'var(--border-subtle)' }}
              aria-label={`${macro.label} por ración`}
              value={grams[macro.key]}
              onChange={(e) => setGrams((g) => ({ ...g, [macro.key]: e.target.value }))}
            />
          </label>
        ))}
      </fieldset>
      <p className="text-sm font-bold text-white">
        {protein != null && carbs != null && fat != null
          ? `${recipeKcal({ protein, carbs, fat })} kcal por ración`
          : 'Gramos entre 0 y 1000'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!valid || save.isPending}
          onClick={submit}
        >
          Guardar receta
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
