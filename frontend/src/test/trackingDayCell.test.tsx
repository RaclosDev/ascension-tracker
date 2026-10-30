import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import { TrackingDayCell } from '../components/tracking/TrackingDayCell';

const baseProps = {
  dayName: 'Lun',
  onOpenModal: vi.fn(),
  showWeight: true,
  showSteps: true,
  showCalories: true,
};

describe('TrackingDayCell accessible name', () => {
  it('takes its name from the visible text, day and date first (WCAG 2.5.3)', () => {
    render(
      <TrackingDayCell
        {...baseProps}
        dateStr="2026-10-12"
        isToday={false}
        dayData={{ weight: 81.2, steps: 8500, calories: 2000 }}
      />,
    );

    // jsdom drops the space between a value and its unit span; Chrome keeps it.
    const cell = screen.getByRole('button', {
      name: /^Lun 12 oct 81\.20\s*kg.*8500\s*pas\s*\(pasos\)\s*2000\s*kcal\s*\(calorías\)$/,
    });
    expect(cell.getAttribute('aria-label')).toBeNull();
  });

  it('leaves missing metrics out of the name and says when the day is today', () => {
    render(
      <TrackingDayCell
        {...baseProps}
        dateStr={format(new Date(), 'yyyy-MM-dd')}
        isToday
        dayData={{ weight: null, steps: null, calories: null }}
      />,
    );

    expect(screen.getByRole('button', { name: /^Lun \d{1,2} \S+\s*, hoy$/ })).toBeDefined();
  });
});
