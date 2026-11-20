import { Trash2 } from 'lucide-react';
import { POWER_LABELS, POWER_LIFTS, type PowerMark } from '../../lib/coach/powerlifting';
import { Select } from '@/components/ui/select';

export function PowerMarksEditor({
  marks,
  onChange,
  readOnly,
}: {
  marks: PowerMark[];
  onChange: (marks: PowerMark[]) => void;
  readOnly: boolean;
}) {
  const today = new Date().toLocaleDateString('sv-SE');
  const update = (id: string, patch: Partial<PowerMark>) =>
    onChange(marks.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  return (
    <section className="pw-marks">
      <h3>Marcas anotadas</h3>
      <p className="pw-hint">
        Registra levantamientos de una repetición. Son anotaciones del entrenador, no resultados
        certificados. Las marcas de fechas distintas no forman un total de competición.
      </p>
      {marks.length === 0 && <p className="pw-empty">Todavía no hay marcas anotadas.</p>}
      {marks.map((mark, index) => (
        <fieldset key={mark.id} className="power-mark">
          <legend>Marca {index + 1}</legend>
          <label>
            Levantamiento
            <Select
              className="form-input min-h-11"
              value={mark.lift}
              onChange={(e) => update(mark.id, { lift: e.target.value as PowerMark['lift'] })}
            >
              {POWER_LIFTS.map((lift) => (
                <option key={lift} value={lift}>
                  {POWER_LABELS[lift]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Peso (kg)
            <input
              className="form-input min-h-11"
              type="number"
              min="0.01"
              max="1500"
              step="0.01"
              required
              value={mark.kg || ''}
              onChange={(e) => update(mark.id, { kg: Number(e.target.value) })}
            />
          </label>
          <label>
            Fecha
            <input
              className="form-input min-h-11"
              type="date"
              required
              max={today}
              value={mark.date}
              onChange={(e) => update(mark.id, { date: e.target.value })}
            />
          </label>
          <label>
            Contexto
            <Select
              className="form-input min-h-11"
              value={mark.context}
              onChange={(e) => update(mark.id, { context: e.target.value as PowerMark['context'] })}
            >
              <option value="TRAINING">Entrenamiento</option>
              <option value="COMPETITION">Competición</option>
            </Select>
          </label>
          <label className="power-mark-ref">
            Referencia (opcional)
            <input
              className="form-input min-h-11"
              maxLength={200}
              value={mark.reference}
              onChange={(e) => update(mark.id, { reference: e.target.value })}
              placeholder="Nombre de la competición o sesión"
            />
          </label>
          {!readOnly && (
            <button
              type="button"
              className="power-mark-remove"
              aria-label={`Quitar marca ${index + 1}`}
              onClick={() => onChange(marks.filter((m) => m.id !== mark.id))}
            >
              <Trash2 size={16} aria-hidden /> <span>Quitar</span>
            </button>
          )}
        </fieldset>
      ))}
      {!readOnly && marks.length < 200 && (
        <button
          type="button"
          className="btn btn-secondary pw-add"
          onClick={() =>
            onChange([
              ...marks,
              {
                id: crypto.randomUUID(),
                lift: 'SQUAT',
                kg: 0,
                date: today,
                context: 'TRAINING',
                reference: '',
              },
            ])
          }
        >
          Añadir marca
        </button>
      )}
    </section>
  );
}
