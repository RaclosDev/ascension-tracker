import { BasePortion, Portion } from '../types/nutrition';
import { normalizeString } from '../lib/workout/format';

export const getBasePortion = (portionsJson: string | null): BasePortion | null => {
  if (!portionsJson) return null;
  try {
    const parsed: unknown = JSON.parse(portionsJson);
    if (!Array.isArray(parsed)) return null;
    const portions = parsed.filter(
      (value: unknown): value is Portion =>
        value !== null &&
        typeof value === 'object' &&
        'label' in value &&
        'amount' in value &&
        typeof value.label === 'string' &&
        value.label.trim().length > 0 &&
        typeof value.amount === 'number' &&
        Number.isFinite(value.amount) &&
        value.amount > 0,
    );
    const base = portions.find((portion) => portion.label.startsWith('1 '));
    if (base) return { label: base.label.replace(/^1\s+/, ''), amount: base.amount };
    const first = portions[0];
    if (first) return { label: first.label, amount: first.amount };
    return null;
  } catch {
    return null;
  }
};

/**
 * Determina si un producto de la lista de recientes (o cualquier nombre de producto)
 * ya se encuentra registrado en los alimentos guardados (savedFoods) o recetas (recipes).
 */
export function isFoodRegistered(
  productName: string | null | undefined,
  savedFoods: Array<{ name?: string | null; brand?: string | null }> = [],
  recipes: Array<{ name?: string | null }> = [],
): boolean {
  if (!productName) return false;
  const normProduct = normalizeString(productName).trim().replace(/\s+/g, ' ');
  if (!normProduct) return false;

  const match = normProduct.match(/^(.+?)\s*\((.+?)\)$/);
  const parsedName = match ? match[1].trim() : '';
  const parsedBrand = match ? match[2].trim() : '';

  const inSaved = savedFoods.some((sf) => {
    if (!sf || !sf.name) return false;
    const normName = normalizeString(sf.name).trim().replace(/\s+/g, ' ');
    if (!normName) return false;

    // Coincidencia directa con sf.name (ej. "filete ternera" o "Pan (Dia)")
    if (normName === normProduct) return true;

    const brandRaw = sf.brand ? sf.brand.trim() : '';
    const isGeneric =
      brandRaw.toLowerCase() === 'genérico' || brandRaw.toLowerCase() === 'generico';
    const normBrand =
      !isGeneric && brandRaw ? normalizeString(brandRaw).trim().replace(/\s+/g, ' ') : '';

    // Si sf tiene marca, comparar con "Nombre (Marca)"
    if (normBrand) {
      const combined = `${normName} (${normBrand})`;
      if (combined === normProduct) return true;
    }

    // Si el producto a buscar venía con formato "Nombre (Marca)", comparar por partes
    if (parsedName && parsedBrand) {
      if (normName === parsedName && normBrand === parsedBrand) {
        return true;
      }
    }

    return false;
  });

  if (inSaved) return true;

  const inRecipes = recipes.some((r) => {
    if (!r || !r.name) return false;
    const normName = normalizeString(r.name).trim().replace(/\s+/g, ' ');
    return normName === normProduct;
  });

  return inRecipes;
}
