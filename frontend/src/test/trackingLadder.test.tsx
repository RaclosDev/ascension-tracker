import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrackingLadder } from '../components/tracking/TrackingLadder';
import { getMondayStr } from '../utils/trackingHelpers';
import type { WeekData } from '../types/tracking';

const day = (weight: number | null) => ({ weight, steps: weight && 8432, calories: null });
const week = (weekStart: string, averageWeight: number): WeekData => ({
  weekStart,
  averageWeight,
  deltaWeight: -0.4,
  averageSteps: 8432,
  deltaSteps: 120,
  averageCalories: null,
  deltaCalories: null,
  days: [day(81.25), day(null), day(80.6), day(null), day(null), day(null), day(null)],
});
const weeks = [week('2026-01-05', 82), week(getMondayStr(), 80.6)];

describe('TrackingLadder', () => {
  it('keeps the current week open and past weeks collapsed until tapped', () => {
    render(<TrackingLadder weeks={weeks} metrics={['weight']} onOpenDay={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /lunes 5 de enero/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: /sin dato|kg/ }).length).toBe(7);

    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('button', { name: /lunes 5 de enero: 81.25 kg/ })).toBeTruthy();
  });

  it('shows every picked metric for a day and opens that day', () => {
    const onOpenDay = vi.fn();
    render(<TrackingLadder weeks={weeks} metrics={['weight', 'steps']} onOpenDay={onOpenDay} />);

    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const monday = screen.getByRole('button', { name: /lunes 5 de enero: 81.25 kg, 8.?432 pasos/ });
    expect(monday.textContent).toContain('8.432');

    fireEvent.click(monday);
    expect(onOpenDay).toHaveBeenCalledWith(
      expect.objectContaining({ dateStr: '2026-01-05', dayName: 'Lun' }),
    );
  });
});
