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
import { SegmentedControl } from '../ui/segmented-control';
import { PowerMarksEditor } from './PowerMarksEditor';
import { PowerMeets } from './PowerMeets';
import { PowerProgress } from './PowerProgress';
import { PowerExerciseMappings } from './PowerExerciseMappings';
import { Select } from '@/components/ui/select';
import '../../styles/coach-powerlifting.css';

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
    <section className="pw" aria-labelledby="pw-title">
      <h2 id="pw-title" className="sr-only">
        Powerlifting
      </h2>
      <nav aria-label="Áreas de powerlifting" className="power-areas">
        <SegmentedControl
          value={view}
          options={[
            { value: 'perfil', label: 'Perfil y marcas' },
            { value: 'competiciones', label: 'Competiciones' },
            { value: 'seguimiento', label: 'Seguimiento S/B/D' },
          ]}
          onChange={(id) => {
            const next = new URLSearchParams(params);
            next.set('vista', id);
            next.delete('competicion');
            setParams(next);
          }}
        />
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
  // The best recorded lift of each kind, so the marks open with what matters.
  const best = POWER_LIFTS.map((lift) => ({
    lift,
    kg: Math.max(0, ...profile.marks.filter((m) => m.lift === lift).map((m) => m.kg || 0)),
  }));
  return (
    <form
      className="pw-form"
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
        <p role="status" className="pw-hint">
          Solo lectura. El atleta debe permitirte editar su entrenamiento para guardar cambios.
        </p>
      )}
      <fieldset disabled={!canEdit || save.isPending} className="pw-grid">
        <div className="pw-main">
          <section className="card pw-card" aria-labelledby="pw-tm-title">
            <h3 id="pw-tm-title">Máximos de entrenamiento (TM)</h3>
            <div className="pw-tm">
              {POWER_LIFTS.map((lift) => (
                <label key={lift} className="pw-tm-field">
                  <span>{POWER_LABELS[lift]} (kg)</span>
                  <span className="pw-tm-input">
                    <input
                      type="number"
                      min="0.01"
                      max="1500"
                      step="0.01"
                      placeholder="—"
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
                    <span aria-hidden="true">kg</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="pw-hint">
              Referencia en kg elegida por ti para programar cargas. Puede diferir del 1RM real y de
              su estimación. Deja vacío lo que aún no tengas definido.
            </p>
          </section>
          <section className="card pw-card" aria-label="Marcas">
            {profile.marks.length > 0 && (
              <dl className="pw-best">
                {best.map(({ lift, kg }) => (
                  <div key={lift}>
                    <dt>Mejor {POWER_LABELS[lift].toLocaleLowerCase('es')}</dt>
                    <dd>{kg ? `${kg.toLocaleString('es')} kg` : '—'}</dd>
                  </div>
                ))}
              </dl>
            )}
            <PowerMarksEditor
              marks={profile.marks}
              readOnly={!canEdit}
              onChange={(marks) => set({ marks })}
            />
          </section>
          <section className="card pw-card pw-mappings">
            <PowerExerciseMappings
              linkId={saved.linkId}
              value={profile.exerciseMappings ?? []}
              onChange={(exerciseMappings) => set({ exerciseMappings })}
            />
          </section>
        </div>
        <aside className="pw-side">
          <section className="card pw-card" aria-labelledby="pw-spec-title">
            <h3 id="pw-spec-title">Especialización</h3>
            <label className="pw-check">
              <input
                type="checkbox"
                checked={profile.enabled}
                onChange={(e) => set({ enabled: e.target.checked })}
              />
              Especialización en powerlifting activa
            </label>
            {!profile.enabled && (
              <p className="pw-hint">
                Actívala cuando trabajéis esta especialidad. Desactivarla conserva el perfil y las
                marcas.
              </p>
            )}
            <label className="pw-field">
              Equipamiento
              <Select
                className="form-input min-h-11"
                value={profile.equipment}
                onChange={(e) => set({ equipment: e.target.value as PowerProfile['equipment'] })}
              >
                <option value="CLASSIC">Clásico / raw</option>
                <option value="EQUIPPED">Equipado</option>
                <option value="OTHER">Otro</option>
              </Select>
            </label>
            <label className="pw-field">
              Federación de referencia (opcional)
              <input
                className="form-input min-h-11"
                maxLength={100}
                value={profile.federation}
                onChange={(e) => set({ federation: e.target.value })}
              />
            </label>
          </section>
          <section className="card pw-card">
            <label className="pw-field">
              Notas de entrenamiento
              <textarea
                className="form-input"
                rows={5}
                maxLength={2000}
                value={profile.notes}
                onChange={(e) => set({ notes: e.target.value })}
              />
            </label>
          </section>
        </aside>
      </fieldset>
      {(canEdit || stale || error) && (
        <div className="pw-save">
          {canEdit && draft.notice && (
            <p role="status" className="pw-hint">
              {draft.notice}
            </p>
          )}
          {stale && (
            <p role="alert">
              Existe una versión más reciente. Tu borrador sigue disponible; revisa tus cambios
              antes de descartarlo y cargar la versión guardada.
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
            <div className="pw-save-actions">
              <span className="pw-hint">
                {draft.dirty ? 'Tienes cambios sin guardar.' : 'Sin cambios pendientes.'}
              </span>
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
              <button
                className="btn btn-primary"
                disabled={save.isPending || stale || !draft.dirty}
              >
                {save.isPending ? 'Guardando…' : 'Guardar perfil de powerlifting'}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
