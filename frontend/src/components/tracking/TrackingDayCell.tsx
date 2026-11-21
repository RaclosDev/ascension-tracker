import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayCellProps } from '../../types/tracking';

/** Kilos with one decimal, or two when the scale gave a second one (80.6, 80.65). */
export const formatKg = (w: number) => (Math.round(w * 100) % 10 ? w.toFixed(2) : w.toFixed(1));
const formatCount = (n: number) => Math.round(n).toLocaleString('es-ES');

// Narrow screens drop the visible unit, so screen readers get it in parentheses instead;
// parentheses keep the visible text a contiguous part of the button's name (WCAG 2.5.3).
const MetricUnit = ({ visible, spoken }: { visible: string; spoken: string }) => (
  <>
    <span className="track-unit"> {visible}</span>
    <span className="sr-only"> ({spoken})</span>
  </>
);

/** One day of the week row: the date, the weight large, steps and kcal on one quiet line. */
export const TrackingDayCell: React.FC<DayCellProps> = React.memo(
  ({ dateStr, dayName, dayData, isToday, onOpenModal, showWeight, showSteps, showCalories }) => {
    const isFuture = dateStr > format(new Date(), 'yyyy-MM-dd');
    const date = new Date(dateStr + 'T00:00:00');
    const hasSteps = showSteps && dayData.steps !== null;
    const hasKcal = showCalories && dayData.calories !== null;
    const empty = (!showWeight || dayData.weight === null) && !hasSteps && !hasKcal;

    return (
      <button
        type="button"
        disabled={isFuture}
        className="track-day"
        data-today={isToday || undefined}
        data-empty={(empty && !isFuture) || undefined}
        onClick={() => onOpenModal({ dateStr, dayName, dayData })}
      >
        <span className="track-day-date">
          <span className="track-day-name">{dayName}</span>{' '}
          <span className="track-day-num">{format(date, 'd')}</span>{' '}
          <span className="sr-only">{format(date, 'MMM', { locale: es })}</span>
        </span>{' '}
        {showWeight &&
          (dayData.weight !== null ? (
            <span className="track-weight tabular-nums">
              {formatKg(dayData.weight)}
              <MetricUnit visible="kg" spoken="kilos" />{' '}
            </span>
          ) : (
            !empty && (
              <span className="track-weight track-none" aria-hidden="true">
                —
              </span>
            )
          ))}
        {(hasSteps || hasKcal) && (
          <span className="track-sub tabular-nums">
            {hasSteps && (
              <span className="track-minor">
                {formatCount(dayData.steps as number)}
                <MetricUnit visible="pas" spoken="pasos" />{' '}
              </span>
            )}
            {hasKcal && (
              <span className="track-minor">
                {formatCount(dayData.calories as number)}
                <MetricUnit visible="kcal" spoken="calorías" />
              </span>
            )}
          </span>
        )}
        {empty && !isFuture && (
          <span className="track-add" aria-hidden="true">
            +
          </span>
        )}
        {isToday && <span className="sr-only">, hoy</span>}
        {isFuture && <span className="sr-only">, fecha futura</span>}
      </button>
    );
  },
);

TrackingDayCell.displayName = 'TrackingDayCell';
