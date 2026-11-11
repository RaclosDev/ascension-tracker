export interface ConfirmationOptions {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
}

interface PendingConfirmation extends ConfirmationOptions {
  resolve: (accepted: boolean) => void;
  trigger: HTMLElement | null;
}

let pending: PendingConfirmation | null = null;
const listeners = new Set<() => void>();

export function subscribeConfirmation(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getConfirmation = () => pending;

export function settleConfirmation(accepted: boolean) {
  const request = pending;
  if (!request) return;
  pending = null;
  listeners.forEach((listener) => listener());
  request.resolve(accepted);
}

export function confirmAction(options: ConfirmationOptions): Promise<boolean> {
  // A second click must not queue another destructive action behind the first dialog.
  if (pending || listeners.size === 0) return Promise.resolve(false);
  return new Promise((resolve) => {
    pending = {
      ...options,
      resolve,
      trigger: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    };
    listeners.forEach((listener) => listener());
  });
}
