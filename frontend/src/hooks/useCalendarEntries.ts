import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { WeeklyMetricResponse } from '../types/tracking';
import { addDaysToDateString } from '../utils/dateHelper';

const endpoints = {
  weight: '/weights/weekly',
  steps: '/steps/weekly',
  meals: '/nutrition/calories/weekly',
};

export function useCalendarEntries(metric: keyof typeof endpoints) {
  return useQuery({
    queryKey: ['trackingWeeks', metric],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<WeeklyMetricResponse[]>(endpoints[metric], { signal });
      const entries = new Map<string, number>();
      for (const week of data) {
        week.days.forEach((value, index) => {
          if (value !== null) entries.set(addDaysToDateString(week.weekStart, index), value);
        });
      }
      return entries;
    },
  });
}
