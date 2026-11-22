import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HeroDemo, NutritionDemo, WorkoutDemo } from './LandingTryIt';

describe('landing demos', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills an empty set from last time, starts the rest and marks a record', () => {
    vi.useFakeTimers();
    render(<WorkoutDemo />);
    const checks = screen.getAllByRole('button', { name: 'Completar serie' });
    fireEvent.click(checks[0]);
    expect(screen.getAllByLabelText('Kg de la serie 1')[0]).toHaveValue('80');
    expect(screen.getByRole('timer', { name: 'Descanso' })).toHaveTextContent('2:00');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('timer', { name: 'Descanso' })).toHaveTextContent('1:57');
    fireEvent.click(screen.getByRole('button', { name: 'Omitir' }));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();

    const kg = screen.getAllByLabelText('Kg de la serie 2')[0];
    fireEvent.focus(kg);
    fireEvent.click(screen.getByRole('button', { name: '+2.5' }));
    expect(kg).toHaveValue('82.5');
    fireEvent.click(screen.getAllByRole('button', { name: 'Completar serie' })[0]);
    expect(screen.getByText('PR')).toBeInTheDocument();
  });

  it('adds, edits and copies foods in the day', () => {
    render(<NutritionDemo />);
    expect(screen.getByRole('button', { name: /^Desayuno, 2 alimentos/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Añadir alimento a Cena' }));
    fireEvent.click(screen.getByRole('button', { name: /Salmón/ }));
    expect(screen.getByRole('button', { name: 'Cena, 1 alimentos, 312 kcal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copiar comida Comida de ayer' }));
    expect(screen.getByRole('button', { name: /^Comida, 2 alimentos/ })).toBeInTheDocument();
  });

  it('switches the hero card between the workout and the nutrition demo', () => {
    render(<HeroDemo />);
    expect(screen.getByRole('article', { name: 'Demo de entreno' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Nutrición' }));
    expect(screen.getByRole('article', { name: 'Demo de nutrición' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Nutrición' })).toHaveAttribute('aria-selected', 'true');
  });
});
