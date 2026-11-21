import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { apiErrorMessage, formatCoachDate } from '../../lib/coach/api';
import {
  isPowerMeet,
  useSavePowerMeet,
  type MeetContent,
  type PowerMeet,
} from '../../lib/coach/powerMeets';
import { PowerAttemptsEditor } from './PowerAttemptsEditor';
import { PowerBlocksEditor } from './PowerBlocksEditor';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

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
      className="pw-form"
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
      <h3 className="pw-meet-title">{saved.id ? saved.content.name : 'Nueva competición'}</h3>
      {!canEdit && <p>Solo lectura con los permisos actuales de entrenamiento.</p>}
      <nav aria-label="Vista de la competición" className="pw-meet-views">
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
      <fieldset disabled={!canEdit || save.isPending} className="pw-meet-body">
        {view === 'PREP' && (
          <>
            <section className="card pw-card pw-meet-data">
              <h4>Datos de la competición</h4>
              <div className="pw-meet-fields">
                <label className="pw-field">
                  Nombre de la competición
                  <input
                    className="form-input min-h-11"
                    required
                    maxLength={120}
                    value={content.name}
                    onChange={(e) => set({ name: e.target.value })}
                  />
                </label>
                <label className="pw-field">
                  Fecha de competición
                  <DatePicker
                    className="form-input min-h-11"
                    required
                    value={content.date}
                    onChange={(date) => set({ date })}
                  />
                </label>
                <label className="pw-field">
                  Equipamiento
                  <Select
                    className="form-input min-h-11"
                    value={content.equipment}
                    onChange={(e) => set({ equipment: e.target.value as MeetContent['equipment'] })}
                  >
                    <option value="CLASSIC">Clásico / raw</option>
                    <option value="EQUIPPED">Equipado</option>
                    <option value="OTHER">Otro</option>
                  </Select>
                </label>
                <label className="pw-field">
                  Federación
                  <input
                    className="form-input min-h-11"
                    maxLength={100}
                    value={content.federation}
                    onChange={(e) => set({ federation: e.target.value })}
                  />
                </label>
                <label className="pw-field">
                  Categoría (opcional)
                  <input
                    className="form-input min-h-11"
                    maxLength={80}
                    value={content.category}
                    onChange={(e) => set({ category: e.target.value })}
                  />
                </label>
                <label className="pw-field">
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
                <label className="pw-field">
                  Referencia de reglas
                  <Select
                    className="form-input min-h-11"
                    value={content.rules}
                    onChange={(e) => set({ rules: e.target.value as MeetContent['rules'] })}
                  >
                    <option value="CUSTOM">Reglas de la organización</option>
                    <option value="IPF_2026">IPF · marzo de 2026</option>
                  </Select>
                </label>
              </div>
              {content.rules === 'IPF_2026' && (
                <p className="pw-hint">
                  Avisos orientativos sobre incrementos; no validan inscripción, récords ni
                  decisiones arbitrales.{' '}
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
            </section>
            <PowerBlocksEditor
              linkId={saved.linkId}
              blocks={content.blocks}
              date={content.date}
              canEdit={canEdit}
              onChange={(blocks) => set({ blocks })}
            />
            <section className="card pw-card">
              <label className="pw-field">
                Notas de competición
                <textarea
                  className="form-input"
                  rows={3}
                  maxLength={2000}
                  value={content.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                />
              </label>
              <label className="pw-check">
                <input
                  type="checkbox"
                  checked={content.archived}
                  onChange={(e) => set({ archived: e.target.checked })}
                />
                Archivar competición conservando los resultados
              </label>
            </section>
          </>
        )}
        {view === 'DAY' && (
          <>
            <p className="pw-hint">
              {formatCoachDate(content.date)} · {content.category || 'Sin categoría'} ·{' '}
              {{ CLASSIC: 'Clásico / raw', EQUIPPED: 'Equipado', OTHER: 'Otro' }[content.equipment]}
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
        <div className="pw-save pw-save-actions">
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
