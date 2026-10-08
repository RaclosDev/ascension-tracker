export interface WeightEntry {
  id?: number;
  date: string;
  weight: number;
}

export interface DashboardData {
  currentWeight: number;
  currentWeeklyAverage: number;
  totalLost: number;
  remaining: number;
  progress: number;
  estimatedDate: string;
  avgWeeklyChange: number;
  weeksActive: number;
  bestWeekDelta: number;
  bestWeekDate: string;
  streak: number;
  streakDays: {
    date: string;
    hasData: boolean;
  }[];
}

export interface WeekSummary {
  weekStart: string;
  days: (number | null)[];
  average: number | null;
  delta: number | null;
  entries: number;
}

export interface UserSettings {
  startWeight: number;
  goalWeight: number;
  weeklyGoal: number;
  startDate: string;
  kcal: number;
  macroStrategy: string;
  customProteinPct?: number;
  customFatPct?: number;
  customCarbsPct?: number;
  customProteinGrams?: number;
  customFatGrams?: number;
  customCarbsGrams?: number;
  age?: number;
  heightCm?: number;
  sex?: string;
  activityFactor?: number;
  workoutData?: string;
}

export interface Meal {
  id?: number;
  name: string;
  icon?: string;
  proteinPct?: number;
  fixedProtein?: number;
  carbsPct?: number;
  fixedCarbs?: number;
  fatPct?: number;
  fixedFat?: number;
  sortOrder?: number;
  startTime?: string;
  endTime?: string;
  isDefault?: boolean;
}

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLog {
  id?: number;
  date: string;
  mealIndex: number;
  product: string;
  quantity: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portionsJson?: string;
}

export interface NutritionData {
  macros: Macros | null;
  meals: Meal[];
  settings: UserSettings;
  logs: FoodLog[];
}

export interface SavedFood {
  id?: number;
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSize?: number;
  servingLabel?: string;
}

export interface Recipe {
  id?: number;
  name: string;
  description?: string;
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface FoodListsData {
  recent: FoodLog[];
  saved: SavedFood[];
  recipes: Recipe[];
}
