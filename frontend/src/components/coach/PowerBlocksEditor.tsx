import type { PowerBlock } from '../../lib/coach/powerMeets';
import { Link } from 'react-router-dom';
import { shiftWeek, weekDate } from '../../lib/coach/weeks';

export function PowerBlocksEditor({
  blocks,
  date,
  canEdit,
  onChange,
  linkId,
}: {
  blocks: PowerBlock[];
  date: string;
  canEdit: boolean;
  onChange: (blocks: PowerBlock[]) => void;
  linkId: string;
}) {
  const change = (id: string, patch: Partial<PowerBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-semibold">Bloques de preparación</h3>
      <p className="coach-description">
        Define fechas y objetivos y abre cada semana para programar sus sesiones. Cambiar estas
        fechas no modifica las pautas ya publicadas.
      </p>
      {blocks.length === 0 && <p>No hay bloques definidos.</p>}
      {blocks.map((block, index) => (
        <fieldset
          key={block.id}
          className="rounded-xl border border-[var(--border-color)] p-3 grid gap-3 sm:grid-cols-2"
        >
          <legend className="px-1 font-semibold">Bloque {index + 1}</legend>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Nombre del bloque
            <input
              className="form-input min-h-11"
              required
              maxLength={80}
              value={block.name}
              onChange={(e) => change(block.id, { name: e.target.value })}
            />
          </label>
          {block.start && block.end && block.start <= block.end && (
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {Array.from({ length: 53 }, (_, i) =>
                shiftWeek(weekDate(new Date(`${block.start}T12:00:00`)), i),
              )
                .filter((week) => week <= block.end)
                .map((week) => (
                  <Link
                    key={week}
                    className="btn btn-secondary text-sm"
                    to={`/entrenador/alumnos/${linkId}?seccion=semana&semana=${week}`}
                  >
                    Semana {week}
                  </Link>
                ))}
            </div>
          )}
          <label className="flex flex-col gap-1">
            Inicio
            <input
              className="form-input min-h-11"
              type="date"
              required
              max={block.end || date || undefined}
              value={block.start}
              onChange={(e) => change(block.id, { start: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            Fin
            <input
              className="form-input min-h-11"
              type="date"
              required
              min={block.start || undefined}
              max={date || undefined}
              value={block.end}
              onChange={(e) => change(block.id, { end: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Objetivo del bloque
            <textarea
              className="form-input"
              required
              maxLength={500}
              rows={2}
              value={block.goal}
              onChange={(e) => change(block.id, { goal: e.target.value })}
            />
          </label>
          {canEdit && (
            <button
              type="button"
              className="btn btn-secondary justify-self-start"
              onClick={() => onChange(blocks.filter((b) => b.id !== block.id))}
            >
              Quitar bloque {index + 1}
            </button>
          )}
        </fieldset>
      ))}
      {canEdit && blocks.length < 30 && (
        <button
          type="button"
          className="btn btn-secondary self-start"
          onClick={() =>
            onChange([
              ...blocks,
              { id: crypto.randomUUID(), name: '', start: '', end: '', goal: '' },
            ])
          }
        >
          Añadir bloque
        </button>
      )}
    </section>
  );
}
