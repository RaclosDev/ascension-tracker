import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LandingCoaches from './LandingCoaches';
import { mockPublicInfo } from '../../test/publicInfoMock';

afterEach(() => vi.unstubAllGlobals());

describe('Landing para entrenadores', () => {
  it('shows the backend prices, the trial and how to ask for a custom plan', async () => {
    render(<LandingCoaches />, { wrapper: mockPublicInfo() });
    const plans = within(await screen.findByRole('list', { name: 'Planes para entrenadores' }));
    expect(plans.getAllByRole('listitem')).toHaveLength(4);
    expect(plans.getByText('Élite')).toBeInTheDocument();
    expect(plans.getByText('Hasta 50 alumnos')).toBeInTheDocument();
    expect(screen.getByText('Pagando el año entero, 2 meses gratis.')).toBeInTheDocument();
    expect(screen.getByText(/14 días gratis, sin tarjeta/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '¿Más de 50 alumnos o un plan a medida?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hola@ascension.test' })).toHaveAttribute(
      'href',
      'mailto:hola@ascension.test',
    );
    expect(screen.getByRole('link', { name: /Probar 14 días gratis/ })).toHaveAttribute(
      'href',
      '#entrar',
    );
  });

  it('leaves the prices out and points to the app when the backend does not answer', async () => {
    render(<LandingCoaches />, { wrapper: mockPublicInfo(null) });
    expect(
      await screen.findByText(/entra con tu cuenta de Google y escríbenos/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Planes para entrenadores' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '¿Necesitas un plan a medida?' }),
    ).toBeInTheDocument();
  });
});
