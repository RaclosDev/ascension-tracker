import { SERVICE_LABELS, type CoachSetup } from '../../lib/coach/setup';
import { Select } from '@/components/ui/select';

/** The whole agreement, or only one half of it where the athlete's settings split it in two. */
export function CoachSetupFields({
  value,
  onChange,
  part,
}: {
  value: CoachSetup;
  onChange: (value: CoachSetup) => void;
  part?: 'servicio' | 'objetivo';
}) {
  const services = part !== 'objetivo';
  const goal = part !== 'servicio';
  return (
    <div className="flex flex-col gap-4">
      {services && (
        <fieldset className="flex flex-col gap-2">
          <legend className={part === 'servicio' ? 'sr-only' : 'form-label mb-2'}>
            Servicios acordados
          </legend>
          {(Object.keys(SERVICE_LABELS) as (keyof typeof SERVICE_LABELS)[]).map((key) => (
            <label key={key} className="flex items-center gap-3 min-h-10 cursor-pointer">
              <input
                type="checkbox"
                checked={value.services[key]}
                onChange={(e) =>
                  onChange({ ...value, services: { ...value.services, [key]: e.target.checked } })
                }
              />
              {SERVICE_LABELS[key]}
            </label>
          ))}
          <p className="coach-description">
            Define vuestro trabajo. El atleta autoriza por separado el acceso a sus datos.
          </p>
        </fieldset>
      )}
      {goal && (
        <label className="flex flex-col gap-1">
          Prioridad del seguimiento
          <Select
            className="form-input"
            value={value.goalFocus ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                goalFocus: (event.target.value as CoachSetup['goalFocus']) || null,
              })
            }
          >
            <option value="">Según ajustes actuales del atleta</option>
            <option value="GENERAL">Salud y condición física general</option>
            <option value="PERFORMANCE">Rendimiento y fuerza</option>
            <option value="MAINTAIN">Mantenimiento de peso</option>
            <option value="WEIGHT_CHANGE">Cambio de peso</option>
          </Select>
        </label>
      )}
      {goal && (
        <label className="flex flex-col gap-1">
          <span className="form-label">Objetivo del servicio (opcional)</span>
          <textarea
            className="form-input"
            rows={2}
            maxLength={400}
            value={value.goal ?? ''}
            onChange={(e) => onChange({ ...value, goal: e.target.value })}
          />
        </label>
      )}
      {goal && value.services.training && (
        <label className="flex flex-col gap-1">
          <span className="form-label">Esfuerzo en sus pautas</span>
          <Select
            className="form-input"
            value={value.effortMethod ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                effortMethod: (event.target.value as CoachSetup['effortMethod']) || null,
              })
            }
          >
            <option value="">Como en mis ajustes profesionales</option>
            <option value="RIR">RIR (repeticiones en reserva)</option>
            <option value="RPE">RPE (esfuerzo percibido)</option>
            <option value="NONE">Sin objetivo de esfuerzo</option>
          </Select>
          <span className="coach-description">
            Cámbialo solo si este atleta trabaja distinto al resto.
          </span>
        </label>
      )}
      {goal && value.services.training && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="form-label">Experiencia entrenando (opcional)</span>
            <input
              className="form-input"
              maxLength={200}
              value={value.experience ?? ''}
              onChange={(e) => onChange({ ...value, experience: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="form-label">Días disponibles por semana (opcional)</span>
            <input
              className="form-input"
              type="number"
              min={1}
              max={7}
              step={1}
              value={value.trainingDays ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  trainingDays: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="form-label">Material disponible (opcional)</span>
            <input
              className="form-input"
              maxLength={400}
              value={value.equipment ?? ''}
              onChange={(e) => onChange({ ...value, equipment: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
