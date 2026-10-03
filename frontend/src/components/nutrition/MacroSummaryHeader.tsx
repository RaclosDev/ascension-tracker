import React from 'react';

interface MacroSummaryHeaderProps {
  consumed: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function MacroSummaryHeader({ consumed, macros }: MacroSummaryHeaderProps) {
  return (
    <div className="card nutrition-summary-card">
      <div className="nutrition-summary-main">
        <div className="nutrition-summary-header">
          <span className="nutrition-summary-title">CalorÃ­as</span>
          <span className="nutrition-summary-value">
            {Math.round(consumed.kcal)}{' '}
            <span className="nutrition-summary-unit">/ {macros.kcal} kcal</span>
          </span>
        </div>
        <div className="macro-progress-bg main-progress">
          <div
            className="macro-progress-fill"
            style={{
              width: `${Math.min(100, (consumed.kcal / macros.kcal) * 100)}%`,
              background: 'var(--accent-primary)',
            }}
          />
        </div>
      </div>

      <div className="nutrition-summary-macros">
        {/* Prot */}
        <div className="macro-item">
          <div className="macro-item-header">
            <span className="macro-item-title">ProteÃ­nas</span>
            <span className="macro-item-value">
              {consumed.protein.toFixed(0)}/{macros.protein.toFixed(0)}g
            </span>
          </div>
          <div className="macro-progress-bg">
            <div
              className="macro-progress-fill"
              style={{
                width: `${Math.min(100, (consumed.protein / macros.protein) * 100)}%`,
                background: 'var(--color-protein)',
              }}
            />
          </div>
        </div>
        {/* Carbs */}
        <div className="macro-item">
          <div className="macro-item-header">
            <span className="macro-item-title">Hidratos</span>
            <span className="macro-item-value">
              {consumed.carbs.toFixed(0)}/{macros.carbs.toFixed(0)}g
            </span>
          </div>
          <div className="macro-progress-bg">
            <div
              className="macro-progress-fill"
              style={{
                width: `${Math.min(100, (consumed.carbs / macros.carbs) * 100)}%`,
                background: 'var(--color-carbs)',
              }}
            />
          </div>
        </div>
        {/* Fat */}
        <div className="macro-item">
          <div className="macro-item-header">
            <span className="macro-item-title">Grasas</span>
            <span className="macro-item-value">
              {consumed.fat.toFixed(0)}/{macros.fat.toFixed(0)}g
            </span>
          </div>
          <div className="macro-progress-bg">
            <div
              className="macro-progress-fill"
              style={{
                width: `${Math.min(100, (consumed.fat / macros.fat) * 100)}%`,
                background: 'var(--color-fat)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}




