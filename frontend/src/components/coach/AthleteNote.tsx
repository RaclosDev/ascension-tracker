import { useState } from 'react';
import { Pin } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage, type CoachClient } from '../../lib/coach/api';
import { useSaveCoachNotes } from '../../lib/coach/setup';
import { undoToast } from './undoToast';

export const NOTE_MAX = 600;

/** The coach's pinned note about one athlete. It rides in the header of every view and is never shared. */
export function AthleteNote({
  link,
  onShow,
}: {
  link: CoachClient;
  /** Opens the full note beside the rail. */
  onShow?: (trigger: HTMLElement) => void;
}) {
  const save = useSaveCoachNotes(link.linkId);
  const note = link.notes?.pinnedNote ?? '';
  const [draft, setDraft] = useState<string | null>(null);
  const store = (text: string) =>
    save.mutate(
      { pinnedNote: text.trim() || null, avoidedExercises: link.notes?.avoidedExercises ?? [] },
      {
        onSuccess: () => {
          setDraft(null);
          if (text.trim() || !note) toast.success('Nota fijada');
          else undoToast('Nota quitada', () => store(note));
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar la nota')),
      },
    );

  if (draft != null)
    return (
      <form
        className="athlete-note athlete-note-form"
        onSubmit={(e) => {
          e.preventDefault();
          store(draft);
        }}
      >
        <label htmlFor="athlete-note-text">Nota fijada (solo la ves tú)</label>
        <textarea
          id="athlete-note-text"
          className="form-input"
          rows={3}
          maxLength={NOTE_MAX}
          autoFocus
          value={draft}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            setDraft(null);
          }}
          placeholder="Lesiones, material, lo que no debes olvidar al pautar…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="athlete-note-actions">
          <span className="athlete-note-count">
            {draft.length}/{NOTE_MAX}
          </span>
          {note && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={save.isPending}
              onClick={() => store('')}
            >
              Quitar nota
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setDraft(null)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={save.isPending}>
            {save.isPending ? 'Guardando…' : 'Guardar nota'}
          </button>
        </div>
      </form>
    );

  if (!note)
    return (
      <button
        type="button"
        className="btn btn-secondary athlete-pin"
        aria-label="Fijar una nota"
        title="Fijar una nota sobre este atleta"
        onClick={() => setDraft('')}
      >
        <Pin size={15} aria-hidden /> Nota
      </button>
    );

  return (
    <div className="athlete-note">
      <Pin size={15} aria-hidden />
      {onShow ? (
        <button
          type="button"
          className="athlete-note-text"
          aria-haspopup="dialog"
          title="Leer la nota completa"
          onClick={(e) => onShow(e.currentTarget)}
        >
          <span className="sr-only">Nota fijada: </span>
          {note}
        </button>
      ) : (
        <p title={note}>
          <span className="sr-only">Nota fijada: </span>
          {note}
        </p>
      )}
      <button type="button" className="athlete-note-edit" onClick={() => setDraft(note)}>
        Editar
      </button>
    </div>
  );
}
