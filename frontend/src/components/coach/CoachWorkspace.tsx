import { useState, type ReactNode } from 'react';
import { UserPlus } from 'lucide-react';
import { useCoachProfile } from '../../lib/coach/api';
import { ActivateCoach } from './ActivateCoach';
import { InviteDialog } from './CoachInvitations';
import { QueryErrorNotice } from '../QueryErrorNotice';
import '../../styles/coach-workspace.css';

export function CoachWorkspace({ children }: { children: ReactNode }) {
  const profile = useCoachProfile();
  if (profile.isPending) return <p role="status">Cargando tu espacio de entrenador…</p>;
  if (profile.isError)
    return <QueryErrorNotice retry={() => void profile.refetch()} pending={profile.isFetching} />;
  if (!profile.data?.coach) return <ActivateCoach />;
  return <div className="fade-in coach-page coach-workspace">{children}</div>;
}

export function CoachPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="coach-page-heading">
      <div>
        <p className="coach-eyebrow">Espacio de entrenador</p>
        <h1>{title}</h1>
        <p className="coach-description">{description}</p>
      </div>
      {children}
    </header>
  );
}

export function InviteClientButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        data-tour="invite-client"
        className="btn btn-primary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <UserPlus size={16} aria-hidden /> Invitar alumno
      </button>
      <InviteDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
