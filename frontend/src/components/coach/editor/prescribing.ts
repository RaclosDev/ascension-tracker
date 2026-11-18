import { createContext, useContext, useMemo } from 'react';
import { useProfessionalSettings } from '@/lib/coach/professionalSettings';
import { useCustomExercises } from '@/lib/workout/api';
import { getExerciseMap, useExerciseCatalog } from '@/lib/workout/exercises';
import { unitFor, type EffortMethod, type LoadUnit } from '@/lib/coach/prescription';

/** The athlete's own effort method, when it differs from how the coach usually prescribes. */
export const AthleteEffort = createContext<EffortMethod | null>(null);

/** How this coach prescribes: effort method and the unit each exercise's load is written in. */
export function usePrescribing() {
  const athlete = useContext(AthleteEffort);
  const { data: settings } = useProfessionalSettings();
  const { data: catalog } = useExerciseCatalog();
  const { data: custom } = useCustomExercises();
  const exercises = useMemo(() => getExerciseMap(custom, catalog), [custom, catalog]);
  const dumbbell: LoadUnit = settings?.dumbbellLoad ?? 'EACH';
  return {
    effort: athlete ?? settings?.effortMethod ?? ('RIR' as EffortMethod),
    unitOf: (exerciseId: string) => unitFor(exercises.get(exerciseId)?.equipment, dumbbell),
  };
}
