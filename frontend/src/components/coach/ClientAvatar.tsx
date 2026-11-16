import { useState } from 'react';
import { personName, type CoachPerson } from '../../lib/coach/api';

export function ClientAvatar({ client }: { client: CoachPerson }) {
  const [failedPicture, setFailedPicture] = useState<string | null>(null);
  const initials = personName(client)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('es');

  return (
    <span className="coach-client-avatar" aria-hidden="true">
      {client.picture && client.picture !== failedPicture ? (
        <img
          src={client.picture}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedPicture(client.picture)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
