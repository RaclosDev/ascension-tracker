import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  POWER_LABELS,
  POWER_LIFTS,
  type PowerLift,
  type PowerMark,
} from '../../lib/coach/powerlifting';
import { Select } from '@/components/ui/select';

const PAGE = 15;

/** Una fila por marca, de la más reciente a la más antigua, filtrable por levantamiento. */
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
  const [filter, setFilter] = useState<PowerLift | 'ALL'>('ALL');
  const [limit, setLimit] = useState(PAGE);
  // Las que se añaden en esta visita quedan arriba aunque se cambie su fecha.
  const [added, setAdded] = useState<string[]>([]);
  const update = (id: string, patch: Partial<PowerMark>) =>
    onChange(marks.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const rank = (m: PowerMark) => added.indexOf(m.id);
  const rows = marks
    .filter((m) => filter === 'ALL' || m.lift === filter)
    .sort((a, b) => rank(b) - rank(a) || b.date.localeCompare(a.date));
  const shown = rows.slice(0, limit);
  const add = () => {
    const mark: PowerMark = {
      id: crypto.randomUUID(),
      lift: filter === 'ALL' ? 'SQUAT' : filter,
      kg: 0,
      date: today,
      context: 'TRAINING',
      reference: '',
    };
    setAdded((ids) => [...ids, mark.id]);
    onChange([...marks, mark]);
  };
  return (
    <section className="pw-marks">
      <div className="pw-card-head">
        <h3>Marcas anotadas</h3>
        {!readOnly && marks.length < 200 && (
          <button type="button" className="btn btn-secondary pw-add" onClick={add}>
            <Plus size={16} aria-hidden /> Añadir marca
          </button>
        )}
      </div>
      <div className="pw-filter" role="group" aria-label="Filtrar por levantamiento">
        {(['ALL', ...POWER_LIFTS] as const).map((id) => {
          const count = id === 'ALL' ? marks.length : marks.filter((m) => m.lift === id).length;
          return (
            <button
              key={id}
              type="button"
              className="pw-filter-chip"
              aria-pressed={filter === id}
              onClick={() => {
                setFilter(id);
                setLimit(PAGE);
              }}
            >
              {id === 'ALL' ? 'Todas' : POWER_LABELS[id]}
              <span>{count}</span>
            </button>
          );
        })}
      </div>
      {rows.length === 0 ? (
        <p className="pw-empty">
          {marks.length === 0
            ? 'Todavía no hay marcas anotadas.'
            : 'No hay marcas de este levantamiento.'}
        </p>
      ) : (
        <div className="pw-table-wrap">
          <table className="pw-marks-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Levantamiento</th>
                <th scope="col">Peso (kg)</th>
                <th scope="col">Contexto</th>
                <th scope="col">Referencia</th>
                {!readOnly && (
                  <th scope="col">
                    <span className="sr-only">Quitar</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {shown.map((mark) => {
                const name = `${POWER_LABELS[mark.lift]} del ${mark.date}`;
                return (
                  <tr key={mark.id}>
                    <td>
                      <input
                        className="form-input"
                        type="date"
                        required
                        max={today}
                        aria-label={`Fecha de la marca de ${name}`}
                        value={mark.date}
                        onChange={(e) => update(mark.id, { date: e.target.value })}
                      />
                    </td>
                    <td>
                      <Select
                        className="form-input"
                        aria-label={`Levantamiento de la marca de ${name}`}
                        value={mark.lift}
                        onChange={(e) =>
                          update(mark.id, { lift: e.target.value as PowerMark['lift'] })
                        }
                      >
                        {POWER_LIFTS.map((lift) => (
                          <option key={lift} value={lift}>
                            {POWER_LABELS[lift]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <input
                        className="form-input pw-kg"
                        type="number"
                        min="0.01"
                        max="1500"
                        step="0.01"
                        required
                        aria-label={`Peso de la marca de ${name}`}
                        value={mark.kg || ''}
                        onChange={(e) => update(mark.id, { kg: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <Select
                        className="form-input"
                        aria-label={`Contexto de la marca de ${name}`}
                        value={mark.context}
                        onChange={(e) =>
                          update(mark.id, { context: e.target.value as PowerMark['context'] })
                        }
                      >
                        <option value="TRAINING">Entreno</option>
                        <option value="COMPETITION">Competición</option>
                      </Select>
                    </td>
                    <td>
                      <input
                        className="form-input"
                        maxLength={200}
                        aria-label={`Referencia de la marca de ${name}`}
                        value={mark.reference}
                        onChange={(e) => update(mark.id, { reference: e.target.value })}
                        placeholder="Competición o sesión"
                      />
                    </td>
                    {!readOnly && (
                      <td>
                        <button
                          type="button"
                          className="power-mark-remove"
                          aria-label={`Quitar la marca de ${name}`}
                          title="Quitar"
                          onClick={() => onChange(marks.filter((m) => m.id !== mark.id))}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > limit && (
        <button
          type="button"
          className="btn btn-secondary pw-more"
          onClick={() => setLimit((n) => n + PAGE * 2)}
        >
          Mostrar más ({rows.length - limit} restantes)
        </button>
      )}
      <p className="pw-hint">
        Levantamientos de una repetición anotados por ti; no son resultados certificados ni forman
        un total de competición.
      </p>
    </section>
  );
}
