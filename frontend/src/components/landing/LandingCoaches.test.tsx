import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LandingCoaches from './LandingCoaches';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { mockPublicInfo } from '../../test/publicInfoMock';

function withRouter(Wrapper: ReturnType<typeof mockPublicInfo>) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('Landing para entrenadores', () => {
  it('shows the backend prices, the trial and how to ask for a custom plan', async () => {
    render(<LandingCoaches />, { wrapper: withRouter(mockPublicInfo()) });
    const plans = within(await screen.findByRole('list', { name: 'Planes para entrenadores' }));
    expect(plans.getAllByRole('listitem')).toHaveLength(4);
    expect(plans.getByText('Élite')).toBeInTheDocument();
    expect(plans.getByText('Hasta 50 atletas')).toBeInTheDocument();
    expect(screen.getByText('Pagando el año entero, 2 meses gratis.')).toBeInTheDocument();
    expect(screen.getByText(/14 días gratis, sin tarjeta/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '¿Más de 50 atletas o un plan a medida?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hola@ascension.test' })).toHaveAttribute(
      'href',
      'mailto:hola@ascension.test',
    );
    expect(screen.getByRole('link', { name: /Probar 14 días gratis/ })).toHaveAttribute(
      'href',
      '/login?modo=registro',
    );
  });

  it('leaves the prices out and points to the app when the backend does not answer', async () => {
    render(<LandingCoaches />, { wrapper: withRouter(mockPublicInfo(null)) });
    expect(await screen.findByText(/entra con tu cuenta y escríbenos/)).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Planes para entrenadores' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '¿Necesitas un plan a medida?' }),
    ).toBeInTheDocument();
  });
});
