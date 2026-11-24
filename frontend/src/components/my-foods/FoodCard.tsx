import React from 'react';
import { CheckCircle2, Circle, Edit3, Trash2 } from 'lucide-react';
import { SavedFood } from '../../types/api';
import { MacroLine } from '../nutrition/MacroLine';

export interface DragFoodData {
  name: string;
  brand: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodCardProps {
  food: SavedFood;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (food: SavedFood) => void;
  onDelete?: (id: number | string) => void;
  onDragStart: (e: React.DragEvent, data: DragFoodData) => void;
}

/** One saved food: tap to select it (to add several to a meal at once), or edit / delete it. */
export default function FoodCard({
  food,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onDragStart,
}: FoodCardProps) {
  const handleDrag = (e: React.DragEvent) => {
    onDragStart(e, {
      name: food.name,
      brand: food.brand || '',
      kcal: food.kcalPer100g,
      protein: food.proteinPer100g,
      carbs: food.carbsPer100g,
      fat: food.fatPer100g,
    });
  };
  const serving =
    food.servingSize && food.servingSize > 0
      ? `${food.servingSize} g por ${food.servingLabel || 'unidad'}`
      : null;
  const meta = [food.brand, serving].filter(Boolean).join(' · ');

  return (
    <li className="mf-item" data-selected={isSelected || undefined}>
      <button
        type="button"
        className="mf-item-main"
        draggable
        aria-pressed={isSelected}
        onClick={() => {
          if (food.id) onToggleSelect(food.id);
        }}
        onDragStart={handleDrag}
      >
        <span className="mf-check" aria-hidden="true">
          {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </span>
        <span className="mf-item-text">
          <span className="mf-item-name">{food.name}</span>
          {meta && <span className="mf-item-meta">{meta}</span>}
          <MacroLine
            kcal={food.kcalPer100g}
            protein={food.proteinPer100g}
            carbs={food.carbsPer100g}
            fat={food.fatPer100g}
          />
        </span>
      </button>
      <span className="mf-item-actions">
        <button
          type="button"
          className="icon-btn mf-icon-btn"
          title="Editar"
          aria-label={`Editar ${food.name}`}
          onClick={() => onEdit(food)}
        >
          <Edit3 size={16} aria-hidden="true" />
        </button>
        {onDelete && food.id && (
          <button
            type="button"
            className="icon-btn mf-icon-btn mf-icon-danger"
            title="Eliminar"
            aria-label={`Eliminar ${food.name}`}
            onClick={() => onDelete(food.id!)}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </span>
    </li>
  );
}
