import { useEffect, useRef } from "react";
import { useNow } from "@/hooks/use-now";
import { formatRest } from "@/lib/workout/format";
import { useWorkoutStore } from "@/lib/workout/store";
import { playRestSound, notifyRestFinished } from "@/lib/workout/notifications";
import { Button } from "@/components/ui/button";

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
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        left: 0,
        right: 0,
        zIndex: 110,
        background: 'var(--bg-primary)',
        borderTop: '2px solid var(--accent-primary)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          top: -2, 
          left: 0, 
          height: '2px', 
          background: 'var(--text-primary)', 
          width: `${Math.min(100, progress * 100)}%`,
          transition: 'width 0.2s linear'
        }} 
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Descanso
          </span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatRest(remaining)}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => adjustRest(-15)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.75rem', fontSize: '1rem', fontWeight: 600, minWidth: '45px' }}
          >
            -15
          </button>
          <button 
            onClick={() => adjustRest(15)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.75rem', fontSize: '1rem', fontWeight: 600, minWidth: '45px' }}
          >
            +15
          </button>
          <button 
            onClick={skipRest}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '1rem', fontWeight: 700 }}
          >
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
}
