export type PageFoodItem = import('./api').SavedFood &
  import('./api').FoodLog & {
    quantity?: number;
    product?: string;
    brand?: string;
    servingLabel?: string;
    servingSize?: number;
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    imageUrl?: string;
    barcode?: string;
    [key: string]: string | number | undefined | null | boolean;
  };

export type PageRecipeItem = import('./api').Recipe & {
  [key: string]: string | number | undefined | null | boolean;
};

export interface FoodForm {
  name: string;
  brand: string;
  protein: string;
  carbs: string;
  fat: string;
  kcal: string;
  servingSize: string;
  servingLabel: string;
}
export interface RecipeForm {
  name: string;
  description: string;
  protein: string;
  carbs: string;
  fat: string;
  kcal: string;
}
