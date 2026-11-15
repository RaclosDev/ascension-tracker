import { useState, type ReactNode } from 'react';
import { UserPlus } from 'lucide-react';
import { useCoachProfile } from '../../lib/coach/api';
import { ActivateCoach } from './ActivateCoach';
import { InviteDialog } from './CoachInvitations';
import { QueryErrorNotice } from '../QueryErrorNotice';
import '../../styles/coach-workspace.css';

export function CoachWorkspace({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const profile = useCoachProfile();
  if (profile.isPending) return <p role="status">Cargando tu espacio de entrenador…</p>;
  if (profile.isError)
    return <QueryErrorNotice retry={() => void profile.refetch()} pending={profile.isFetching} />;
  if (!profile.data?.coach) return <ActivateCoach />;
  return <div className={`fade-in coach-page coach-workspace ${className}`}>{children}</div>;
}

export function CoachPageHeader({
  title,
  description,
  children,
  level = 1,
}: {
  title: string;
  /** Use 2 when the page already has its own h1, e.g. inside the athlete workspace. */
  level?: 1 | 2;
  description?: string;
  children?: ReactNode;
}) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <header className="coach-page-heading">
      <div>
        <Heading>{title}</Heading>
        {description && <p className="coach-description">{description}</p>}
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
        <UserPlus size={16} aria-hidden /> Invitar atleta
      </button>
      <InviteDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
