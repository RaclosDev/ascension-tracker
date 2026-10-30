import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayCellProps } from '../../types/tracking';

// Below 769px .hide-on-mobile drops the visible unit, so screen readers get it in parentheses
// instead; parentheses keep the visible text a contiguous part of the button's name (WCAG 2.5.3).
const MetricUnit = ({ visible, spoken }: { visible: string; spoken: string }) => (
  <>
    <span className="hide-on-mobile" style={{ fontWeight: 400, opacity: 0.7, marginLeft: '2px' }}>
      {' '}
      {visible}
    </span>
    <span className="sr-only min-[769px]:hidden"> ({spoken})</span>
  </>
);

const EmptyMetric = () => (
  <span aria-hidden="true" style={{ opacity: 0.3 }}>
    -
  </span>
);

export const TrackingDayCell: React.FC<DayCellProps> = React.memo(
  ({ dateStr, dayName, dayData, isToday, onOpenModal, showWeight, showSteps, showCalories }) => {
    const isFuture = dateStr > format(new Date(), 'yyyy-MM-dd');

    const handleClick = () => {
      if (isFuture) return;
      onOpenModal({ dateStr, dayName, dayData });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isFuture) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenModal({ dateStr, dayName, dayData });
      }
    };

    const formattedDate = format(new Date(dateStr + 'T00:00:00'), 'd MMM', { locale: es });

    return (
      <div
        role="button"
        tabIndex={isFuture ? -1 : 0}
        aria-disabled={isFuture}
        onKeyDown={handleKeyDown}
        className={`calendar-day ${isToday ? 'is-today' : ''} ${isFuture ? 'is-future' : ''}`}
        onClick={handleClick}
        style={{
          cursor: isFuture ? 'default' : 'pointer',
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="calendar-day-name">{dayName}</div>{' '}
        <div className="calendar-day-date">{formattedDate}</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginTop: 'auto',
            paddingTop: '0.5rem',
            flex: 1,
            justifyContent: 'flex-end',
            width: '100%',
          }}
        >
          {showWeight && (
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.2rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
                minHeight: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {dayData.weight !== null ? (
                <>
                  {dayData.weight.toFixed(2)}
                  <MetricUnit visible="kg" spoken="kilos" />
                </>
              ) : (
                <EmptyMetric />
              )}
            </div>
          )}
          {showSteps && (
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.2rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
                minHeight: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {dayData.steps !== null ? (
                <>
                  {Math.round(dayData.steps)}
                  <MetricUnit visible="pas" spoken="pasos" />
                </>
              ) : (
                <EmptyMetric />
              )}
            </div>
          )}
          {showCalories && (
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.2rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
                minHeight: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {dayData.calories !== null ? (
                <>
                  {Math.round(dayData.calories)}
                  <MetricUnit visible="kcal" spoken="calorías" />
                </>
              ) : (
                <EmptyMetric />
              )}
            </div>
          )}
        </div>
        {isToday && <span className="sr-only">, hoy</span>}
        {isFuture && <span className="sr-only">, fecha futura</span>}
      </div>
    );
  },
);

TrackingDayCell.displayName = 'TrackingDayCell';
