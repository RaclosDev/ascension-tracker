import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquareText, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '../../lib/coach/api';
import {
  useCheckinTemplate,
  useSaveCheckinTemplate,
  useResetClientCheckinTemplate,
} from '../../lib/coach/checkins';
import { QueryErrorNotice } from '../QueryErrorNotice';

const MAX_QUESTIONS = 10;

/** The questions every client of this coach answers in the weekly check-in. */
export function CheckinTemplateEditor({ linkId }: { linkId?: string }) {
  const template = useCheckinTemplate(true, linkId);
  const reset = useResetClientCheckinTemplate(linkId ?? '');
  return (
    <section data-tour="checkin-template" className="card">
      <h2 className="card-title flex items-center gap-2">
        <MessageSquareText size={18} aria-hidden /> Check-in semanal
      </h2>
      <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
        {linkId ? (
          'Personaliza las preguntas para este atleta. Las revisiones ya enviadas conservan sus preguntas originales.'
        ) : (
          <>
            Sin personalizar, se añaden preguntas según el servicio de cada atleta. Si guardas estas
            preguntas, serán comunes a todos. Las valoraciones de cumplimiento se piden solo para
            los servicios acordados; los check-ins anteriores conservan sus preguntas.
          </>
        )}
      </p>
      {template.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {template.isError && (
        <QueryErrorNotice retry={() => void template.refetch()} pending={template.isFetching} />
      )}
      {template.data && (
        <Editor
          key={template.data.questions.join('\n')}
          initial={template.data.questions}
          linkId={linkId}
        />
      )}
      {linkId && template.data?.custom && (
        <button
          type="button"
          className="btn btn-secondary mt-2"
          disabled={reset.isPending}
          onClick={() =>
            reset.mutate(undefined, {
              onError: (error) =>
                toast.error(apiErrorMessage(error, 'No se pudieron restaurar las preguntas')),
            })
          }
        >
          Usar preguntas generales
        </button>
      )}
    </section>
  );
}

function Editor({ initial, linkId }: { initial: string[]; linkId?: string }) {
  const save = useSaveCheckinTemplate(linkId);
  const [questions, setQuestions] = useState(initial);
  const valid = questions.every((q) => q.trim()) && questions.length <= MAX_QUESTIONS;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        save.mutate(questions, {
          onSuccess: () => toast.success('Preguntas guardadas'),
          onError: (err) =>
            toast.error(apiErrorMessage(err, 'No se pudieron guardar las preguntas')),
        });
      }}
    >
      {questions.map((q, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="rounded-lg px-3 py-2 bg-black/20 border min-w-0 flex-1"
            style={{ borderColor: 'var(--border-subtle)' }}
            aria-label={`Pregunta ${i + 1}`}
            maxLength={200}
            value={q}
            onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button
            type="button"
            className="btn btn-secondary"
            aria-label={`Quitar pregunta ${i + 1}`}
            onClick={() => setQuestions(questions.filter((_, j) => j !== i))}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={questions.length >= MAX_QUESTIONS}
          onClick={() => setQuestions([...questions, ''])}
        >
          <Plus size={16} aria-hidden /> Añadir pregunta
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid || save.isPending}>
          Guardar preguntas
        </button>
      </div>
    </form>
  );
}
