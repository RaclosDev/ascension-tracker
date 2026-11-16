import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiErrorMessage, type CoachClient } from '../../lib/coach/api';
import { emptySetup, serviceNames, useSaveCoachSetup } from '../../lib/coach/setup';
import { CoachSetupFields } from './CoachSetupFields';

export function ClientSetupForm({ link }: { link: CoachClient }) {
  const [value, setValue] = useState(() => link.setup ?? emptySetup());
  const save = useSaveCoachSetup(link.linkId);
  return (
    <section className="card">
      <h2>Servicio e incorporación</h2>
      {!link.setup && (
        <p className="coach-description mb-4">
          Por configurar. Confirma qué habéis acordado antes de activar el seguimiento.
        </p>
      )}
      <form
        className="flex flex-col gap-4 mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(value, {
            onSuccess: () => toast.success('Servicio guardado'),
            onError: (error) =>
              toast.error(apiErrorMessage(error, 'No se pudo guardar el servicio')),
          });
        }}
      >
        <CoachSetupFields value={value} onChange={setValue} />
        <label className="flex items-start gap-3 min-h-10 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={value.reviewed}
            onChange={(e) => setValue({ ...value, reviewed: e.target.checked })}
          />
          He revisado con el atleta su objetivo, disponibilidad y datos iniciales.
        </label>
        {!Object.values(value.services).some(Boolean) && (
          <p role="alert">Elige al menos un servicio.</p>
        )}
        <div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={save.isPending || !Object.values(value.services).some(Boolean)}
          >
            {save.isPending ? 'Guardando…' : 'Guardar servicio'}
          </button>
        </div>
      </form>
    </section>
  );
}

export function ClientSetupSummary({ link, href }: { link: CoachClient; href: string }) {
  const setup = link.setup;
  const missing = setup
    ? [
        setup.services.training && !link.permissions.training && 'entrenamiento',
        setup.services.nutrition && !link.permissions.nutrition && 'nutrición',
        setup.services.progress && !link.permissions.body && 'seguimiento corporal',
      ].filter(Boolean)
    : [];
  return (
    <section className="card mb-4">
      <h2>{setup ? 'Servicio acordado' : 'Servicio por configurar'}</h2>
      {setup ? (
        <>
          <p className="mt-2 font-semibold">{serviceNames(setup)}</p>
          {setup.goal && <p className="coach-description mt-2 whitespace-pre-wrap">{setup.goal}</p>}
          <p className="coach-description mt-2">
            {setup.reviewed
              ? 'Datos iniciales revisados.'
              : 'Incorporación pendiente: revisa los datos iniciales con el atleta.'}
          </p>
          {missing.length > 0 && (
            <p className="coach-description mt-2">
              Falta autorización para {missing.join(' y ')}. El atleta puede concederla desde sus
              ajustes.
            </p>
          )}
        </>
      ) : (
        <p className="coach-description mt-2">
          Indica qué servicios habéis acordado. Los permisos actuales se conservan.
        </p>
      )}
      <Link className="btn btn-secondary mt-4" to={href}>
        {setup ? 'Revisar incorporación' : 'Configurar servicio'}
      </Link>
    </section>
  );
}
