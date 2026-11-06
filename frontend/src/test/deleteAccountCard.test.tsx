import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteAccountCard } from '../components/settings/DeleteAccountCard';

const openDialog = () => fireEvent.click(screen.getByRole('button', { name: 'Borrar mi cuenta' }));
const confirmButton = () => screen.getByRole('button', { name: 'Borrar cuenta' });

describe('DeleteAccountCard', () => {
  it('only deletes after typing the confirmation word', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<DeleteAccountCard onConfirm={onConfirm} />);

    openDialog();
    expect(confirmButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Escribe BORRAR/), { target: { value: 'borra' } });
    expect(confirmButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Escribe BORRAR/), { target: { value: ' borrar ' } });
    fireEvent.click(confirmButton());

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('keeps the dialog open with an error when the deletion fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('500'));
    render(<DeleteAccountCard onConfirm={onConfirm} />);

    openDialog();
    fireEvent.change(screen.getByLabelText(/Escribe BORRAR/), { target: { value: 'BORRAR' } });
    fireEvent.click(confirmButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo borrar la cuenta');
    expect(confirmButton()).toBeEnabled();
  });

  it('clears the typed word when cancelled', () => {
    render(<DeleteAccountCard onConfirm={vi.fn()} />);

    openDialog();
    fireEvent.change(screen.getByLabelText(/Escribe BORRAR/), { target: { value: 'BORRAR' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    openDialog();

    expect(screen.getByLabelText(/Escribe BORRAR/)).toHaveValue('');
  });
});
