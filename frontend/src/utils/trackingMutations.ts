import type { DayData } from '../types/tracking';
import { parseSafeWeight } from './weightHelper';

export function parseTrackingInputs(
  weightInput: string,
  stepsInput: string,
): Pick<DayData, 'weight' | 'steps'> {
  const weightText = weightInput.trim();
  const stepsText = stepsInput.trim();
  const weight = weightText === '' ? null : parseSafeWeight(weightText);
  if (weightText !== '' && (weight === null || !/^\d+(?:[.,]\d+)?$/.test(weightText))) {
    throw new Error('Introduce un peso entre 0 y 450 kg.');
  }
  const steps = stepsText === '' ? null : Number(stepsText);
  if (
    steps !== null &&
    (!/^\d+$/.test(stepsText) || !Number.isSafeInteger(steps) || steps > 2147483647)
  ) {
    throw new Error('Los pasos deben ser un entero entre 0 y 2147483647.');
  }
  return { weight, steps };
}

interface TrackingWriter {
  post: (url: string, data: Record<string, number | string>) => Promise<unknown>;
  delete: (url: string) => Promise<unknown>;
}

export async function applyTrackingChanges(
  writer: TrackingWriter,
  date: string,
  current: Pick<DayData, 'weight' | 'steps'>,
  next: Pick<DayData, 'weight' | 'steps'>,
  onApplied: (metric: 'weight' | 'steps', value: number | null) => void,
): Promise<void> {
  for (const metric of ['weight', 'steps'] as const) {
    if (current[metric] === next[metric]) continue;
    const endpoint = metric === 'weight' ? '/weights' : '/steps';
    if (next[metric] === null) await writer.delete(`${endpoint}/${date}`);
    else await writer.post(endpoint, { date, [metric]: next[metric] });
    // Each endpoint commits independently; preserve completed work if the next one fails.
    onApplied(metric, next[metric]);
  }
}
