import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { apiErrorMessage } from '../../lib/coach/api';
import {
  isSavedPowerProfile,
  MAX_KEYS,
  POWER_LABELS,
  POWER_LIFTS,
  usePowerProfile,
  useSavePowerProfile,
  type PowerProfile,
  type SavedPowerProfile,
} from '../../lib/coach/powerlifting';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { PowerMarksEditor } from './PowerMarksEditor';
import { PowerMeets } from './PowerMeets';
import { PowerProgress } from './PowerProgress';
import { PowerExerciseMappings } from './PowerExerciseMappings';

export default function ClientPowerlifting({
  linkId,
  canEdit,
}: {
  linkId: string;
  canEdit: boolean;
}) {
  const query = usePowerProfile(linkId);
  const [params, setParams] = useSearchParams();
  const requestedView = params.get('vista');
  const view =
    requestedView === 'competiciones' || requestedView === 'seguimiento' ? requestedView : 'perfil';
  return (
    <section className="card">
      <h2>Powerlifting</h2>
      <p className="coach-description mb-5">
        Referencias de fuerza y seguimiento de sentadilla, banca y peso muerto.
      </p>
      <nav aria-label="Áreas de powerlifting" className="flex flex-wrap gap-3 mb-5">
        {[
          ['perfil', 'Perfil y marcas'],
          ['competiciones', 'Competiciones'],
          ['seguimiento', 'Seguimiento S/B/D'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`btn ${view === id ? 'btn-primary' : 'btn-secondary'}`}
            aria-current={view === id ? 'page' : undefined}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set('vista', id);
              next.delete('competicion');
              setParams(next);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {query.isPending ? (
        <p role="status">Cargando perfil de powerlifting…</p>
      ) : query.isError ? (
        <QueryErrorNotice pending={query.isFetching} retry={() => void query.refetch()} />
      ) : view === 'competiciones' ? (
        <PowerMeets linkId={linkId} profile={query.data.profile} canEdit={canEdit} />
      ) : view === 'seguimiento' ? (
        <PowerProgress linkId={linkId} profile={query.data.profile} />
      ) : (
        <PowerForm
          key={`${query.data.version}:${canEdit}`}
          saved={query.data}
          canEdit={canEdit}
          reload={() => void query.refetch()}
        />
      )}
    </section>
  );
}

function PowerForm({
  saved,
  canEdit,
  reload,
}: {
  saved: SavedPowerProfile;
  canEdit: boolean;
  reload: () => void;
}) {
  const draft = useSessionDraft(`powerlifting:${saved.linkId}`, saved, isSavedPowerProfile);
  const save = useSavePowerProfile(saved.linkId);
  const [error, setError] = useState<string | null>(null);
  const value = canEdit ? draft.value : saved;
  const profile = value.profile;
  const stale = value.version !== saved.version;
  const set = (patch: Partial<PowerProfile>) =>
    draft.setValue({ ...value, profile: { ...profile, ...patch } });
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canEdit || stale || save.isPending) return;
        setError(null);
        save.mutate(value, {
          onSuccess: () => {
            draft.clear();
            toast.success('Perfil de powerlifting guardado');
          },
          onError: (cause) =>
            setError(apiErrorMessage(cause, 'No se pudo guardar. Conservamos tu borrador.')),
        });
      }}
    >
      {!canEdit && (
        <p role="status">
          Solo lectura. El alumno debe permitirte editar su entrenamiento para guardar cambios.
        </p>
      )}
      <fieldset disabled={!canEdit || save.isPending} className="flex flex-col gap-5 min-w-0">
        <PowerExerciseMappings
          linkId={saved.linkId}
          value={profile.exerciseMappings ?? []}
          onChange={(exerciseMappings) => set({ exerciseMappings })}
        />
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={profile.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          Especialización en powerlifting activa
        </label>
        {!profile.enabled && (
          <p className="coach-description">
            Actívala cuando trabajéis esta especialidad. Desactivarla conserva el perfil y las
            marcas.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            Equipamiento
            <select
              className="form-input min-h-11"
              value={profile.equipment}
              onChange={(e) => set({ equipment: e.target.value as PowerProfile['equipment'] })}
            >
              <option value="CLASSIC">Clásico / raw</option>
              <option value="EQUIPPED">Equipado</option>
              <option value="OTHER">Otro</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Federación de referencia (opcional)
            <input
              className="form-input min-h-11"
              maxLength={100}
              value={profile.federation}
              onChange={(e) => set({ federation: e.target.value })}
            />
          </label>
        </div>
        <section>
          <h3 className="font-semibold">Máximos de entrenamiento (TM)</h3>
          <p className="coach-description mb-3">
            Referencia en kg elegida por ti para programar cargas. Puede diferir del 1RM real y de
            su estimación. Deja vacío lo que aún no tengas definido.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {POWER_LIFTS.map((lift) => (
              <label key={lift} className="flex flex-col gap-1">
                {POWER_LABELS[lift]} (kg)
                <input
                  className="form-input min-h-11"
                  type="number"
                  min="0.01"
                  max="1500"
                  step="0.01"
                  value={profile.trainingMax[MAX_KEYS[lift]] ?? ''}
                  onChange={(e) =>
                    set({
                      trainingMax: {
                        ...profile.trainingMax,
                        [MAX_KEYS[lift]]: e.target.value === '' ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </section>
        <PowerMarksEditor
          marks={profile.marks}
          readOnly={!canEdit}
          onChange={(marks) => set({ marks })}
        />
        <label className="flex flex-col gap-1">
          Notas de entrenamiento
          <textarea
            className="form-input"
            rows={3}
            maxLength={2000}
            value={profile.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </label>
      </fieldset>
      {canEdit && draft.notice && (
        <p role="status" className="coach-description">
          {draft.notice}
        </p>
      )}
      {stale && (
        <p role="alert">
          Existe una versión más reciente. Tu borrador sigue disponible; revisa tus cambios antes de
          descartarlo y cargar la versión guardada.
        </p>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary mt-2" onClick={reload}>
            Consultar versión guardada
          </button>
        </div>
      )}
      {canEdit && (
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" disabled={save.isPending || stale || !draft.dirty}>
            {save.isPending ? 'Guardando…' : 'Guardar perfil de powerlifting'}
          </button>
          {draft.dirty && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={save.isPending}
              onClick={() => {
                draft.clear();
                setError(null);
              }}
            >
              Descartar borrador
            </button>
          )}
        </div>
      )}
    </form>
  );
}
