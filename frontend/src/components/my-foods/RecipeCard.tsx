import React from 'react';
import { Edit3 } from 'lucide-react';
import { Recipe } from '../../types/api';
import { DragFoodData } from './FoodCard';
import { MacroLine } from '../nutrition/MacroLine';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDragStart?: (e: React.DragEvent, data: DragFoodData) => void;
}

/** Ingredients are stored either as free text or as a JSON list of { quantity, product }. */
function ingredientsText(description?: string | null) {
  if (!description) return null;
  try {
    if (description.startsWith('[')) {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((ing) => `${ing.quantity} g ${ing.product}`).join(', ');
      }
    }
  } catch {
    /* free text */
  }
  return description;
}

export default function RecipeCard({ recipe, onEdit, onDragStart }: RecipeCardProps) {
  const handleDrag = (e: React.DragEvent) => {
    onDragStart?.(e, {
      name: recipe.name,
      brand: '',
      kcal: recipe.totalKcal,
      protein: recipe.totalProtein,
      carbs: recipe.totalCarbs,
      fat: recipe.totalFat,
    });
  };
  const ingredients = ingredientsText(recipe.description);

  return (
    <li className="mf-item">
      <div
        className="mf-item-main"
        draggable={!!onDragStart}
        onDragStart={onDragStart ? handleDrag : undefined}
      >
        <span className="mf-item-text">
          <span className="mf-item-name">{recipe.name}</span>
          {ingredients && <span className="mf-item-meta">{ingredients}</span>}
          <MacroLine
            kcal={recipe.totalKcal}
            protein={recipe.totalProtein}
            carbs={recipe.totalCarbs}
            fat={recipe.totalFat}
          />
        </span>
      </div>
      <span className="mf-item-actions">
        <button
          type="button"
          className="icon-btn mf-icon-btn"
          title="Editar"
          aria-label={`Editar ${recipe.name}`}
          onClick={() => onEdit(recipe)}
        >
          <Edit3 size={16} aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}
