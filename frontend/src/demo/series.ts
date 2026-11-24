/** Fechas y series diarias que comparten la demo del atleta y la de la atleta de ejemplo. */

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dayAt = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return d;
};
export const daysAgo = (offset: number) => iso(dayAt(offset));
const mondayOf = (d: Date) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
};
export const round = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** Generador con semilla fija: la demo enseña siempre los mismos datos. */
export function seeded(start: number) {
  let seed = start;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function weekly(values: Map<string, number>, decimals: number) {
  const dates = [...values.keys()].sort();
  if (dates.length === 0) return [];
  const [y, m, d] = dates[0].split('-').map(Number);
  const cursor = mondayOf(new Date(y, m - 1, d, 12));
  const last = mondayOf(dayAt(0));
  const weeks = [];
  let previous: number | null = null;
  while (cursor <= last) {
    const days: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor);
      day.setDate(day.getDate() + i);
      days.push(values.get(iso(day)) ?? null);
    }
    const valid = days.filter((v): v is number => v !== null);
    const average = valid.length
      ? round(valid.reduce((a, b) => a + b, 0) / valid.length, decimals)
      : null;
    weeks.push({
      weekStart: iso(cursor),
      days,
      average,
      delta: average !== null && previous !== null ? round(average - previous, decimals) : null,
      entries: valid.length,
    });
    if (average !== null) previous = average;
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

export function weightList(weights: Map<string, number>) {
  return [...weights.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight], index) => ({ id: index + 1, date, weight }));
}

export function weightDashboard(
  weights: Map<string, number>,
  startWeight: number,
  goalWeight: number,
) {
  const list = weightList(weights);
  const weeks = weekly(weights, 2).filter((week) => week.average !== null);
  const current = list.at(-1)?.weight ?? startWeight;
  const deltas = weeks.filter((week) => week.delta !== null);
  const avgWeeklyChange = deltas.length
    ? round(deltas.reduce((sum, week) => sum + (week.delta ?? 0), 0) / deltas.length, 2)
    : 0;
  const best = deltas.reduce<(typeof deltas)[number] | null>(
    (min, week) => (!min || (week.delta ?? 0) < (min.delta ?? 0) ? week : min),
    null,
  );
  const remaining = round(current - goalWeight, 1);
  const total = startWeight - goalWeight;
  const weeksLeft = avgWeeklyChange < 0 ? Math.ceil(remaining / -avgWeeklyChange) : 12;
  let streak = 0;
  while (weights.has(daysAgo(streak))) streak++;
  return {
    currentWeight: current,
    currentWeeklyAverage: weeks.at(-1)?.average ?? current,
    totalEntries: list.length,
    totalLost: round(current - startWeight, 1),
    remaining,
    progress: total ? round(((startWeight - current) / total) * 100, 1) : 0,
    estimatedDate: iso(dayAt(-weeksLeft * 7)),
    avgWeeklyChange,
    weeksActive: weeks.length,
    bestWeekDelta: best?.delta ?? 0,
    bestWeekDate: best?.weekStart ?? daysAgo(0),
    streak,
    streakDays: [6, 5, 4, 3, 2, 1, 0].map((offset) => ({
      date: daysAgo(offset),
      hasData: weights.has(daysAgo(offset)),
    })),
  };
}
