import React, { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { addDaysToDateString, isTodayLocal } from '../../utils/dateHelper';

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
        gap: '1rem',
        marginBottom: 'var(--space-lg)',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onDateChange(addDaysToDateString(selectedDate, -1))}
        style={{ padding: '0.4rem 1rem', borderRadius: '24px' }}
        aria-label="Día anterior"
      >
        &larr;
      </button>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          aria-label="Seleccionar fecha del diario nutricional"
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            fontWeight: 600,
            fontSize: '1.1rem',
            minWidth: '140px',
            textAlign: 'center',
          }}
        >
          {isTodayLocal(selectedDate)
            ? 'Hoy'
            : format(parseISO(selectedDate), 'd MMM yyyy', { locale: es })}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onDateChange(addDaysToDateString(selectedDate, 1))}
        style={{ padding: '0.4rem 1rem', borderRadius: '24px' }}
        aria-label="Día siguiente"
      >
        &rarr;
      </button>
    </div>
  );
};
