import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Fingerprint, Trash2 } from 'lucide-react';
import { addPasskeyOnThisDevice, deletePasskey, listPasskeys } from '../../auth/accountAccess';
import { apiErrorMessage } from '../../lib/coach/api';
import { isDuplicatePasskey, isPasskeyCancel, passkeysSupported } from '../../utils/webauthn';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { Button } from '../ui/button';

const PASSKEYS_KEY = ['passkeys'] as const;

const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });

/** Passkeys of the account: sign in with the fingerprint, face or PIN of each device. */
export function PasskeysCard() {
  const queryClient = useQueryClient();
  const passkeys = useQuery({ queryKey: PASSKEYS_KEY, queryFn: listPasskeys });
  const supported = passkeysSupported();

  const add = useMutation({
    mutationFn: addPasskeyOnThisDevice,
    onSuccess: () => {
      toast.success('Llave de acceso guardada');
      void queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY });
    },
    onError: (err) => {
      if (isPasskeyCancel(err)) return;
      toast.error(
        isDuplicatePasskey(err)
          ? 'Este dispositivo ya tiene una llave de esta cuenta.'
          : apiErrorMessage(err, 'No se ha podido guardar la llave de acceso.'),
      );
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deletePasskey(id),
    onSuccess: () => {
      toast.success('Llave de acceso borrada');
      void queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY });
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se ha podido borrar la llave.')),
  });

  return (
    <div
      className="card mb-4"
      style={{ padding: 'var(--space-lg)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Fingerprint size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        <h2 className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Llaves de acceso
        </h2>
      </div>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Entra con la huella, la cara o el PIN del dispositivo, sin contraseña.
      </p>
      {passkeys.isError && (
        <QueryErrorNotice retry={passkeys.refetch} pending={passkeys.isFetching} />
      )}
      {passkeys.data && passkeys.data.length > 0 && (
        <ul className="flex flex-col gap-2 mb-3">
          {passkeys.data.map((passkey) => (
            <li key={passkey.id} className="flex items-center justify-between gap-3">
              <span>
                <span className="font-bold">{passkey.name}</span>
                <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Creada el {dateFormat.format(new Date(passkey.createdAt))}
                  {passkey.lastUsedAt &&
                    ` · usada el ${dateFormat.format(new Date(passkey.lastUsedAt))}`}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Borrar la llave ${passkey.name}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(passkey.id)}
              >
                <Trash2 size={18} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {supported ? (
        <Button
          type="button"
          variant="outline"
          disabled={add.isPending}
          onClick={() => add.mutate()}
        >
          {add.isPending ? 'Esperando al dispositivo…' : 'Añadir llave en este dispositivo'}
        </Button>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Este navegador no admite llaves de acceso.
        </p>
      )}
    </div>
  );
}
