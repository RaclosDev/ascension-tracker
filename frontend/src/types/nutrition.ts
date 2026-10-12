import { FoodLog } from './api';

export interface EditingLog extends FoodLog {
  _kcalPer100: number;
  _protPer100: number;
  _carbsPer100: number;
  _fatPer100: number;
}

export interface Portion {
  label: string;
  amount: number;
}

export interface BasePortion {
  label: string;
  amount: number;
}
