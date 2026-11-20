import type { PowerBlock } from '../../lib/coach/powerMeets';
import { Link } from 'react-router-dom';
import { shiftWeek, weekDate } from '../../lib/coach/weeks';
import { DatePicker } from '@/components/ui/date-picker';

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
    <section className="card pw-card">
      <h4>Bloques de preparación</h4>
      <p className="pw-hint">
        Define fechas y objetivos y abre cada semana para programar sus sesiones. Cambiar estas
        fechas no modifica las pautas ya publicadas.
      </p>
      {blocks.length === 0 && <p>No hay bloques definidos.</p>}
      {blocks.map((block, index) => (
        <fieldset key={block.id} className="pw-block">
          <legend>Bloque {index + 1}</legend>
          <label className="pw-field pw-span">
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
            <div className="pw-span pw-chips">
              {Array.from({ length: 53 }, (_, i) =>
                shiftWeek(weekDate(new Date(`${block.start}T12:00:00`)), i),
              )
                .filter((week) => week <= block.end)
                .map((week) => (
                  <Link
                    key={week}
                    className="pw-chip"
                    to={`/entrenador/atletas/${linkId}?seccion=semana&semana=${week}`}
                  >
                    Semana {week}
                  </Link>
                ))}
            </div>
          )}
          <label className="pw-field">
            Inicio
            <DatePicker
              className="form-input min-h-11"
              required
              max={block.end || date || undefined}
              value={block.start}
              onChange={(start) => change(block.id, { start })}
            />
          </label>
          <label className="pw-field">
            Fin
            <DatePicker
              className="form-input min-h-11"
              required
              min={block.start || undefined}
              max={date || undefined}
              value={block.end}
              onChange={(end) => change(block.id, { end })}
            />
          </label>
          <label className="pw-field pw-span">
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
              className="power-mark-remove"
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
          className="btn btn-secondary pw-add"
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
