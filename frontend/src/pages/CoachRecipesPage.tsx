import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { CoachPageHeader } from '../components/coach/CoachWorkspace';
import { apiErrorMessage } from '../lib/coach/api';
import {
  recipeKcal,
  useCoachRecipes,
  useSaveRecipe,
  type CoachRecipe,
} from '../lib/coach/coachRecipes';
import '../styles/coach-library.css';

const LIBRARY = '/entrenador/planificacion?pestana=recetas';
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

/** Editor of one recipe of the coach's library; the list lives in the library itself. */
export default function CoachRecipesPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const recipes = useCoachRecipes();
  const id = params.get('editar');
  const recipe = id ? recipes.data?.find((r) => r.id === id) : undefined;

  if (!id && !params.has('nueva')) return <Navigate to={LIBRARY} replace />;
  if (id && recipes.isSuccess && !recipe) return <Navigate to={LIBRARY} replace />;

  return (
    <div className="fade-in coach-page coach-workspace">
      <Link to={LIBRARY} className="coach-back-link">
        <ArrowLeft size={16} aria-hidden /> Volver a biblioteca
      </Link>
      <CoachPageHeader
        title={id ? 'Editar receta' : 'Nueva receta'}
        description="Un plato con sus macros por ración, para pautar comidas a tus atletas."
      />
      {id && recipes.isLoading && <p role="status">Cargando…</p>}
      {id && recipes.isError && (
        <p role="alert">{apiErrorMessage(recipes.error, 'No se pudo cargar la receta.')}</p>
      )}
      {(!id || recipe) && (
        <RecipeForm key={id ?? 'new'} recipe={recipe ?? null} onDone={() => navigate(LIBRARY)} />
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

  return (
    <form
      className="card coach-recipe-form"
      onSubmit={(event) => {
        event.preventDefault();
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
      }}
    >
      <label>
        Nombre
        <input
          className="form-input"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Ingredientes y preparación
        <textarea
          className="form-input"
          rows={5}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <fieldset>
        <legend>Macros por ración (g)</legend>
        {MACROS.map((macro) => (
          <label key={macro.key}>
            {macro.label}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={1000}
              step={0.1}
              className="form-input"
              aria-label={`${macro.label} por ración`}
              value={grams[macro.key]}
              onChange={(e) => setGrams((g) => ({ ...g, [macro.key]: e.target.value }))}
            />
          </label>
        ))}
      </fieldset>
      <p className="coach-recipe-kcal">
        {protein != null && carbs != null && fat != null
          ? `${recipeKcal({ protein, carbs, fat })} kcal por ración`
          : 'Gramos entre 0 y 1000'}
      </p>
      <div className="coach-recipe-actions">
        <button type="submit" className="btn btn-primary" disabled={!valid || save.isPending}>
          Guardar receta
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
