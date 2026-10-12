import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutStore } from '@/lib/workout/store';
import { useNow } from '@/hooks/use-now';
import { formatDuration } from '@/lib/workout/format';
import { Dumbbell, ChevronUp, Timer } from 'lucide-react';

export function ActiveWorkoutBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeWorkout = useWorkoutStore((s) => s.active);
  const restUntil = useWorkoutStore((s) => s.restUntil);
  const now = useNow(activeWorkout !== null, 500);

  // Solo mostrar cuando hay un entreno activo y NO estamos en la pantalla de entreno
  if (!activeWorkout || location.pathname.startsWith('/workout')) {
    return null;
  }

  const elapsed = now - activeWorkout.startedAt;
  const isResting = restUntil !== null && restUntil > now;
  const restRemainingSec = isResting ? Math.max(0, Math.ceil((restUntil - now) / 1000)) : 0;

  return (
    <aside
      className="active-workout-banner"
      role="region"
      aria-label="Entrenamiento activo en segundo plano"
      onClick={() => navigate('/workout')}
    >
      <div className="active-workout-banner-inner">
        <div className="active-workout-banner-left">
          <div className="active-workout-pulse-icon" aria-hidden="true">
            <span className="active-workout-dot" />
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="active-workout-info">
            <span className="active-workout-title">
              {activeWorkout.name?.trim() || 'Entrenamiento'}
            </span>
            <span className="active-workout-time">{formatDuration(elapsed)}</span>
          </div>
        </div>

        <div className="active-workout-banner-right">
          {isResting && (
            <div
              className="active-workout-rest-badge"
              role="status"
              aria-label={`Descanso restante: ${formatDuration(restRemainingSec)}`}
            >
              <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>{formatDuration(restRemainingSec)}</span>
            </div>
          )}

          <button
            type="button"
            className="active-workout-resume-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/workout');
            }}
            aria-label="Reanudar entrenamiento"
          >
            <span>Reanudar</span>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
