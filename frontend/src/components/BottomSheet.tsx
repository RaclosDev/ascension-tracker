import React, { useState, useEffect, useRef, ReactNode } from 'react';

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
    if (!isOpen) {
      setTranslateY(0);
    }
  }, [isOpen]);

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
    // Si se arrastró más de 80px hacia abajo, cerramos
    if (diff > 80) {
      onClose();
    } else {
      // Si no, vuelve a la posición original
      setTranslateY(0);
    }
  };

  return (
    <div 
      className="bottom-sheet-overlay"
      onClick={onClose}
    >
      <div 
        className="bottom-sheet-content"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div className="bottom-sheet-drag-handle" />
        {title && <h3 className="bottom-sheet-title">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
