import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { getConfirmation, settleConfirmation, subscribeConfirmation } from '../../lib/confirmation';

export function ConfirmationDialog({ scope }: { scope?: string }) {
  const request = useSyncExternalStore(subscribeConfirmation, getConfirmation, () => null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Navigation, logout and unmount cancel an unanswered request instead of applying it later.
  useEffect(() => () => settleConfirmation(false), [scope]);

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) settleConfirmation(false);
      }}
    >
      {request && (
        <DialogContent
          className="overflow-y-auto"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            request.trigger?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{request.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {request.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              ref={cancelRef}
              type="button"
              className="btn btn-secondary"
              onClick={() => settleConfirmation(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={request.destructive ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={() => settleConfirmation(true)}
            >
              {request.confirmLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
