import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { meetTotals, usePowerMeets } from '../../lib/coach/powerMeets';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { PowerMarksEditor } from './PowerMarksEditor';
import { PowerMeets } from './PowerMeets';
import { PowerProgress } from './PowerProgress';
import { PowerExerciseMappings } from './PowerExerciseMappings';
import { Select } from '@/components/ui/select';
import '../../styles/coach-powerlifting.css';

// Cada apartado en su sitio, con un menú como el de los ajustes del atleta.
const VIEWS = [
  ['resumen', 'Resumen'],
  ['marcas', 'Marcas'],
  ['seguimiento', 'Seguimiento S/B/D'],
  ['competiciones', 'Competiciones'],
  ['ajustes', 'Ajustes'],
] as const;
type View = (typeof VIEWS)[number][0];
type FormView = Extract<View, 'resumen' | 'marcas' | 'ajustes'>;

export default function ClientPowerlifting({
  linkId,
  canEdit,
}: {
  linkId: string;
  canEdit: boolean;
}) {
  const query = usePowerProfile(linkId);
  const [params] = useSearchParams();
  const view: View = VIEWS.find(([id]) => id === params.get('vista'))?.[0] ?? 'resumen';
  const href = (id: View) => {
    const next = new URLSearchParams(params);
    next.set('vista', id);
    next.delete('competicion');
    return `?${next}`;
  };
  return (
    <section className="pw athlete-manage" aria-labelledby="pw-title">
      <h2 id="pw-title" className="sr-only">
        Powerlifting
      </h2>
      <nav className="athlete-manage-tabs" aria-label="Apartados de powerlifting">
        {VIEWS.map(([id, label]) => (
          <Link key={id} to={href(id)} replace aria-current={id === view ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="athlete-manage-panel pw-panel">
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
            view={view}
            saved={query.data}
            canEdit={canEdit}
            reload={() => void query.refetch()}
            marksHref={href('marcas')}
            meetsHref={href('competiciones')}
          />
        )}
      </div>
    </section>
  );
}

function PowerForm({
  view,
  saved,
  canEdit,
  reload,
  marksHref,
  meetsHref,
}: {
  view: FormView;
  saved: SavedPowerProfile;
  canEdit: boolean;
  reload: () => void;
  marksHref: string;
  meetsHref: string;
}) {
  // El borrador vive en la sesión, así que cambiar de apartado no pierde lo escrito.
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
      <fieldset disabled={!canEdit || save.isPending} className="pw-body">
        {view === 'resumen' && (
          <PowerSummary
            linkId={saved.linkId}
            profile={profile}
            set={set}
            marksHref={marksHref}
            meetsHref={meetsHref}
          />
        )}
        {view === 'marcas' && (
          <section className="card pw-card" aria-label="Marcas">
            <PowerMarksEditor
              marks={profile.marks}
              readOnly={!canEdit}
              onChange={(marks) => set({ marks })}
            />
          </section>
        )}
        {view === 'ajustes' && <PowerSettings linkId={saved.linkId} profile={profile} set={set} />}
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
                  Descartar cambios
                </button>
              )}
              <button
                className="btn btn-primary"
                disabled={save.isPending || stale || !draft.dirty}
              >
                {save.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function PowerSummary({
  linkId,
  profile,
  set,
  marksHref,
  meetsHref,
}: {
  linkId: string;
  profile: PowerProfile;
  set: (patch: Partial<PowerProfile>) => void;
  marksHref: string;
  meetsHref: string;
}) {
  const meets = usePowerMeets(linkId);
  const today = new Date().toLocaleDateString('sv-SE');
  const next = (meets.data ?? [])
    .filter((m) => !m.content.archived && m.content.date >= today)
    .sort((a, b) => a.content.date.localeCompare(b.content.date))[0];
  const days = next
    ? Math.round(
        (new Date(`${next.content.date}T12:00:00`).getTime() -
          new Date(`${today}T12:00:00`).getTime()) /
          86400000,
      )
    : 0;
  const planned = next ? meetTotals(next.content.attempts).planned : null;
  return (
    <div className="pw-summary">
      <section className="card pw-card pw-summary-tm" aria-labelledby="pw-tm-title">
        <h3 id="pw-tm-title">Máximos de entrenamiento (TM)</h3>
        <div className="pw-tm">
          {POWER_LIFTS.map((lift) => (
            <label key={lift} className="pw-tm-field">
              <span>{POWER_LABELS[lift]}</span>
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
          La referencia con la que programas las cargas. Puede no coincidir con el 1RM real.
        </p>
      </section>
      <section className="card pw-card" aria-labelledby="pw-best-title">
        <div className="pw-card-head">
          <h3 id="pw-best-title">Mejores marcas</h3>
          <Link className="pw-link" to={marksHref} replace>
            {profile.marks.length
              ? `Ver las ${profile.marks.length} marcas`
              : 'Anotar la primera marca'}
          </Link>
        </div>
        <dl className="pw-best">
          {POWER_LIFTS.map((lift) => {
            const best = profile.marks
              .filter((m) => m.lift === lift && m.kg > 0)
              .sort((a, b) => b.kg - a.kg || b.date.localeCompare(a.date))[0];
            return (
              <div key={lift}>
                <dt>{POWER_LABELS[lift]}</dt>
                <dd>{best ? `${best.kg.toLocaleString('es')} kg` : '—'}</dd>
                <dd className="pw-best-meta">
                  {best
                    ? `${shortDate(best.date)} · ${best.context === 'COMPETITION' ? 'competición' : 'entreno'}`
                    : 'Sin marcas'}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
      <section className="card pw-card" aria-labelledby="pw-next-title">
        <div className="pw-card-head">
          <h3 id="pw-next-title">Próxima competición</h3>
          <Link className="pw-link" to={meetsHref} replace>
            Ver competiciones
          </Link>
        </div>
        {meets.isPending ? (
          <p className="pw-hint">Cargando…</p>
        ) : next ? (
          <div className="pw-next">
            <strong>{next.content.name}</strong>
            <span>
              {shortDate(next.content.date)} ·{' '}
              {days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`}
            </span>
            <span className="pw-hint">
              {next.content.targetTotal
                ? `Objetivo de total: ${next.content.targetTotal} kg`
                : 'Sin total objetivo'}
              {planned ? ` · Intentos previstos: ${planned} kg` : ''}
            </span>
          </div>
        ) : (
          <p className="pw-empty">No hay ninguna competición próxima.</p>
        )}
      </section>
    </div>
  );
}

function PowerSettings({
  linkId,
  profile,
  set,
}: {
  linkId: string;
  profile: PowerProfile;
  set: (patch: Partial<PowerProfile>) => void;
}) {
  return (
    <div className="pw-settings">
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
        <p className="pw-hint">
          Al desactivarla, Powerlifting desaparece del menú del atleta; el perfil y las marcas se
          conservan.
        </p>
        <div className="pw-settings-fields">
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
        </div>
      </section>
      <section className="card pw-card">
        <label className="pw-field">
          Notas de entrenamiento
          <textarea
            className="form-input"
            rows={4}
            maxLength={2000}
            value={profile.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </label>
      </section>
      <section className="card pw-card pw-mappings">
        <PowerExerciseMappings
          linkId={linkId}
          value={profile.exerciseMappings ?? []}
          onChange={(exerciseMappings) => set({ exerciseMappings })}
        />
      </section>
    </div>
  );
}
