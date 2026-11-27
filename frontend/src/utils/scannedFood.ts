import { normalizeString } from '../lib/workout/format';
import type { SavedFoodExtended } from '../components/food/FoodSearchResultsList';

/** Names shorter than this say too little to tell two foods apart. */
const MIN_NAME_LENGTH = 3;

const squash = (text: string) => normalizeString(text).replace(/\s+/g, ' ').trim();

/**
 * The saved food that a scanned product is, or undefined when none is clearly the same one. Saved foods
 * carry no barcode, so the only evidence is the name: it has to match exactly (accents and case aside),
 * alone or followed by the brand as the app saves it, and a missing or very short name matches nothing.
 */
export function findSavedFoodForScan(
  savedFoods: SavedFoodExtended[],
  productName: string,
  brand: string,
): SavedFoodExtended | undefined {
  const name = squash(productName);
  if (name.length < MIN_NAME_LENGTH) return undefined;
  const withBrand = squash(`${productName} - ${brand}`);
  return savedFoods.find((saved) => {
    if (!saved.id || saved.isRecipe) return false;
    const savedName = squash(saved.name || '');
    return savedName === name || (!!brand.trim() && savedName === withBrand);
  });
}
