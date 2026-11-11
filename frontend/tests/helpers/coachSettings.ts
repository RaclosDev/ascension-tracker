import type { ProfessionalSettings } from '../../src/lib/coach/professionalSettings';

export const coachSettings: ProfessionalSettings = {
  displayName: 'Entrenador',
  presentation: '',
  showAccountPhoto: true,
  services: { training: true, nutrition: false, progress: false },
  prefill: false,
  review: { day: 7, time: '18:00', timeZone: 'Europe/Madrid', paused: false },
  version: 0,
};
