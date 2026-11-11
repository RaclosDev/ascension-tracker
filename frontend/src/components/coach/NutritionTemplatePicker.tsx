import { confirmAction } from '../../lib/confirmation';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNutritionTemplate, useNutritionTemplates } from '@/lib/coach/nutritionTemplates';
import { nutritionDraft, type NutritionDraft } from '@/lib/coach/nutritionDraft';
import { NutritionPlanSummary } from './NutritionPlanSummary';

export function NutritionTemplatePicker({
  onCopy,
  dirty,
  disabled,
}: {
  onCopy: (fields: NutritionDraft) => void;
  dirty: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const selectId = useId();
  const list = useNutritionTemplates(open);
  const selected = useNutritionTemplate(open && id ? id : null);
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        className="btn btn-secondary self-start"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Usar pauta de biblioteca
      </button>
      {open && (
        <div className="card flex flex-col gap-3">
          <p>
            Copiar solo cambia este borrador. Revisa las recetas actuales y publica cuando esté
            adaptado al alumno.
          </p>
          {list.isPending ? (
            <p role="status">Cargando biblioteca…</p>
          ) : list.isError ? (
            <div role="alert">
              No se pudo cargar la biblioteca.{' '}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void list.refetch()}
              >
                Reintentar biblioteca
              </button>
            </div>
          ) : list.data.length === 0 ? (
            <p>Aún no hay pautas en tu biblioteca.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor={selectId}>Pauta de biblioteca</label>
              <select
                id={selectId}
                className="form-input min-h-11"
                value={id}
                disabled={disabled}
                onChange={(event) => setId(event.target.value)}
              >
                <option value="">Elige una pauta</option>
                {list.data.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {id &&
            (selected.isPending ? (
              <p role="status">Cargando pauta…</p>
            ) : selected.isError ? (
              <div role="alert">
                No se pudo cargar esta pauta.{' '}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void selected.refetch()}
                >
                  Reintentar pauta de biblioteca
                </button>
              </div>
            ) : (
              <>
                <NutritionPlanSummary plan={selected.data.content} />
                <button
                  type="button"
                  className="btn btn-primary self-start"
                  disabled={disabled}
                  onClick={async () => {
                    if (
                      dirty &&
                      !(await confirmAction({
                        title: 'Sustituir borrador',
                        description: '¿Sustituir tu borrador por esta pauta de biblioteca?',
                        confirmLabel: 'Sustituir borrador',
                        destructive: true,
                      }))
                    )
                      return;
                    onCopy(nutritionDraft(selected.data.content));
                    setOpen(false);
                  }}
                >
                  Copiar al borrador
                </button>
              </>
            ))}
          <Link to="/entrenador/pautas">Abrir biblioteca de pautas</Link>
        </div>
      )}
    </section>
  );
}
