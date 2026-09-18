import React from 'react';
import { Sunrise, Utensils, Moon, Apple, Coffee } from 'lucide-react';

export function MealIcon({ iconString, className = "w-5 h-5" }: { iconString: string, className?: string }) {
  if (!iconString) return <Utensils className={className} />;
  
  const s = iconString.toLowerCase().trim();
  
  if (s === '🌅' || s === 'sunrise' || s === 'desayuno') return <Sunrise className={className} />;
  if (s === '🥩' || s === '🍽️' || s === 'comida' || s === 'utensils') return <Utensils className={className} />;
  if (s === '🌙' || s === 'moon' || s === 'cena') return <Moon className={className} />;
  if (s === '🍎' || s === 'apple' || s === 'snacks' || s === 'snack') return <Apple className={className} />;
  if (s === '☕' || s === 'coffee') return <Coffee className={className} />;
  
  return <Utensils className={className} />;
}
