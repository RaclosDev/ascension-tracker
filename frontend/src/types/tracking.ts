export interface DayData {
  weight: number | null;
  steps: number | null;
  calories: number | null;
}

export interface DayCellProps {
  dateStr: string;
  dayName: string;
  dayData: DayData;
  isToday: boolean;
  onOpenModal: (data: { dateStr: string; dayName: string; dayData: DayData }) => void;
  showWeight: boolean;
  showSteps: boolean;
  showCalories: boolean;
}

export interface WeekData {
  weekStart: string;
  averageWeight: number | null;
  deltaWeight: number | null;
  averageSteps: number | null;
  deltaSteps: number | null;
  averageCalories: number | null;
  deltaCalories: number | null;
  days: DayData[];
}

export interface TrackingModalData {
  dateStr: string;
  dayName: string;
  dayData: DayData;
  fullLabel: string;
}

export interface WeeklyMetricResponse {
  weekStart: string;
  average: number;
  delta: number;
  days: (number | null)[];
}
