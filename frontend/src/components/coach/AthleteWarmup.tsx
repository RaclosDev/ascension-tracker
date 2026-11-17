import { useEffect, useState } from 'react';
import { useClientCustomExercises, type CoachClient } from '../../lib/coach/api';
import { useClientCheckins } from '../../lib/coach/checkins';
import { useClientAssignments, useCoachPrograms } from '../../lib/coach/coachPrograms';
import { useLibraryItems } from '../../lib/coach/library';
import { useCoachNutritionPlan } from '../../lib/coach/nutritionPlan';
import { shiftWeek, useCoachWeek, weekDate } from '../../lib/coach/weeks';

function WarmTraining({ linkId }: { linkId: string }) {
  useClientAssignments(linkId);
  useCoachWeek(linkId, shiftWeek(weekDate(), 1));
  useCoachPrograms();
  useLibraryItems();
  useClientCustomExercises(linkId);
  return null;
}

function WarmNutrition({ linkId }: { linkId: string }) {
  useCoachNutritionPlan(linkId);
  return null;
}

function WarmCheckins({ linkId }: { linkId: string }) {
  useClientCheckins(linkId);
  return null;
}

/**
 * Loads the code and the data of the athlete's other sections once the browser is idle, so opening
 * a tab for the first time paints from cache instead of waiting for a chunk and then its requests.
 */
export function AthleteWarmup({ link }: { link: CoachClient }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    const timer = window.setTimeout(() => {
      setReady(true);
      void import('./ClientWeek');
      void import('./ClientPrograms');
      void import('./ClientTraining');
      void import('./ClientNutrition');
      void import('./ClientPowerlifting');
      void import('./ClientProgress');
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);
  if (!ready) return null;
  const { linkId, permissions, setup } = link;
  return (
    <>
      <WarmCheckins linkId={linkId} />
      {permissions.training && <WarmTraining linkId={linkId} />}
      {permissions.nutrition && setup?.services.nutrition !== false && (
        <WarmNutrition linkId={linkId} />
      )}
    </>
  );
}
