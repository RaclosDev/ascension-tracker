import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LandingCoaches from './LandingCoaches';

describe('Landing para entrenadores', () => {
  it('shows the plans, the trial and how to ask for a custom plan', () => {
    render(<LandingCoaches />);
    const plans = within(screen.getByRole('list', { name: 'Planes para entrenadores' }));
    expect(plans.getAllByRole('listitem')).toHaveLength(4);
    expect(plans.getByText('Hasta 50 alumnos')).toBeInTheDocument();
    expect(screen.getByText(/14 días gratis, sin tarjeta/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '¿Más de 50 alumnos o un plan a medida?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Probar 14 días gratis/ })).toHaveAttribute(
      'href',
      '#entrar',
    );
  });
});
