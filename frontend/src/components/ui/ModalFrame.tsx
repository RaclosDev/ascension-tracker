import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useRef, type CSSProperties, type ReactNode } from 'react';

interface ModalFrameProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  pending?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ModalFrame({
  open,
  onClose,
  title,
  children,
  pending,
  className,
  style,
}: ModalFrameProps) {
  const previousFocus = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-backdrop">
          <DialogPrimitive.Content
            className={className}
            style={style}
            aria-describedby={undefined}
            onOpenAutoFocus={() => {
              previousFocus.current =
                document.activeElement instanceof HTMLElement ? document.activeElement : null;
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              previousFocus.current?.focus();
            }}
            onEscapeKeyDown={(event) => {
              if (pending) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            <DialogPrimitive.Title asChild>
              <span className="sr-only">{title}</span>
            </DialogPrimitive.Title>
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
