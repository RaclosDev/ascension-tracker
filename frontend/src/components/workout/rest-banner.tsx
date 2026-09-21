import { useEffect, useRef } from "react";
import { useNow } from "@/hooks/use-now";
import { formatRest } from "@/lib/workout/format";
import { useWorkoutStore } from "@/lib/workout/store";
import { playRestSound, notifyRestFinished } from "@/lib/workout/notifications";

export function RestBanner() {
  const restUntil = useWorkoutStore((s) => s.restUntil);
  const skipRest = useWorkoutStore((s) => s.skipRest);
  const adjustRest = useWorkoutStore((s) => s.adjustRest);
  const restPreset = useWorkoutStore((s) => s.restPreset);
  const now = useNow(!!restUntil, 200);

  const notified = useRef(false);

  useEffect(() => {
    if (restUntil) {
      notified.current = false;
    }
  }, [restUntil]);

  useEffect(() => {
    if (restUntil && restUntil <= now) {
      if (!notified.current) {
        playRestSound();
        notifyRestFinished();
        notified.current = true;
      }
      skipRest();
    }
  }, [restUntil, now, skipRest]);

  if (!restUntil || restUntil <= now) return null;

  const remaining = Math.max(0, Math.ceil((restUntil - now) / 1000));
  const total = Math.max(restPreset, remaining);
  const progress = 1 - remaining / total;

  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
        left: '1rem',
        right: '1rem',
        zIndex: 110,
        background: 'rgba(28, 28, 30, 0.7)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Progress bar */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          height: '3px', 
          background: 'var(--accent-primary)', 
          width: `${Math.min(100, progress * 100)}%`,
          transition: 'width 0.2s linear',
          borderRadius: '20px 0 0 0',
        }} 
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Descanso
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatRest(remaining)}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button 
            onClick={() => adjustRest(-15)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 600, minWidth: '40px', borderRadius: '12px' }}
          >
            -15
          </button>
          <button 
            onClick={() => adjustRest(15)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 600, minWidth: '40px', borderRadius: '12px' }}
          >
            +15
          </button>
          <button 
            onClick={skipRest}
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '12px' }}
          >
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
}
