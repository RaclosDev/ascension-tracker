import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Link, MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { useCoachFilters } from '../lib/coach/useCoachFilters';

afterEach(cleanup);

it('keeps edits and links current while a URL transition is suspended, then follows browser history', async () => {
  let released = false;
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  function DelayedNavigation() {
    const [params] = useSearchParams();
    if (params.has('q') && !released) throw waiting;
    return null;
  }
  function Filters() {
    const { params, update, clear } = useCoachFilters();
    const navigate = useNavigate();
    return (
      <>
        <input
          aria-label="Buscar"
          value={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value)}
        />
        <button onClick={() => update('orden', 'name')}>Ordenar</button>
        <Link to={`/ficha?lista=${encodeURIComponent(params.toString())}`}>Ficha</Link>
        <button onClick={clear}>Limpiar</button>
        <button onClick={() => void navigate(-1)}>Atrás</button>
        <button onClick={() => void navigate(1)}>Adelante</button>
      </>
    );
  }
  render(
    <MemoryRouter
      initialEntries={['/alumnos?q=anterior', '/alumnos?servicio=training']}
      initialIndex={1}
    >
      <Suspense fallback="Cargando">
        <Filters />
        <DelayedNavigation />
      </Suspense>
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'garcia' } });
  expect(screen.getByRole('textbox')).toHaveValue('garcia');
  fireEvent.click(screen.getByText('Ordenar'));
  expect(screen.getByRole('link', { name: 'Ficha' })).toHaveAttribute(
    'href',
    '/ficha?lista=servicio%3Dtraining%26q%3Dgarcia%26orden%3Dname',
  );
  await act(async () => {
    released = true;
    release();
    await waiting;
  });
  expect(screen.getByRole('textbox')).toHaveValue('garcia');
  fireEvent.click(screen.getByText('Atrás'));
  expect(screen.getByRole('textbox')).toHaveValue('anterior');
  fireEvent.click(screen.getByText('Adelante'));
  expect(screen.getByRole('textbox')).toHaveValue('garcia');
  fireEvent.click(screen.getByText('Limpiar'));
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByRole('link', { name: 'Ficha' })).toHaveAttribute('href', '/ficha?lista=');
});
