import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BenchDemo, MealsDemo } from './LandingTryIt';

describe('landing demos', () => {
  it('stamps a new record only when the set beats the estimated best', () => {
    render(<BenchDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar serie' }));
    expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Más kg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar serie' }));
    expect(screen.getByText('¡Nuevo récord!')).toBeInTheDocument();
    expect(screen.getByText(/82,5 kg × 8/, { selector: 'strong' })).toBeInTheDocument();
  });

  it('adds meals to the day and takes them out again', () => {
    render(<MealsDemo />);
    fireEvent.click(screen.getByRole('button', { name: /Pollo con arroz/ }));
    fireEvent.click(screen.getByRole('button', { name: /Avena con plátano/ }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1030');

    fireEvent.click(screen.getByRole('button', { name: 'Quitar Pollo con arroz' }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '420');
  });
});
