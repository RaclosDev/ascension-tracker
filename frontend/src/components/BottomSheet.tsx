import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { haptics } from '@/lib/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      haptics.medium();
    } else {
      setTranslateY(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptics.light();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = startYRef.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    currentYRef.current = currentY;
    const diff = currentY - startYRef.current;
    // Solo permitimos arrastrar hacia abajo
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const diff = currentYRef.current - startYRef.current;
    if (diff > 80) {
      haptics.light();
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  return (
    <div className="bottom-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="bottom-sheet-content"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel de opciones'}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="bottom-sheet-drag-handle" />
        {title && <h3 className="bottom-sheet-title">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
