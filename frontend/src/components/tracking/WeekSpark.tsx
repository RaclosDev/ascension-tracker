import { DayData } from '../../types/tracking';

const W = 112;
const H = 26;
const PAD = 3;

/** The week's weigh-ins as a small line, scaled to that week alone so the shape reads at a glance. */
export function WeekSpark({ days }: { days: DayData[] }) {
  const pts = days
    .map((d, i) => (d.weight !== null ? { i, w: d.weight } : null))
    .filter((p): p is { i: number; w: number } => p !== null);
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map((p) => p.w));
  const max = Math.max(...pts.map((p) => p.w));
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / 6) * (W - PAD * 2);
  const y = (w: number) => (max === min ? H / 2 : PAD + ((max - w) / span) * (H - PAD * 2));
  const line = pts.map((p) => `${x(p.i).toFixed(1)},${y(p.w).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg className="track-spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
      <polyline points={line} fill="none" />
      <circle cx={x(last.i)} cy={y(last.w)} r={2.5} />
    </svg>
  );
}
