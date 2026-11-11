import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CoachTourPage from '../pages/CoachTourPage';
import CoachTourWelcome from '../components/coach/tour/CoachTourWelcome';
import { readTourProgress, saveTourProgress } from '../components/coach/tour/progress';
import { COACH_TOUR_STEPS } from '../components/coach/tour/steps';

const auth = vi.hoisted(() => ({ user: { email: 'tour@test.example' } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../lib/coach/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/coach/api')>()),
  useCoachProfile: () => ({ data: { coach: true } }),
}));

function mount(path = '/entrenador/guia?desde=inicio') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/entrenador/guia" element={<CoachTourPage />} />
        <Route
          path="/entrenador"
          element={
            <>
              <h1>Inicio del entrenador</h1>
              <CoachTourWelcome />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}
const jump = (index: number) =>
  fireEvent.change(screen.getByLabelText('Ir a un paso'), { target: { value: String(index) } });

beforeEach(() => {
  localStorage.clear();
  auth.user = { email: `tour-${Math.random()}@test.example` };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Guía del entrenador', () => {
  it('offers the tour, permits dismissal and keeps it account-scoped', () => {
    const first = auth.user.email;
    const view = mount('/entrenador');
    expect(screen.getByRole('dialog')).toHaveTextContent('Conoce tu espacio de entrenador');
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readTourProgress(first)?.status).toBe('dismissed');
    view.unmount();
    mount('/entrenador');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readTourProgress('another@test.example')).toBeNull();
  });

  it('starts from the welcome dialog and traverses every demonstration', () => {
    mount('/entrenador');
    fireEvent.click(screen.getByRole('button', { name: 'Empezar guía interactiva' }));
    for (const [index, step] of COACH_TOUR_STEPS.entries()) {
      expect(screen.getByRole('heading', { name: step.title })).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('value', String(index + 1));
      const scene = screen.getByRole('region', { name: `Demostración: ${step.section}` });
      fireEvent.click(within(scene).getByRole('button', { name: step.action }));
      if (index < COACH_TOUR_STEPS.length - 1)
        fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    expect(screen.getByRole('heading', { name: 'Inicio del entrenador' })).toBeInTheDocument();
    expect(readTourProgress(auth.user.email)?.status).toBe('completed');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('updates the prescription and separates private notes from the student preview', () => {
    mount();
    jump(3);
    fireEvent.change(screen.getByLabelText('Tu respuesta'), {
      target: { value: 'Revisado, Lucía.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Responder al check-in' }));
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('Revisado, Lucía.');
    jump(6);
    for (const [label, value] of [
      ['Carga (kg)', '72.5'],
      ['Repeticiones', '6'],
      ['RPE', '7.5'],
    ]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    expect(screen.getByText(/Vista previa:/)).toHaveTextContent('72.5');
    jump(8);
    fireEvent.change(screen.getByLabelText('Comentario para Lucía'), {
      target: { value: 'Prioriza la técnica.' },
    });
    fireEvent.change(screen.getByLabelText('Nota privada del entrenador'), {
      target: { value: 'SOLO ENTRENADOR' },
    });
    jump(9);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador de ejemplo' }));
    expect(screen.getByRole('region', { name: 'Vista de Lucía' })).toHaveTextContent(
      'todavía no aparece',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publicar semana de ejemplo' }));
    const preview = screen.getByRole('region', { name: 'Vista de Lucía' });
    expect(preview).toHaveTextContent('Prioriza la técnica.');
    expect(preview).toHaveTextContent('72.5');
    expect(preview).not.toHaveTextContent('SOLO ENTRENADOR');
    jump(12);
    fireEvent.change(screen.getByLabelText('Pregunta de tu plantilla de check-in'), {
      target: { value: '¿Qué tal?' },
    });
    expect(screen.getByLabelText('Pregunta de tu plantilla de check-in')).toHaveValue('¿Qué tal?');
  });

  it('resumes the saved step, goes back and resets the sandbox', () => {
    saveTourProgress(auth.user.email, { status: 'started', step: 9 });
    mount('/entrenador/guia');
    expect(screen.getByRole('heading', { name: COACH_TOUR_STEPS[9].title })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByLabelText('Comentario para Lucía')).toHaveValue(
      'Semana de descarga. Prioriza la técnica y registra cómo te encuentras.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar demo' }));
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    jump(6);
    expect(screen.getByLabelText('Carga (kg)')).toHaveValue(80);
  });

  it('demonstrates automatically, pauses on interaction and stops timers on exit', () => {
    vi.useFakeTimers();
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir recorrido' }));
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.getByRole('status')).toHaveTextContent('Lucía tiene un check-in pendiente');
    act(() => vi.advanceTimersByTime(8200));
    expect(screen.getByRole('heading', { name: COACH_TOUR_STEPS[1].title })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Reproducir recorrido' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(20000));
    expect(readTourProgress(auth.user.email)?.step).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses when the tab is hidden and when editing', () => {
    vi.useFakeTimers();
    mount();
    jump(6);
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir recorrido' }));
    fireEvent.change(screen.getByLabelText('Carga (kg)'), { target: { value: '77.5' } });
    expect(screen.getByRole('button', { name: 'Reproducir recorrido' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir recorrido' }));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByLabelText('Carga (kg)')).toHaveValue(77.5);
  });

  it('stops playback at the last step and completes from the guide controls', () => {
    vi.useFakeTimers();
    mount();
    jump(13);
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir recorrido' }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('button', { name: 'Reproducir recorrido' })).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('complementary')).getByRole('button', { name: 'Terminar guía' }),
    );
    expect(readTourProgress(auth.user.email)?.status).toBe('completed');
  });

  it('supports Escape to exit while preserving the current step', () => {
    mount();
    jump(5);
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.getByLabelText('Ir a un paso')).toHaveValue('5');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(readTourProgress(auth.user.email)).toEqual({ status: 'started', step: 5 });
    expect(screen.getByRole('heading', { name: 'Inicio del entrenador' })).toBeInTheDocument();
  });

  it('ignores invalid progress and remains usable when storage is unavailable', () => {
    localStorage.setItem(
      `ascension:coach-tour:v1:${encodeURIComponent(auth.user.email)}`,
      '{broken',
    );
    expect(readTourProgress(auth.user.email)).toBeNull();
    localStorage.setItem(
      `ascension:coach-tour:v1:${encodeURIComponent(auth.user.email)}`,
      JSON.stringify({ status: 'started', step: -2 }),
    );
    expect(readTourProgress(auth.user.email)).toBeNull();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mount('/entrenador');
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));
    expect(readTourProgress(auth.user.email)).toEqual({ status: 'dismissed', step: 0 });
  });
});
