import { confirmAction } from '../lib/confirmation';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { useSessionDraft } from '../hooks/useSessionDraft';
import { apiErrorMessage, personName, useCoachClient } from '../lib/coach/api';
import { useAdaptProgram, useAssignedProgram, type Program } from '../lib/coach/coachPrograms';
import { ProgramEditor } from './CoachProgramEditorPage';

const isDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export default function CoachProgramAdaptPage() {
  const { linkId = '', assignmentId = '' } = useParams();
  const client = useCoachClient(linkId);
  const program = useAssignedProgram(linkId, assignmentId);
  const publish = useAdaptProgram(linkId, assignmentId);
  const [dateError, setDateError] = useState<string | null>(null);
  const date = useSessionDraft(
    `adapt-date:${linkId}:${assignmentId}`,
    format(new Date(), 'yyyy-MM-dd'),
    isDate,
  );
  const returnTo = `/entrenador/atletas/${encodeURIComponent(linkId)}?seccion=entrenamiento`;
  const allowed = client.data?.permissions.training && client.data.permissions.editTraining;

  if (client.isPending || program.isPending)
    return <p role="status">Cargando programa del atleta…</p>;
  if (client.isError || program.isError || !client.data || !program.data || !allowed) {
    return (
      <section className="card">
        <h1>Adaptación no disponible</h1>
        <p role="alert">
          {!allowed && client.data
            ? 'Necesitas permiso para pautar entrenamiento.'
            : apiErrorMessage(client.error ?? program.error, 'No se pudo cargar el programa.')}
        </p>
        {(client.isError || program.isError) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              void client.refetch();
              void program.refetch();
            }}
          >
            Reintentar
          </button>
        )}
        <Link to={returnTo} className="btn btn-secondary">
          Volver al atleta
        </Link>
      </section>
    );
  }

  const submit = async (adapted: Program) => {
    if (
      !isDate(date.value) ||
      date.value < format(new Date(), 'yyyy-MM-dd') ||
      date.value > format(addDays(new Date(), 365), 'yyyy-MM-dd')
    ) {
      setDateError('Elige una fecha entre hoy y los próximos 365 días.');
      return false;
    }
    setDateError(null);
    if (
      !(await confirmAction({
        title: 'Publicar adaptación',
        description: `¿Publicar solo para ${personName(client.data.client)} a partir del ${date.value}? Su programa actual continúa hasta esa fecha. Si ya hay una versión para ese día, se sustituirá. Se conserva el historial.`,
        confirmLabel: 'Publicar adaptación',
        destructive: false,
      }))
    )
      return false;
    await publish.mutateAsync({ program: adapted, startDate: date.value });
    date.clear();
    return true;
  };

  return (
    <ProgramEditor
      key={program.data.id}
      initial={program.data}
      publication={{
        returnTo,
        clientName: personName(client.data.client),
        pending: publish.isPending,
        publish: submit,
        controls: (
          <>
            <label className="coach-schedule-field flex flex-col gap-1 mt-3 max-w-sm">
              Empieza la nueva versión el
              <input
                type="date"
                className="min-h-11"
                min={format(new Date(), 'yyyy-MM-dd')}
                max={format(addDays(new Date(), 365), 'yyyy-MM-dd')}
                value={date.value}
                disabled={publish.isPending}
                aria-invalid={!!dateError}
                aria-describedby={dateError ? 'adapt-date-error' : undefined}
                onChange={(event) => {
                  date.setValue(event.target.value);
                  setDateError(null);
                }}
              />
            </label>
            {dateError && (
              <p role="alert" id="adapt-date-error">
                {dateError}
              </p>
            )}
            {date.notice && (
              <p role="status" className="text-sm mt-2">
                Fecha: {date.notice}
              </p>
            )}
          </>
        ),
      }}
    />
  );
}
