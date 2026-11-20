import React, { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { addDaysToDateString, isTodayLocal } from '../../utils/dateHelper';
import { DatePicker } from '@/components/ui/date-picker';

interface NutritionDateBarProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
}

export const NutritionDateBar: React.FC<NutritionDateBarProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEndHandler = () => {
    if (touchStartRef.current === null || touchEndRef.current === null) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      onDateChange(addDaysToDateString(selectedDate, isLeftSwipe ? 1 : -1));
    }
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: 'var(--space-lg)',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      <button
        type="button"
        className="btn btn-secondary btn-sm min-h-11 min-w-11"
        onClick={() => onDateChange(addDaysToDateString(selectedDate, -1))}
        style={{ padding: '0.4rem 1rem' }}
        aria-label="Día anterior"
      >
        &larr;
      </button>

      <DatePicker
        className="nutrition-date-trigger min-h-11"
        value={selectedDate}
        onChange={onDateChange}
        aria-label="Seleccionar fecha del diario nutricional"
        display={(iso) =>
          isTodayLocal(iso) ? 'Hoy' : format(parseISO(iso), 'd MMM yyyy', { locale: es })
        }
      />

      <button
        type="button"
        className="btn btn-secondary btn-sm min-h-11 min-w-11"
        onClick={() => onDateChange(addDaysToDateString(selectedDate, 1))}
        style={{ padding: '0.4rem 1rem' }}
        aria-label="Día siguiente"
      >
        &rarr;
      </button>
    </div>
  );
};
