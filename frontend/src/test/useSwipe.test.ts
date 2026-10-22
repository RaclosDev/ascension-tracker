import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSwipe } from '@/hooks/use-swipe';

describe('useSwipe hook - Touch & Mouse Drag on PC', () => {
  it('initializes with offset 0 and swiped false', () => {
    const { result } = renderHook(() => useSwipe(-40, -72));
    expect(result.current.offsetX).toBe(0);
    expect(result.current.swiped).toBe(false);
  });

  it('drags left on mouse drag and sets swiped when passing threshold', () => {
    const { result } = renderHook(() => useSwipe(-40, -72));

    // Simulate mouse down on the row
    act(() => {
      result.current.touchHandlers.onMouseDown({
        button: 0,
        clientX: 200,
        clientY: 100,
        target: document.createElement('div'),
      } as unknown as React.MouseEvent);
    });

    // Simulate mouse move dragging left by 50px (200 -> 150)
    act(() => {
      result.current.touchHandlers.onMouseMove({
        clientX: 150,
        clientY: 100,
      } as unknown as React.MouseEvent);
    });

    expect(result.current.offsetX).toBe(-50);

    // Simulate mouse up -> past threshold (-40) -> snaps to maxSwipe (-72) and swiped is true
    act(() => {
      result.current.touchHandlers.onMouseUp({
        clientX: 150,
      } as unknown as React.MouseEvent);
    });

    expect(result.current.swiped).toBe(true);
    expect(result.current.offsetX).toBe(-72);
  });

  it('ignores mouse down on inputs or buttons', () => {
    const { result } = renderHook(() => useSwipe(-40, -72));

    const input = document.createElement('input');

    act(() => {
      result.current.touchHandlers.onMouseDown({
        button: 0,
        clientX: 200,
        clientY: 100,
        target: input,
      } as unknown as React.MouseEvent);
    });

    act(() => {
      result.current.touchHandlers.onMouseMove({
        clientX: 150,
        clientY: 100,
      } as unknown as React.MouseEvent);
    });

    // Must not drag when interacting with an input
    expect(result.current.offsetX).toBe(0);
    expect(result.current.swiped).toBe(false);
  });

  it('allows manually closing and opening swipe', () => {
    const { result } = renderHook(() => useSwipe(-40, -72));

    act(() => {
      result.current.openSwipe();
    });
    expect(result.current.swiped).toBe(true);
    expect(result.current.offsetX).toBe(-72);

    act(() => {
      result.current.closeSwipe();
    });
    expect(result.current.swiped).toBe(false);
    expect(result.current.offsetX).toBe(0);
  });
});
