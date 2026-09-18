export const parseSafeWeight = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).replace(',', '.').trim();
  const parsed = parseFloat(str);
  if (isNaN(parsed) || parsed <= 0 || parsed > 450) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
};

