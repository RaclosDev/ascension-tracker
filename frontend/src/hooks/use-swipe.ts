import { useState, useRef, useCallback } from 'react';

export function useSwipe(threshold = -40, maxSwipe = -72) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;

      // Only start horizontal drag if more horizontal than vertical
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
        // Only allow left swipe (negative dx), clamped
        const clamped = Math.max(maxSwipe - 10, Math.min(0, dx));
        setOffsetX(clamped);
      }
    },
    [maxSwipe],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) {
        // Fallback si no hay touchStart
        setOffsetX((prev) => {
          if (prev < threshold) {
            setSwiped(true);
            return maxSwipe;
          }
          setSwiped(false);
          return 0;
        });
        return;
      }

      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      if (dx < threshold) {
        setOffsetX(maxSwipe);
        setSwiped(true);
      } else {
        setOffsetX(0);
        setSwiped(false);
      }
      touchStart.current = null;
      isDragging.current = false;
    },
    [threshold, maxSwipe],
  );

  const closeSwipe = useCallback(() => {
    setOffsetX(0);
    setSwiped(false);
  }, []);

  return {
    offsetX,
    swiped,
    isDragging,
    closeSwipe,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
