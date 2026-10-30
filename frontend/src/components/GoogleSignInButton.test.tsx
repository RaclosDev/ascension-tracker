import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CredentialResponse } from '@react-oauth/google';
import GoogleSignInButton from './GoogleSignInButton';

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (response: CredentialResponse) => void }) => (
    <>
      <button onClick={() => onSuccess({ credential: 'test-id-credential' })}>
        Elegir cuenta de prueba
      </button>
      <button onClick={() => onSuccess({})}>Respuesta vacía de prueba</button>
    </>
  ),
}));

describe('Google sign-in parity with PorrApp', () => {
  it('mounts the official sign-in only after opening the dialog, then delivers the identity credential', async () => {
    const onCredential = vi.fn().mockResolvedValue(undefined);
    render(<GoogleSignInButton onCredential={onCredential} />);
    expect(screen.queryByText('Elegir cuenta de prueba')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    fireEvent.click(screen.getByText('Elegir cuenta de prueba'));
    await waitFor(() => expect(onCredential).toHaveBeenCalledWith('test-id-credential'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('does not submit a missing Google credential', async () => {
    const onCredential = vi.fn();
    render(<GoogleSignInButton onCredential={onCredential} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    fireEvent.click(screen.getByText('Respuesta vacía de prueba'));
    expect(await screen.findByRole('alert')).toHaveTextContent('ninguna credencial');
    expect(onCredential).not.toHaveBeenCalled();
  });
  it('keeps the dialog open with a safe error when the application rejects sign-in', async () => {
    render(
      <GoogleSignInButton
        onCredential={vi.fn().mockRejectedValue(new Error('private diagnostic'))}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    fireEvent.click(screen.getByText('Elegir cuenta de prueba'));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido iniciar sesión');
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.queryByText('private diagnostic')).not.toBeInTheDocument();
  });
});
