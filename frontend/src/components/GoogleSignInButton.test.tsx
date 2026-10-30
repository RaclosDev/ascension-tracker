import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CredentialResponse } from '@react-oauth/google';
import GoogleSignInButton from './GoogleSignInButton';

const { googleProps } = vi.hoisted(() => ({ googleProps: vi.fn() }));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: (props: { onSuccess: (response: CredentialResponse) => void }) => {
    googleProps(props);
    const { onSuccess } = props;
    return (
      <>
        <button onClick={() => onSuccess({ credential: 'test-id-credential' })}>
          Elegir cuenta de prueba
        </button>
        <button onClick={() => onSuccess({})}>Respuesta vacía de prueba</button>
      </>
    );
  },
}));

describe('Google sign-in parity with PorrApp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses a full-page redirect inside the installed iOS PWA', () => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    try {
      render(<GoogleSignInButton onCredential={vi.fn()} />);
      expect(googleProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ux_mode: 'redirect',
          login_uri: `${window.location.origin}/api/auth/login/redirect`,
        }),
      );
    } finally {
      Reflect.deleteProperty(navigator, 'standalone');
    }
  });

  it('keeps popup sign-in in a normal browser', () => {
    render(<GoogleSignInButton onCredential={vi.fn()} />);
    expect(googleProps).toHaveBeenLastCalledWith(expect.objectContaining({ ux_mode: 'popup' }));
  });

  it('recognises standalone display mode on installed browsers', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    render(<GoogleSignInButton onCredential={vi.fn()} />);
    expect(googleProps).toHaveBeenLastCalledWith(expect.objectContaining({ ux_mode: 'redirect' }));
  });
  it('prepares Google before opening the dialog and preserves it between attempts', async () => {
    const onCredential = vi.fn().mockResolvedValue(undefined);
    render(<GoogleSignInButton onCredential={onCredential} />);
    const googleButton = screen.getByText('Elegir cuenta de prueba');
    expect(googleButton).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(googleButton).toBeVisible();
    fireEvent.click(screen.getByText('Elegir cuenta de prueba'));
    await waitFor(() => expect(onCredential).toHaveBeenCalledWith('test-id-credential'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    expect(screen.getByText('Elegir cuenta de prueba')).toBe(googleButton);
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
