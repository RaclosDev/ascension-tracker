export const WEIGHTS_DASHBOARD_FIXTURE = {
  avgWeight: 80.5,
  currentWeight: 81.2,
  currentWeeklyAverage: 81.2,
  totalEntries: 15,
  totalLost: -3.8,
  remaining: 3.2,
  progress: 54.3,
  estimatedDate: '2026-12-01',
  avgWeeklyChange: -0.4,
  weeksActive: 8,
  bestWeekDelta: -1.2,
  bestWeekDate: '2026-09-15',
  streak: 5,
  streakDays: [],
};

export const WEIGHTS_LIST_FIXTURE = [{ id: 1, date: '2026-10-12', weight: 81.2 }];

export const WEIGHTS_WEEKLY_FIXTURE = [
  {
    weekStart: '2026-10-12',
    average: 81.2,
    delta: -0.5,
    entries: 1,
    days: [81.2, null, null, null, null, null, null],
  },
];

export const STEPS_WEEKLY_FIXTURE = [
  {
    weekStart: '2026-10-12',
    average: 8500,
    delta: 500,
    days: [8500, null, null, null, null, null, null],
  },
];

export const NUTRITION_CALORIES_WEEKLY_FIXTURE = [
  {
    weekStart: '2026-10-12',
    average: 2000,
    delta: -50,
    days: [2000, null, null, null, null, null, null],
  },
];

export const NUTRITION_MACROS_FIXTURE = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70,
};

export const NUTRITION_MEALS_FIXTURE = [
  { id: 1, name: 'Desayuno', order: 0 },
  { id: 2, name: 'Comida', order: 1 },
  { id: 3, name: 'Cena', order: 2 },
];

export const SETTINGS_FIXTURE = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbGoal: 200,
  fatGoal: 70,
  meals: ['Desayuno', 'Comida', 'Cena'],
  weightGoal: 78.0,
  theme: 'dark',
  startWeight: 85.0,
  goalWeight: 78.0,
  weeklyGoal: -0.5,
  startDate: '2026-01-01',
  kcal: 2000,
  macroStrategy: 'balanced',
};
