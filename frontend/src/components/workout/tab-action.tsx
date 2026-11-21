import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * The spot at the right of Entreno's tabs where the open view puts its main action.
 * `undefined` means no tab row above (the view stands alone), so the action renders in place.
 */
export const TabActionSlot = createContext<HTMLElement | null | undefined>(undefined);

export function TabAction({ children }: { children: ReactNode }) {
  const slot = useContext(TabActionSlot);
  if (slot === undefined) return <>{children}</>;
  return slot ? createPortal(children, slot) : null;
}
