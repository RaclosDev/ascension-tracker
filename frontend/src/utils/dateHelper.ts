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

/**
 * Returns a human-friendly label like "Hoy (8 sep)", "Ayer (7 sep)", or "8 sep 2026".
 */
export function formatFriendlyDate(dateStr: string) {
  if (!dateStr) return '';
  const today = getLocalDateString();
  const yesterday = addDaysToDateString(today, -1);
  const tomorrow = addDaysToDateString(today, 1);

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const monthNames = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const monthStr = monthNames[date.getMonth()];

  if (dateStr === today) {
    return `Hoy (${d} ${monthStr})`;
  } else if (dateStr === yesterday) {
    return `Ayer (${d} ${monthStr})`;
  } else if (dateStr === tomorrow) {
    return `Mañana (${d} ${monthStr})`;
  }

  const currentYear = new Date().getFullYear();
  if (y === currentYear) {
    return `${d} ${monthStr}`;
  }
  return `${d} ${monthStr} ${y}`;
}
