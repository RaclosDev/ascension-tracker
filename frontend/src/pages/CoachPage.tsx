import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList, Copy, Link2, Trash2, UserMinus, Users } from 'lucide-react';
import {
  apiErrorMessage,
  formatCoachDate,
  invitationUrl,
  personName,
  sharedScopes,
  useActivateCoach,
  useCoachClients,
  useCoachInvitations,
  useCoachProfile,
  useCreateInvitation,
  useEndClient,
  useRevokeInvitation,
} from '../lib/coach/api';

export default function CoachPage() {
  const profile = useCoachProfile();
  const isCoach = profile.data?.coach === true;

  return (
    <div className="fade-in max-w-5xl mx-auto px-4 pt-2 sm:pt-4">
      <header className="mb-6 pb-2 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Modo entrenador</h1>
      </header>
      {profile.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {profile.isError && <p role="alert">No se pudo cargar tu perfil de entrenador.</p>}
      {profile.data && !isCoach && <ActivateCoach />}
      {isCoach && (
        <div className="flex flex-col gap-6">
          <Invitations />
          <Clients />
          <ProgramsLink />
        </div>
      )}
    </div>
  );
}

function ActivateCoach() {
  const activate = useActivateCoach();
  return (
    <section className="card">
      <h2 className="card-title">Lleva a tus alumnos desde Ascension</h2>
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Invita a tus alumnos con un enlace. Cada alumno elige qué te comparte (cuerpo, entrenamiento
        o nutrición) y puede cambiarlo o terminar la relación cuando quiera. Tu cuenta personal
        sigue igual.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={activate.isPending}
        onClick={() =>
          activate.mutate(undefined, {
            onError: (e) =>
              toast.error(apiErrorMessage(e, 'No se pudo activar el modo entrenador')),
          })
        }
      >
        Activar modo entrenador
      </button>
    </section>
  );
}

function Invitations() {
  const invitations = useCoachInvitations(true);
  const create = useCreateInvitation();
  const revoke = useRevokeInvitation();
  const [link, setLink] = useState<string | null>(null);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar; cópialo a mano');
    }
  };

  return (
    <section className="card">
      <h2 className="card-title flex items-center gap-2">
        <Link2 size={18} aria-hidden /> Invitaciones
      </h2>
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Cada enlace sirve para un alumno y caduca a los 7 días. Solo se muestra una vez: cópialo y
        envíalo.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={create.isPending}
        onClick={() =>
          create.mutate(undefined, {
            onSuccess: (created) => setLink(invitationUrl(created.token)),
            onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo crear la invitación')),
          })
        }
      >
        Crear enlace de invitación
      </button>

      {link && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            aria-label="Enlace de invitación"
            value={link}
            className="flex-1 min-w-0 rounded-lg px-3 py-2 bg-black/20 border"
            style={{ borderColor: 'var(--border-subtle)' }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button type="button" className="btn btn-secondary" onClick={() => copy(link)}>
            <Copy size={16} aria-hidden /> Copiar
          </button>
        </div>
      )}

      {invitations.data && invitations.data.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {invitations.data.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-2">
              <span style={{ color: 'var(--text-secondary)' }}>
                Pendiente · caduca el {formatCoachDate(inv.expiresAt)}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                aria-label="Revocar invitación"
                disabled={revoke.isPending}
                onClick={() =>
                  revoke.mutate(inv.id, {
                    onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo revocar')),
                  })
                }
              >
                <Trash2 size={16} aria-hidden /> Revocar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Clients() {
  const clients = useCoachClients(true);
  const end = useEndClient();

  return (
    <section className="card">
      <h2 className="card-title flex items-center gap-2">
        <Users size={18} aria-hidden /> Alumnos
      </h2>
      {clients.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {clients.data?.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Aún no tienes alumnos. Envía un enlace de invitación.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {clients.data?.map((link) => (
          <li key={link.linkId} className="flex items-center justify-between gap-3">
            <Link to={`/entrenador/alumnos/${link.linkId}`} className="min-w-0 flex-1">
              <div className="font-bold text-white truncate">{personName(link.client)}</div>
              <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                {sharedScopes(link.permissions)} · desde {formatCoachDate(link.since)}
              </div>
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              aria-label={`Terminar relación con ${personName(link.client)}`}
              disabled={end.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    `¿Terminar la relación con ${personName(link.client)}? Dejarás de ver sus datos.`,
                  )
                )
                  return;
                end.mutate(link.linkId, {
                  onError: (e) =>
                    toast.error(apiErrorMessage(e, 'No se pudo terminar la relación')),
                });
              }}
            >
              <UserMinus size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProgramsLink() {
  return (
    <section className="card flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="card-title flex items-center gap-2">
          <ClipboardList size={18} aria-hidden /> Programas
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tu biblioteca de programas de entrenamiento, por semanas y días.
        </p>
      </div>
      <Link to="/entrenador/programas" className="btn btn-secondary">
        Abrir
      </Link>
    </section>
  );
}
