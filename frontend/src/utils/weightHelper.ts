export const parseSafeWeight = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).replace(',', '.').trim();
  if (!/^\d+(?:\.\d+)?$/.test(str)) return null;
  const parsed = Number(str);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 450) {
    return null;
  }
  const rounded = Math.round(parsed * 100) / 100;
  return rounded > 0 ? rounded : null;
};
