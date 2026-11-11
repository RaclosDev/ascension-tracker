import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { apiErrorMessage } from '../../lib/coach/api';
import { REVIEW_DAYS } from '../../lib/coach/coachSchedule';
import { SERVICE_LABELS } from '../../lib/coach/setup';
import {
  isProfessionalSettings,
  useProfessionalSettings,
  useSaveProfessionalSettings,
  type ProfessionalSettings,
} from '../../lib/coach/professionalSettings';
import { QueryErrorNotice } from '../QueryErrorNotice';

export function ProfessionalSettingsEditor() {
  const settings = useProfessionalSettings();
  return (
    <section className="card">
      <h2>Tu perfil y forma de trabajar</h2>
      {settings.isPending ? (
        <p role="status">Cargando ajustes profesionales…</p>
      ) : settings.isError ? (
        <QueryErrorNotice pending={settings.isFetching} retry={() => void settings.refetch()} />
      ) : (
        <SettingsForm
          key={settings.data.version}
          saved={settings.data}
          reload={() => void settings.refetch()}
        />
      )}
    </section>
  );
}

function SettingsForm({ saved, reload }: { saved: ProfessionalSettings; reload: () => void }) {
  const draft = useSessionDraft('professional-settings', saved, isProfessionalSettings);
  const save = useSaveProfessionalSettings();
  const [error, setError] = useState<string | null>(null);
  const value = draft.value;
  const stale = value.version !== saved.version;
  const set = (patch: Partial<ProfessionalSettings>) => draft.setValue({ ...value, ...patch });
  const review = (patch: Partial<ProfessionalSettings['review']>) =>
    set({ review: { ...value.review, ...patch } });
  return (
    <form
      className="grid gap-6 lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (stale || save.isPending) return;
        setError(null);
        save.mutate(value, {
          onSuccess: () => {
            draft.clear();
            toast.success('Ajustes profesionales guardados');
          },
          onError: (cause) =>
            setError(
              apiErrorMessage(
                cause,
                'No se pudieron guardar los ajustes. Conservamos tu borrador.',
              ),
            ),
        });
      }}
    >
      <fieldset className="flex flex-col gap-3" disabled={save.isPending}>
        <legend className="font-semibold mb-2">Lo que ve tu alumno</legend>
        <p className="coach-description">
          Esta identidad aparece en tus invitaciones, planes y revisiones. Se guarda separada del
          nombre de tu cuenta.
        </p>
        <label className="flex flex-col gap-1">
          Nombre profesional
          <input
            className="form-input min-h-11"
            maxLength={80}
            required
            value={value.displayName}
            onChange={(e) => set({ displayName: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          Presentación para tus alumnos
          <textarea
            className="form-input"
            rows={3}
            maxLength={500}
            value={value.presentation}
            onChange={(e) => set({ presentation: e.target.value })}
            placeholder="Qué trabajáis juntos y cómo te organizas."
          />
        </label>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={value.showAccountPhoto}
            onChange={(e) => set({ showAccountPhoto: e.target.checked })}
          />
          Mostrar mi foto de cuenta a mis alumnos
        </label>
        <aside className="rounded-lg border p-4" aria-label="Vista previa del perfil">
          <p className="text-sm mb-2">Así te presentas</p>
          <p className="font-semibold break-words">
            {value.displayName || 'Tu nombre profesional'}
          </p>
          <p className="whitespace-pre-wrap break-words">
            {value.presentation || 'Sin presentación adicional'}
          </p>
        </aside>
      </fieldset>
      <fieldset className="flex flex-col gap-3" disabled={save.isPending}>
        <legend className="font-semibold mb-2">Nuevas incorporaciones</legend>
        <p className="coach-description">
          Se proponen al crear invitaciones. Puedes adaptar los servicios y quién rellena los datos
          antes de enviarlas. El alumno decide sus permisos.
        </p>
        {(Object.keys(SERVICE_LABELS) as (keyof typeof SERVICE_LABELS)[]).map((key) => (
          <label key={key} className="flex items-center gap-3 min-h-11">
            <input
              type="checkbox"
              checked={value.services[key]}
              onChange={(e) => set({ services: { ...value.services, [key]: e.target.checked } })}
            />
            {SERVICE_LABELS[key]}
          </label>
        ))}
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={value.prefill}
            onChange={(e) => set({ prefill: e.target.checked })}
          />
          Yo relleno los datos iniciales del alumno
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="default-review-day">Día de revisión inicial</label>
            <select
              id="default-review-day"
              className="form-input min-h-11"
              value={value.review.day}
              onChange={(e) => review({ day: Number(e.target.value) })}
            >
              {REVIEW_DAYS.map((day, index) => (
                <option key={day} value={index + 1}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <label className="flex flex-col gap-1">
            Hora de revisión inicial
            <input
              type="time"
              className="form-input min-h-11"
              required
              value={value.review.time.slice(0, 5)}
              onChange={(e) => review({ time: e.target.value })}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          Zona horaria de las revisiones
          <input
            className="form-input min-h-11"
            list="professional-timezones"
            required
            maxLength={80}
            value={value.review.timeZone}
            onChange={(e) => review({ timeZone: e.target.value })}
          />
        </label>
        <datalist id="professional-timezones">
          {[
            'Europe/Madrid',
            'Atlantic/Canary',
            'America/Mexico_City',
            'America/Bogota',
            'America/Argentina/Buenos_Aires',
            'UTC',
          ].map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        <p className="coach-description">
          La agenda se fija al crear la invitación. Estos cambios no modifican invitaciones enviadas
          ni alumnos actuales. Podrás ajustar cada agenda en la ficha del alumno.
        </p>
      </fieldset>

      {draft.notice && (
        <p role="status" className="coach-description lg:col-span-2">
          {draft.notice}
        </p>
      )}
      {stale && (
        <p role="alert" className="lg:col-span-2">
          Hay una versión más reciente. Conservamos tu borrador para que puedas copiarlo antes de
          descartarlo.
        </p>
      )}
      {error && (
        <div role="alert" className="lg:col-span-2">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary mt-2" onClick={reload}>
            Consultar versión guardada
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-3 lg:col-span-2">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={
            save.isPending ||
            stale ||
            !draft.dirty ||
            !value.displayName.trim() ||
            !Object.values(value.services).some(Boolean)
          }
        >
          {save.isPending ? 'Guardando…' : 'Guardar ajustes profesionales'}
        </button>
        {draft.dirty && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={save.isPending}
            onClick={() => {
              if (window.confirm('¿Descartar este borrador y recuperar los ajustes guardados?')) {
                draft.clear();
                setError(null);
              }
            }}
          >
            Descartar borrador
          </button>
        )}
      </div>
    </form>
  );
}
