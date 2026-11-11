import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../api/client';
import CoachTourPage from '../pages/CoachTourPage';
import { readTourProgress, saveTourProgress } from '../components/coach/tour/progress';
import { COACH_TOUR_STEPS } from '../components/coach/tour/steps';
import { installCoachTourPreview, tourResponse } from '../components/coach/tour/CoachTourPreview';
import { tourPopupPosition } from '../components/coach/tour/CoachTourOverlay';
import { tourRouteAllowed } from '../components/coach/tour/frame';
import { useSessionDraft } from '../hooks/useSessionDraft';

const auth = vi.hoisted(() => ({ user: { email: 'tour@test.example' } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../lib/coach/api', async (original) => ({
  ...(await original<typeof import('../lib/coach/api')>()),
  useCoachProfile: () => ({ data: { coach: true } }),
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Coach tour', () => {
  it('never restores, replaces or clears real drafts and does not block leaving the tour', () => {
    const frame = document.createElement('iframe');
    frame.dataset.coachTour = 'v2';
    vi.spyOn(window, 'frameElement', 'get').mockReturnValue(frame);
    const key = `ascension:draft:${auth.user.email}:professional-settings`;
    const original = JSON.stringify({ savedAt: Date.now(), value: 'Real draft' });
    sessionStorage.setItem(key, original);
    const { result } = renderHook(() =>
      useSessionDraft(
        'professional-settings',
        'Example',
        (value): value is string => typeof value === 'string',
      ),
    );
    expect(result.current.value).toBe('Example');
    act(() => result.current.setValue('Changed example'));
    expect(result.current.value).toBe('Changed example');
    expect(window.dispatchEvent(new Event('beforeunload', { cancelable: true }))).toBe(true);
    expect(sessionStorage.getItem(key)).toBe(original);
    act(() => result.current.clear());
    expect(sessionStorage.getItem(key)).toBe(original);
    sessionStorage.removeItem(key);
  });
  it('starts a chapter in the real-screen route and persists its position', () => {
    render(
      <MemoryRouter initialEntries={['/entrenador/guia']}>
        <Routes>
          <Route path="/entrenador/guia" element={<CoachTourPage />} />
          <Route path="/entrenador/guia/recorrido" element={<p>Recorrido abierto</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const chapter = COACH_TOUR_STEPS.find((step) => step.id === 'copy') ?? COACH_TOUR_STEPS[0];
    fireEvent.click(screen.getByRole('button', { name: new RegExp(chapter.chapter) }));
    expect(screen.getByText('Recorrido abierto')).toBeInTheDocument();
    expect(readTourProgress(auth.user.email)?.status).toBe('started');
  });
  it('keeps progress account-scoped and survives blocked storage', () => {
    const account = 'private-tour@test';
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    saveTourProgress(account, { status: 'started', step: 8 });
    expect(readTourProgress(account)).toEqual({ status: 'started', step: 8 });
    expect(readTourProgress('another-account@test')).toBeNull();
  });
  it('allows only coach screens and utilities in navigation messages', () => {
    for (const step of COACH_TOUR_STEPS) expect(tourRouteAllowed(step.path)).toBe(true);
    for (const path of [
      'https://example.com',
      '/settings',
      '/entrenador/guia/recorrido',
      '//example.com',
      '/entrenador/../settings',
    ])
      expect(tourRouteAllowed(path)).toBe(false);
  });
  it('fits popovers within narrow and wide screens', () => {
    for (const width of [390, 1920]) {
      const position = tourPopupPosition(
        { left: width - 120, top: 760, width: 110, height: 70 },
        360,
        320,
        { width, height: 844 },
      );
      expect(position.left).toBeGreaterThanOrEqual(12);
      expect(position.left + 360).toBeLessThanOrEqual(width - 12);
      expect(position.top + 320).toBeLessThanOrEqual(832);
    }
  });
  it('cannot install example transport in the real app', () => {
    expect(() => installCoachTourPreview()).toThrow('pantalla aislada');
  });
  it('isolates example reads and rejects every mutation before the network', async () => {
    const frame = document.createElement('iframe');
    frame.dataset.coachTour = 'v2';
    vi.spyOn(window, 'frameElement', 'get').mockReturnValue(frame);
    const interceptor = installCoachTourPreview();
    try {
      const result = await api.get('/coach/clients');
      expect(result.data[0].client.name).toBe('Lucía Vega');
      result.data[0].client.name = 'Changed';
      expect((await api.get('/coach/clients')).data[0].client.name).toBe('Lucía Vega');
      for (const url of [
        '/coach/clients/tour-lucia/weeks/2026-11-16',
        '/settings',
        '/workouts',
        '/coaching/permissions',
      ]) {
        await expect(api.post(url, {})).rejects.toMatchObject({ code: 'ERR_TOUR_READ_ONLY' });
      }
      await expect(api.get('/coach/unexpected')).rejects.toThrow('sin datos');
    } finally {
      api.interceptors.request.eject(interceptor);
    }
  });
  it('provides the shapes expected by real library, workout and photo screens', () => {
    expect(tourResponse('/coach/library-items')).toMatchObject([
      { type: 'PROGRAM', category: 'SESSION', favorite: true },
    ]);
    expect(tourResponse('/coach/clients/tour-lucia/workouts')).toMatchObject({
      content: [],
      totalPages: 0,
    });
    expect(tourResponse('/coach/clients/tour-lucia/progress-photos')).toEqual({ photos: [] });
  });
});
