interface MacroSummaryHeaderProps {
  consumed: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    coachName?: string | null;
    dayType?: 'TRAINING' | 'REST' | null;
  };
}

const num = (v: unknown) => Math.round(Number(v) || 0);
const pct = (done: number, target: number) =>
  target > 0 ? Math.min(100, Math.max(0, (done / target) * 100)) : 0;

const MACROS = [
  { key: 'protein', label: 'Proteínas', kcalPerGram: 4, tone: 'p' },
  { key: 'carbs', label: 'Hidratos', kcalPerGram: 4, tone: 'c' },
  { key: 'fat', label: 'Grasas', kcalPerGram: 9, tone: 'f' },
] as const;

/** The day's totals against the targets: kcal first, the three macros under it, then the kcal split. */
export default function MacroSummaryHeader({ consumed, macros }: MacroSummaryHeaderProps) {
  const kcal = num(consumed?.kcal);
  const kcalTarget = num(macros?.kcal);
  const left = kcalTarget - kcal;
  const over = kcalTarget > 0 && left < 0;

  const fromMacros = MACROS.map((m) => num(consumed?.[m.key]) * m.kcalPerGram);
  const macroKcal = fromMacros.reduce((a, b) => a + b, 0);

  return (
    <section className="card day-totals" aria-labelledby="day-totals-title">
      <header className="day-totals-head">
        <h2 id="day-totals-title" className="panel-title">
          Total del día
        </h2>
        {kcalTarget > 0 && (
          <span className="day-totals-pct tabular-nums">{Math.round(pct(kcal, kcalTarget))}%</span>
        )}
      </header>
      {macros?.coachName && (
        <p className="day-totals-coach">
          Pautado por {macros.coachName} · Día de{' '}
          {macros.dayType === 'TRAINING' ? 'entreno' : 'descanso'}
        </p>
      )}

      <p className="day-totals-kcal tabular-nums">
        {kcal}
        <span>{kcalTarget > 0 ? ` / ${kcalTarget} kcal` : ' kcal'}</span>
      </p>
      {kcalTarget > 0 && (
        <div className="macro-bar macro-bar-lg" data-over={over || undefined} aria-hidden>
          <span style={{ width: `${pct(kcal, kcalTarget)}%` }} />
        </div>
      )}
      <p className="day-totals-left" data-over={over || undefined}>
        {kcalTarget > 0
          ? over
            ? `${Math.abs(left)} kcal por encima del objetivo`
            : `Quedan ${left} kcal`
          : 'Configura tu objetivo en Ajustes'}
      </p>

      <dl className="day-macros">
        {MACROS.map((m) => {
          const done = num(consumed?.[m.key]);
          const target = num(macros?.[m.key]);
          return (
            <div key={m.key} className="day-macro" data-tone={m.tone}>
              <dt>{m.label}</dt>
              <dd className="tabular-nums">
                {done}
                <span>{target > 0 ? ` / ${target} g` : ' g'}</span>
              </dd>
              <div className="macro-bar" aria-hidden>
                <span style={{ width: `${pct(done, target)}%` }} />
              </div>
            </div>
          );
        })}
      </dl>

      {macroKcal > 0 && (
        <div className="day-split">
          <p className="panel-note">Reparto de las kcal</p>
          <div className="day-split-bar" aria-hidden>
            {MACROS.map((m, i) => (
              <span key={m.key} data-tone={m.tone} style={{ flexGrow: fromMacros[i] }} />
            ))}
          </div>
          <ul className="day-split-keys">
            {MACROS.map((m, i) => (
              <li key={m.key} data-tone={m.tone}>
                {m.label}{' '}
                <strong className="tabular-nums">
                  {Math.round((fromMacros[i] / macroKcal) * 100)}%
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
