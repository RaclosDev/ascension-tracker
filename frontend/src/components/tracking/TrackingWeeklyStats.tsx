import React from 'react';
import { Scale, Footprints, Apple } from 'lucide-react';
import { WeekData } from '../../types/tracking';

interface TrackingWeeklyStatsProps {
  week: WeekData;
  showWeight: boolean;
  showSteps: boolean;
  showCalories: boolean;
}

export const TrackingWeeklyStats: React.FC<TrackingWeeklyStatsProps> = ({
  week,
  showWeight,
  showSteps,
  showCalories,
}) => {
  return (
    <div
      className="calendar-week-stats"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, max-content)',
        gap: '0.5rem',
        justifyContent: 'end',
      }}
    >
      {showWeight && (
        <>
          <div
            style={{
              fontSize: '0.85rem',
              background: 'var(--bg-secondary)',
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <span className="hide-on-mobile" style={{ color: 'var(--text-secondary)' }}>
              Peso:
            </span>
            <span
              className="show-on-mobile"
              style={{ display: 'none', color: 'var(--text-secondary)' }}
            >
              <Scale className="w-4 h-4 inline-block mr-1" aria-hidden="true" />
            </span>
            <strong style={{ color: 'var(--accent-primary-light)' }}>
              {week.averageWeight !== null ? (
                <>
                  {week.averageWeight.toFixed(2)}
                  <span className="hide-on-mobile"> kg</span>
                </>
              ) : (
                ''
              )}
            </strong>
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              background: 'var(--bg-secondary)',
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Δ:</span>
            <strong
              className={
                week.deltaWeight === null
                  ? 'delta-neutral'
                  : week.deltaWeight < 0
                    ? 'delta-negative'
                    : week.deltaWeight > 0
                      ? 'delta-positive'
                      : 'delta-neutral'
              }
            >
              {week.deltaWeight !== null ? (
                <>
                  {week.deltaWeight > 0
                    ? `+${week.deltaWeight.toFixed(2)}`
                    : week.deltaWeight.toFixed(2)}
                  <span className="hide-on-mobile"> kg</span>
                </>
              ) : (
                ''
              )}
            </strong>
          </div>
        </>
      )}
      {showSteps && (
        <div
          style={{
            fontSize: '0.85rem',
            background: 'var(--bg-secondary)',
            padding: '0.3rem 0.5rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span className="hide-on-mobile" style={{ color: 'var(--text-secondary)' }}>
            Pasos:
          </span>
          <span
            className="show-on-mobile"
            style={{ display: 'none', color: 'var(--text-secondary)' }}
          >
            <Footprints className="w-4 h-4 inline-block mr-1" aria-hidden="true" />
          </span>
          <strong style={{ color: 'var(--accent-primary-light)' }}>
            {week.averageSteps !== null ? (
              <>
                {Math.round(week.averageSteps)}
                <span className="hide-on-mobile"> pasos</span>
              </>
            ) : (
              ''
            )}
          </strong>
        </div>
      )}
      {showCalories && (
        <div
          style={{
            fontSize: '0.85rem',
            background: 'var(--bg-secondary)',
            padding: '0.3rem 0.5rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span className="hide-on-mobile" style={{ color: 'var(--text-secondary)' }}>
            Kcal:
          </span>
          <span
            className="show-on-mobile"
            style={{ display: 'none', color: 'var(--text-secondary)' }}
          >
            <Apple className="w-4 h-4 inline-block mr-1" aria-hidden="true" />
          </span>
          <strong style={{ color: 'var(--accent-primary-light)' }}>
            {week.averageCalories !== null ? (
              <>
                {Math.round(week.averageCalories)}
                <span className="hide-on-mobile"> kcal</span>
              </>
            ) : (
              ''
            )}
          </strong>
        </div>
      )}
    </div>
  );
};
