import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { peekPendingInvitation, rememberPendingInvitation } from '../../lib/coach/api';

/** Signed out: keep the invitation for after sign-in and show the landing page. */
export function RememberInvitation() {
  const { token = '' } = useParams();
  useEffect(() => rememberPendingInvitation(token), [token]);
  return <Navigate to="/login" replace />;
}

/** Signed in: open the invitation that was pending before sign-in, otherwise the dashboard. */
export function HomeRedirect() {
  const pending = peekPendingInvitation();
  return <Navigate to={pending ? `/invitacion/${pending}` : '/dashboard'} replace />;
}
