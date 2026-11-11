import { describe, expect, it } from 'vitest';
import { clientTasks } from '../lib/coach/tasks';
import { emptySetup } from '../lib/coach/setup';
import type { CoachRow } from '../lib/coach/workspace';

const row = (): CoachRow => ({
  link: {
    linkId: 'a',
    client: { name: 'Ana', email: 'a@test', picture: null },
    since: '',
    permissions: {
      training: true,
      nutrition: false,
      body: false,
      editTraining: true,
      editNutrition: false,
    },
    setup: { ...emptySetup(), reviewed: true },
  },
  status: {
    linkId: 'a',
    level: 'AMBER',
    lastActivity: null,
    weightChange: null,
    pendingReplies: 1,
    signals: [
      { reason: 'NO_PROGRAM', level: 'AMBER', value: 0 },
      { reason: 'NO_NUTRITION_PLAN', level: 'AMBER', value: 0 },
      { reason: 'CHECKIN_MISSING', level: 'AMBER', value: 1 },
    ],
  },
});

describe('Tareas del entrenador', () => {
  it('directs contracted work to the correct screen and distinguishes client actions', () => {
    const tasks = clientTasks(row());
    expect(tasks.map((t) => t.id)).toEqual(['reply', 'NO_PROGRAM', 'CHECKIN_MISSING']);
    expect(tasks.find((t) => t.id === 'NO_PROGRAM')).toMatchObject({
      owner: 'coach',
      section: 'entrenamiento',
    });
    expect(tasks.find((t) => t.id === 'CHECKIN_MISSING')).toMatchObject({
      owner: 'client',
      section: 'revisiones',
    });
  });
  it('requires agreement before prescribing and keeps pending replies', () => {
    const data = row();
    data.link.setup = null;
    expect(clientTasks(data).map((t) => t.id)).toEqual(['reply', 'setup']);
  });
  it('keeps unanswered check-ins but suppresses other work during a pause', () => {
    const data = row();
    data.link.followup = {
      schedule: { day: 7, time: '18:00', timeZone: 'Europe/Madrid', paused: true },
      startedAt: '2026-11-01T12:00:00Z',
      nextDueAt: null,
    };
    expect(clientTasks(data).map((t) => t.id)).toEqual(['reply']);
  });
  it('shows missing permission as an action for the client and never grants it', () => {
    const data = row();
    data.link.permissions.training = false;
    data.link.permissions.editTraining = false;
    const tasks = clientTasks(data);
    expect(tasks.find((t) => t.id === 'consent')).toMatchObject({
      owner: 'client',
      section: 'gestion',
    });
    expect(tasks.some((t) => t.id === 'NO_PROGRAM')).toBe(false);
  });
  it('keeps onboarding tasks when follow-up data are unavailable without inventing signals', () => {
    const data = row();
    data.status = undefined;
    data.link.setup = emptySetup();
    expect(clientTasks(data).map((t) => t.id)).toEqual(['onboarding']);
  });
});
