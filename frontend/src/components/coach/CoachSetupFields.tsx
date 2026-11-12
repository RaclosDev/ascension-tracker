import { SERVICE_LABELS, type CoachSetup } from '../../lib/coach/setup';

export function CoachSetupFields({
  value,
  onChange,
}: {
  value: CoachSetup;
  onChange: (value: CoachSetup) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="form-label mb-2">Servicios acordados</legend>
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
      <label className="flex flex-col gap-1">
        Prioridad del seguimiento
        <select
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
        </select>
      </label>
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
      {value.services.training && (
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
