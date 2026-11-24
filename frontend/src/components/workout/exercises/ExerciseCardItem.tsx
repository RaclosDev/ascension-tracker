import React, { useEffect, useRef } from 'react';
import {
  Dumbbell,
  MoreVertical,
  Pencil,
  Plus,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';
import { MUSCLE_LABEL, type Exercise } from '@/lib/workout/types';
import { EQUIPMENT_OPTIONS } from '@/lib/workout/equipmentOptions';

export interface ExerciseCardItemProps {
  exercise: Exercise;
  alias?: string;
  customGif?: string;
  lastUsedTimestamp?: number;
  usageCount?: number;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onSelect: (exercise: Exercise) => void;
  onEdit: (exercise: Exercise) => void;
  onRename: (exercise: Exercise) => void;
  onAddVariant: (exercise: Exercise) => void;
  onChangeGif: (exercise: Exercise) => void;
  onMerge: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export const ExerciseCardItem = React.memo(function ExerciseCardItem({
  exercise,
  alias,
  customGif,
  lastUsedTimestamp,
  usageCount,
  isMenuOpen,
  onToggleMenu,
  onSelect,
  onEdit,
  onRename,
  onAddVariant,
  onChangeGif,
  onMerge,
  onDelete,
}: ExerciseCardItemProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggleMenu();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, onToggleMenu]);

  const displayGif = customGif !== 'none' && (customGif || exercise.gifUrl);
  const displayName = alias || exercise.name;
  const muscleText = MUSCLE_LABEL[exercise.muscle as keyof typeof MUSCLE_LABEL] || exercise.muscle;

  const lastUsed =
    lastUsedTimestamp === undefined
      ? null
      : new Date(lastUsedTimestamp).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          ...(new Date(lastUsedTimestamp).getFullYear() === new Date().getFullYear()
            ? {}
            : { year: 'numeric' }),
        });
  const uses = usageCount ?? 0;
  const equipmentText =
    EQUIPMENT_OPTIONS.find((o) => o.id === exercise.equipment)?.label ?? exercise.equipment;

  return (
    <li className="ex-row">
      <button type="button" onClick={() => onSelect(exercise)} className="ex-row-main">
        <span className="ex-thumb" aria-hidden="true">
          {displayGif ? <img src={displayGif} alt="" loading="lazy" /> : <Dumbbell size={18} />}
        </span>
        <span className="ex-text">
          <span className="ex-name">
            {displayName}
            {exercise.custom && <span className="ex-own">Propio</span>}
          </span>
          <span className="ex-meta">
            {muscleText} · {equipmentText}
            {lastUsed && (
              <span className="ex-used tabular-nums">
                {' '}
                · {uses} {uses === 1 ? 'vez' : 'veces'} · {lastUsed}
              </span>
            )}
          </span>
        </span>
      </button>

      <div className="ex-menu-wrap" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="icon-btn ex-menu-btn"
          aria-label={`Opciones de ${displayName}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
        >
          <MoreVertical size={18} aria-hidden="true" />
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            className="ex-menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleMenu();
                if (exercise.custom) {
                  onEdit(exercise);
                } else {
                  onRename(exercise);
                }
              }}
              className="ex-menu-item"
            >
              <Pencil size={15} />
              {exercise.custom ? 'Editar' : 'Renombrar'}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleMenu();
                onAddVariant(exercise);
              }}
              className="ex-menu-item"
            >
              <Plus size={16} />
              Añadir variante
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleMenu();
                onChangeGif(exercise);
              }}
              className="ex-menu-item"
            >
              <ImageIcon size={16} />
              Cambiar GIF
            </button>

            {exercise.custom && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleMenu();
                    onMerge(exercise);
                  }}
                  className="ex-menu-item"
                >
                  <LinkIcon size={16} />
                  Fusionar
                </button>
                <div className="ex-menu-sep" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleMenu();
                    onDelete(exercise);
                  }}
                  className="ex-menu-item ex-menu-danger"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
});
