import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { confirmAction } from '../lib/confirmation';

afterEach(cleanup);
const options = {
  title: 'Sustituir la semana 2',
  description: 'Se sustituirán tres entrenamientos.',
  confirmLabel: 'Sustituir semana',
  destructive: true,
};

describe('Confirmaciones dentro de la aplicación', () => {
  it('waits for an explicit choice, initially focuses cancel and restores focus', async () => {
    const apply = vi.fn();
    render(
      <>
        <button
          onClick={async () => {
            if (await confirmAction(options)) apply();
          }}
        >
          Copiar
        </button>
        <ConfirmationDialog />
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Copiar' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: options.title });
    expect(dialog).toHaveAccessibleDescription(options.description);
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Sustituir semana' }));
    await waitFor(() => expect(apply).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(['Escape', 'Cerrar'])('cancels using %s without applying the action', async (method) => {
    render(<ConfirmationDialog />);
    let answer: Promise<boolean>;
    act(() => {
      answer = confirmAction(options);
    });
    if (method === 'Escape') fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    else fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await expect(answer!).resolves.toBe(false);
  });

  it('cancels on navigation and unmount and refuses a second pending action', async () => {
    const view = render(<ConfirmationDialog scope="first" />);
    let first: Promise<boolean>;
    act(() => {
      first = confirmAction(options);
    });
    await expect(confirmAction(options)).resolves.toBe(false);
    view.rerender(<ConfirmationDialog scope="second" />);
    await expect(first!).resolves.toBe(false);
    let second: Promise<boolean>;
    act(() => {
      second = confirmAction(options);
    });
    view.unmount();
    await expect(second!).resolves.toBe(false);
    await expect(confirmAction(options)).resolves.toBe(false);
  });
});
