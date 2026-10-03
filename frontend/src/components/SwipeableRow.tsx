import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3 } from 'lucide-react';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
}

export function SwipeableRow({ children, onDelete, onEdit }: SwipeableRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      isDragging.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;

      if (!isDragging.current) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
          isDragging.current = true;
        } else if (Math.abs(dy) > 10) {
          touchStart.current = null;
          return;
        } else {
          return;
        }
      }

      if (isDragging.current) {
        // PREVENT browser's native horizontal scroll or swipe-to-go-back gesture
        if (e.cancelable) {
          e.preventDefault();
        }
        const clamped = Math.max(-80, Math.min(80, dx));
        setOffsetX(clamped);
      }
    };

    const handleTouchEnd = () => {
      if (!touchStart.current) return;

      setOffsetX((currentOffset) => {
        if (currentOffset < -40) {
          onDelete();
        } else if (currentOffset > 40) {
          onEdit();
        }
        return 0;
      });

      touchStart.current = null;
      isDragging.current = false;
    };

    // passive: false is CRITICAL here so we can call e.preventDefault()
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onDelete, onEdit]);

  const closeSwipe = () => {
    setOffsetX(0);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        background: 'var(--bg-primary)',
        touchAction: 'pan-y',
      }}
    >
      {/* Edit button behind (left side) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: '20px',
          background: 'var(--accent-primary)',
          borderRadius: '12px 0 0 12px',
          opacity: offsetX > 10 ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <Edit3 size={18} color="var(--bg-primary)" />
      </div>

      {/* Delete button behind (right side) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '20px',
          background: '#ef4444',
          borderRadius: '0 12px 12px 0',
          opacity: offsetX < -10 ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <Trash2 size={18} color="white" />
      </div>

      {/* Swipeable content */}
      <div
        ref={contentRef}
        onClick={offsetX !== 0 ? closeSwipe : undefined}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? 'transform 0.2s ease' : 'none',
          background: 'var(--bg-primary)',
          position: 'relative',
          zIndex: 1,
          height: '100%',
          touchAction: 'pan-y',
        }}
      >
        {children}

        {/* Desktop overlay buttons, shown only when hovered (simulated PC experience) */}
        <div
          className="desktop-swipe-actions"
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: isHovered && offsetX === 0 ? 'flex' : 'none',
            gap: '0.2rem',
            background: 'var(--bg-primary)',
            padding: '0.2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        >
          <button
            type="button"
            className="icon-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Editar"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            className="icon-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}




