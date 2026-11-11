import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { apiErrorMessage } from '../../lib/coach/api';
import {
  isPowerMeet,
  useSavePowerMeet,
  type MeetContent,
  type PowerMeet,
} from '../../lib/coach/powerMeets';
import { PowerAttemptsEditor } from './PowerAttemptsEditor';
import { PowerBlocksEditor } from './PowerBlocksEditor';

export function PowerMeetForm({
  saved,
  canEdit,
  reload,
  onSaved,
}: {
  saved: PowerMeet;
  canEdit: boolean;
  reload: () => void;
  onSaved: (id: string) => void;
}) {
  const draft = useSessionDraft(
    `power-meet:${saved.linkId}:${saved.id || 'new'}`,
    saved,
    isPowerMeet,
  );
  const save = useSavePowerMeet(saved.linkId);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'PREP' | 'DAY'>('PREP');
  const value = canEdit ? draft.value : saved;
  const content = value.content;
  const stale = value.version !== saved.version;
  const set = (patch: Partial<MeetContent>) =>
    draft.setValue({ ...value, content: { ...content, ...patch } });
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canEdit || stale || save.isPending) return;
        setError(null);
        save.mutate(value, {
          onSuccess: (result) => {
            draft.clear();
            onSaved(result.id);
            toast.success('Competición guardada');
          },
          onError: (cause) =>
            setError(
              apiErrorMessage(cause, 'No se pudo guardar la competición. Conservamos tu borrador.'),
            ),
        });
      }}
    >
      <h3 className="text-xl font-semibold">
        {saved.id ? saved.content.name : 'Nueva competición'}
      </h3>
      {!canEdit && <p>Solo lectura con los permisos actuales de entrenamiento.</p>}
      <nav aria-label="Vista de la competición" className="flex gap-2">
        <button
          type="button"
          className={`btn ${view === 'PREP' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={view === 'PREP'}
          onClick={() => setView('PREP')}
        >
          Preparación
        </button>
        <button
          type="button"
          className={`btn ${view === 'DAY' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={view === 'DAY'}
          disabled={!content.name.trim() || !content.date}
          onClick={() => setView('DAY')}
        >
          Día de competición
        </button>
      </nav>
      <fieldset disabled={!canEdit || save.isPending} className="flex flex-col gap-6 min-w-0">
        {view === 'PREP' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                Nombre de la competición
                <input
                  className="form-input min-h-11"
                  required
                  maxLength={120}
                  value={content.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                Fecha de competición
                <input
                  className="form-input min-h-11"
                  type="date"
                  required
                  value={content.date}
                  onChange={(e) => set({ date: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                Equipamiento
                <select
                  className="form-input min-h-11"
                  value={content.equipment}
                  onChange={(e) => set({ equipment: e.target.value as MeetContent['equipment'] })}
                >
                  <option value="CLASSIC">Clásico / raw</option>
                  <option value="EQUIPPED">Equipado</option>
                  <option value="OTHER">Otro</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                Federación
                <input
                  className="form-input min-h-11"
                  maxLength={100}
                  value={content.federation}
                  onChange={(e) => set({ federation: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                Categoría (opcional)
                <input
                  className="form-input min-h-11"
                  maxLength={80}
                  value={content.category}
                  onChange={(e) => set({ category: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                Objetivo de total (kg)
                <input
                  className="form-input min-h-11"
                  type="number"
                  min="0.01"
                  max="4500"
                  step="0.01"
                  value={content.targetTotal ?? ''}
                  onChange={(e) =>
                    set({ targetTotal: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                Referencia de reglas
                <select
                  className="form-input min-h-11"
                  value={content.rules}
                  onChange={(e) => set({ rules: e.target.value as MeetContent['rules'] })}
                >
                  <option value="CUSTOM">Reglas de la organización</option>
                  <option value="IPF_2026">IPF · marzo de 2026</option>
                </select>
              </label>
            </div>
            {content.rules === 'IPF_2026' && (
              <p className="coach-description">
                Avisos orientativos sobre incrementos; no validan inscripción, récords ni decisiones
                arbitrales.{' '}
                <a
                  className="underline"
                  href="https://www.powerlifting.sport/fileadmin/ipf/data/rules/technical-rules/english/2026_IPF_Technical_Rulebook__effective_01_March_2026__v3.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  Consultar reglamento IPF 2026 (PDF)
                </a>
                .
              </p>
            )}
            <PowerBlocksEditor
              linkId={saved.linkId}
              blocks={content.blocks}
              date={content.date}
              canEdit={canEdit}
              onChange={(blocks) => set({ blocks })}
            />
            <label className="flex flex-col gap-1">
              Notas de competición
              <textarea
                className="form-input"
                rows={3}
                maxLength={2000}
                value={content.notes}
                onChange={(e) => set({ notes: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 min-h-11">
              <input
                type="checkbox"
                checked={content.archived}
                onChange={(e) => set({ archived: e.target.checked })}
              />
              Archivar competición conservando los resultados
            </label>
          </>
        )}
        {view === 'DAY' && (
          <>
            <p>
              {content.date} · {content.category || 'Sin categoría'} · {content.equipment}
            </p>
            <PowerAttemptsEditor
              attempts={content.attempts}
              rules={content.rules}
              onChange={(attempts) => set({ attempts })}
            />
          </>
        )}
      </fieldset>
      {canEdit && draft.notice && (
        <p role="status" className="coach-description">
          {draft.notice}
        </p>
      )}
      {stale && (
        <p role="alert">
          La competición tiene una versión más reciente. Conservamos tu borrador para que puedas
          revisarlo antes de descartarlo.
        </p>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary mt-2" onClick={reload}>
            Consultar competición guardada
          </button>
        </div>
      )}
      {canEdit && (
        <div
          className="card sticky bottom-3 z-10 flex flex-wrap gap-3"
          style={{ background: 'var(--bg-card)' }}
        >
          <button className="btn btn-primary" disabled={save.isPending || stale || !draft.dirty}>
            {save.isPending ? 'Guardando…' : 'Guardar competición'}
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
              Descartar borrador de competición
            </button>
          )}
        </div>
      )}
    </form>
  );
}
