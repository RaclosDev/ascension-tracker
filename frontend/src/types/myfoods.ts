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
