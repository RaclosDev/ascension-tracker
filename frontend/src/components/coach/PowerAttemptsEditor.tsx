import { POWER_LABELS, POWER_LIFTS } from '../../lib/coach/powerlifting';
import {
  attemptWarning,
  meetTotals,
  type MeetContent,
  type PowerAttempt,
} from '../../lib/coach/powerMeets';

export function PowerAttemptsEditor({
  attempts,
  rules,
  onChange,
}: {
  attempts: PowerAttempt[];
  rules: MeetContent['rules'];
  onChange: (attempts: PowerAttempt[]) => void;
}) {
  const totals = meetTotals(attempts);
  const change = (attempt: PowerAttempt, patch: Partial<PowerAttempt>) =>
    onChange(
      attempts.map((item) =>
        item.lift === attempt.lift && item.number === attempt.number ? { ...item, ...patch } : item,
      ),
    );
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-semibold">Intentos y resultado</h3>
      <p className="coach-description">
        Mantén el plan previsto y registra aparte el peso realizado. Los resultados los anota el
        entrenador.
      </p>
      <dl className="flex flex-wrap gap-6" aria-live="polite">
        <div>
          <dt>Total previsto</dt>
          <dd className="font-semibold">
            {totals.planned === null ? 'Faltan cargas previstas' : `${totals.planned} kg`}
          </dd>
        </div>
        <div>
          <dt>{totals.finished ? 'Total registrado' : 'Total provisional'}</dt>
          <dd className="font-semibold">
            {totals.actual === null
              ? `Sin total · ${totals.validLifts}/3 levantamientos válidos`
              : `${totals.actual} kg`}
          </dd>
        </div>
      </dl>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">Los nueve intentos de competición</caption>
          <thead>
            <tr>
              <th scope="col">Intento</th>
              <th scope="col">Previsto (kg)</th>
              <th scope="col">Realizado (kg)</th>
              <th scope="col">Resultado</th>
              {rules === 'IPF_2026' && <th scope="col">Récord</th>}
            </tr>
          </thead>
          <tbody>
            {POWER_LIFTS.flatMap((lift) =>
              attempts
                .filter((a) => a.lift === lift)
                .sort((a, b) => a.number - b.number)
                .map((attempt) => {
                  const label = `${POWER_LABELS[lift]} · Intento ${attempt.number}`;
                  const warning = attemptWarning(
                    attempt,
                    attempts.find((a) => a.lift === lift && a.number === attempt.number - 1),
                    rules,
                  );
                  return (
                    <tr
                      key={`${lift}:${attempt.number}`}
                      className="border-t"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <th scope="row" className="py-2 pr-3 font-semibold">
                        {label}
                        {warning && (
                          <p className="max-w-xs text-xs font-normal" role="status">
                            {warning}
                          </p>
                        )}
                      </th>
                      <td className="p-1">
                        <input
                          className="form-input min-h-11 w-24"
                          aria-label={`${label} · Previsto (kg)`}
                          type="number"
                          min={0.01}
                          max={1500}
                          step={0.01}
                          value={attempt.plannedKg ?? ''}
                          onChange={(e) =>
                            change(attempt, {
                              plannedKg: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                        />
                      </td>
                      <td className="p-1">
                        <input
                          className="form-input min-h-11 w-24"
                          aria-label={`${label} · Realizado (kg)`}
                          type="number"
                          min={0.01}
                          max={1500}
                          step={0.01}
                          required={attempt.result === 'VALID' || attempt.result === 'INVALID'}
                          value={attempt.actualKg ?? ''}
                          onChange={(e) =>
                            change(attempt, {
                              actualKg: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                        />
                      </td>
                      <td className="p-1">
                        <select
                          className="form-input min-h-11"
                          aria-label={`${label} · Resultado`}
                          value={attempt.result}
                          onChange={(e) =>
                            change(attempt, { result: e.target.value as PowerAttempt['result'] })
                          }
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="VALID">Válido</option>
                          <option value="INVALID">Nulo</option>
                          <option value="WITHDRAWN">No realizado</option>
                        </select>
                      </td>
                      {rules === 'IPF_2026' && (
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`${label} · Récord`}
                            checked={attempt.recordAttempt}
                            onChange={(e) => change(attempt, { recordAttempt: e.target.checked })}
                          />
                        </td>
                      )}
                    </tr>
                  );
                }),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
