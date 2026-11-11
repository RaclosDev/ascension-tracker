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
  const change = (a: PowerAttempt, patch: Partial<PowerAttempt>) =>
    onChange(
      attempts.map((item) =>
        item.lift === a.lift && item.number === a.number ? { ...item, ...patch } : item,
      ),
    );
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-semibold">Intentos y resultado</h3>
      <p className="coach-description">
        Mantén el plan previsto y registra aparte el peso realizado. Los resultados los anota el
        entrenador.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2" aria-live="polite">
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
      {POWER_LIFTS.map((lift) => (
        <div key={lift} className="flex flex-col gap-3">
          <h4 className="font-semibold">{POWER_LABELS[lift]}</h4>
          <div className="grid gap-3 xl:grid-cols-3">
            {attempts
              .filter((a) => a.lift === lift)
              .sort((a, b) => a.number - b.number)
              .map((a) => {
                const warning = attemptWarning(
                  a,
                  attempts.find((p) => p.lift === lift && p.number === a.number - 1),
                  rules,
                );
                return (
                  <fieldset
                    key={a.number}
                    className="min-w-0 rounded-xl border border-[var(--border-color)] p-3 flex flex-col gap-3"
                  >
                    <legend className="font-semibold px-1">
                      {POWER_LABELS[lift]} · Intento {a.number}
                    </legend>
                    <label className="flex flex-col gap-1">
                      Previsto (kg)
                      <input
                        className="form-input min-h-11"
                        type="number"
                        min="0.01"
                        max="1500"
                        step="0.01"
                        value={a.plannedKg ?? ''}
                        onChange={(e) =>
                          change(a, { plannedKg: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Realizado (kg)
                      <input
                        className="form-input min-h-11"
                        type="number"
                        min="0.01"
                        max="1500"
                        step="0.01"
                        required={a.result === 'VALID' || a.result === 'INVALID'}
                        value={a.actualKg ?? ''}
                        onChange={(e) =>
                          change(a, { actualKg: e.target.value ? Number(e.target.value) : null })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Resultado
                      <select
                        className="form-input min-h-11"
                        value={a.result}
                        onChange={(e) =>
                          change(a, { result: e.target.value as PowerAttempt['result'] })
                        }
                      >
                        <option value="PENDING">Pendiente</option>
                        <option value="VALID">Válido</option>
                        <option value="INVALID">Nulo</option>
                        <option value="WITHDRAWN">No realizado</option>
                      </select>
                    </label>
                    {rules === 'IPF_2026' && (
                      <label className="flex items-center gap-2 min-h-11">
                        <input
                          type="checkbox"
                          checked={a.recordAttempt}
                          onChange={(e) => change(a, { recordAttempt: e.target.checked })}
                        />
                        Intento de récord
                      </label>
                    )}
                    {warning && (
                      <p className="text-sm" role="status">
                        {warning}
                      </p>
                    )}
                  </fieldset>
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
}
