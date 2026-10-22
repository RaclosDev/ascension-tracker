import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayCellProps } from '../../types/tracking';

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
    const metricsAria = [
      showWeight && dayData.weight !== null ? `peso ${dayData.weight.toFixed(2)} kilos` : '',
      showSteps && dayData.steps !== null ? `${Math.round(dayData.steps)} pasos` : '',
      showCalories && dayData.calories !== null ? `${Math.round(dayData.calories)} calorías` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const accessibleLabel = `${dayName} ${formattedDate}${isToday ? ', hoy' : ''}${isFuture ? ', fecha futura' : ''}${metricsAria ? `, ${metricsAria}` : ''}`;

    return (
      <div
        role="button"
        tabIndex={isFuture ? -1 : 0}
        aria-disabled={isFuture}
        aria-label={accessibleLabel}
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
        <div className="calendar-day-name">{dayName}</div>
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
                  <span
                    className="hide-on-mobile"
                    style={{ fontWeight: 400, opacity: 0.5, marginLeft: '2px' }}
                  >
                    kg
                  </span>
                </>
              ) : (
                <span style={{ opacity: 0.3 }}>-</span>
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
                  <span
                    className="hide-on-mobile"
                    style={{ fontWeight: 400, opacity: 0.7, marginLeft: '2px' }}
                  >
                    pas
                  </span>
                </>
              ) : (
                <span style={{ opacity: 0.3 }}>-</span>
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
                  <span
                    className="hide-on-mobile"
                    style={{ fontWeight: 400, opacity: 0.7, marginLeft: '2px' }}
                  >
                    kcal
                  </span>
                </>
              ) : (
                <span style={{ opacity: 0.3 }}>-</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

TrackingDayCell.displayName = 'TrackingDayCell';
