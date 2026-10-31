/**
 * Local-timezone date helpers: `toISOString().split('T')[0]` converts to UTC and returns
 * yesterday shortly after midnight in UTC+ timezones.
 */

export function getLocalDateString(d: Date | string = new Date()) {
  const date =
    typeof d === 'string' ? (d.includes('T') ? new Date(d) : parseLocalDateString(d)) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateString(dateStr: string | undefined | null) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToDateString(dateStr: string, days: number) {
  const date = parseLocalDateString(dateStr);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

export function isTodayLocal(dateStr: string) {
  return dateStr === getLocalDateString();
}

/**
 * Uppercases only the first letter, as Spanish dates require: "Viernes, 30 de octubre de 2026".
 * Use it instead of CSS `capitalize`, which uppercases every word ("30 De Octubre").
 */
export function capitalizeFirst(text: string) {
  return text.charAt(0).toLocaleUpperCase('es-ES') + text.slice(1);
}
