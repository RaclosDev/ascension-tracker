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

  return (
    <li
      className="relative flex items-center justify-between p-2.5 rounded-[10px] transition-all"
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-0 cursor-pointer text-left p-0"
      >
        {displayGif ? (
          <img
            src={displayGif}
            alt=""
            loading="lazy"
            className="w-10 h-10 rounded-lg object-cover shrink-0"
            style={{ background: 'var(--bg-primary)' }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-primary)' }}
          >
            <Dumbbell size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
        )}

        <div className="min-w-0 overflow-hidden">
          <h3
            className="flex items-center gap-1.5 text-sm font-semibold truncate m-0"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="truncate">{displayName}</span>
            {exercise.custom && (
              <span className="text-[0.6rem] px-1.5 py-0.5 bg-[var(--accent-primary-light)] text-[var(--bg-primary)] rounded-sm font-bold shrink-0">
                Custom
              </span>
            )}
          </h3>
          <p
            className="mt-0.5 text-[0.7rem] capitalize truncate m-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            {muscleText} · {exercise.equipment}
            {lastUsedTimestamp !== undefined && (
              <span style={{ color: 'var(--accent-primary-light)' }}>
                {' '}
                · {usageCount ?? 0}× ·{' '}
                {new Date(lastUsedTimestamp).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </p>
        </div>
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="bg-transparent border-0 p-1.5 flex items-center cursor-pointer rounded-md"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Más opciones"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
        >
          <MoreVertical size={18} />
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 min-w-[180px] p-1.5 flex flex-col gap-1 rounded-xl shadow-2xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
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
              className="flex items-center gap-3 w-full p-2 bg-transparent border-0 rounded-lg text-xs cursor-pointer text-left"
              style={{ color: 'var(--text-primary)' }}
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
              className="flex items-center gap-3 w-full p-2 bg-transparent border-0 rounded-lg text-xs cursor-pointer text-left"
              style={{ color: 'var(--text-primary)' }}
            >
              <Plus size={16} />
              Añadir Variante
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleMenu();
                onChangeGif(exercise);
              }}
              className="flex items-center gap-3 w-full p-2 bg-transparent border-0 rounded-lg text-xs cursor-pointer text-left"
              style={{ color: 'var(--text-primary)' }}
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
                  className="flex items-center gap-3 w-full p-2 bg-transparent border-0 rounded-lg text-xs cursor-pointer text-left"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <LinkIcon size={16} />
                  Fusionar
                </button>
                <div className="h-[1px] my-1 mx-2" style={{ background: 'var(--border-subtle)' }} />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggleMenu();
                    onDelete(exercise);
                  }}
                  className="flex items-center gap-3 w-full p-2 bg-transparent border-0 rounded-lg text-xs cursor-pointer text-left text-red-500 hover:text-red-600"
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
