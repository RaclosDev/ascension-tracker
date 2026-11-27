import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmailAccess from './EmailAccess';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  startSignUp: vi.fn(),
  signInWithPassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  signInWithPasskey: vi.fn(),
  passkeysSupported: vi.fn(),
  markPasskeyPromptAnswered: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login: mocks.login }) }));
vi.mock('../../auth/accountAccess', () => ({
  startSignUp: mocks.startSignUp,
  signInWithPassword: mocks.signInWithPassword,
  requestPasswordReset: mocks.requestPasswordReset,
  signInWithPasskey: mocks.signInWithPasskey,
}));
vi.mock('../../utils/webauthn', () => ({
  passkeysSupported: mocks.passkeysSupported,
  isPasskeyCancel: (error: unknown) => error instanceof DOMException,
}));
vi.mock('../../utils/passkeyPrompt', () => ({
  markPasskeyPromptAnswered: mocks.markPasskeyPromptAnswered,
}));

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('EmailAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.passkeysSupported.mockReturnValue(true);
  });

  it('signs in with email and password', async () => {
    mocks.signInWithPassword.mockResolvedValue('session');
    render(<EmailAccess />);
    type('Email', ' ana@example.com ');
    type('Contraseña', 'una-frase-larga');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith('session'));
    expect(mocks.signInWithPassword).toHaveBeenCalledWith('ana@example.com', 'una-frase-larga');
  });

  it('shows the server error without saying whether the account exists', async () => {
    mocks.signInWithPassword.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Email o contraseña incorrectos.' } },
    });
    render(<EmailAccess />);
    type('Email', 'ana@example.com');
    type('Contraseña', 'mala');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos|No se ha podido/);
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('creates an account, asks to check the email and opens no session', async () => {
    mocks.startSignUp.mockResolvedValue('Te hemos enviado un correo.');
    render(<EmailAccess />);
    fireEvent.click(screen.getByRole('button', { name: 'Crea una gratis' }));
    type('Email', 'ana@example.com');
    type('Contraseña', 'una-frase-larga');
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Revisa tu correo');
    expect(status).toHaveTextContent('Te hemos enviado un correo.');
    expect(mocks.startSignUp).toHaveBeenCalledWith('ana@example.com', 'una-frase-larga');
    expect(mocks.login).not.toHaveBeenCalled();
    // The password is not kept once it has been sent.
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir a iniciar sesión' }));
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');
  });

  it('sends the reset link and goes back to sign-in', async () => {
    mocks.requestPasswordReset.mockResolvedValue(undefined);
    render(<EmailAccess />);
    fireEvent.click(screen.getByRole('button', { name: '¿Has olvidado tu contraseña?' }));
    type('Email', 'ana@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Si hay una cuenta');
    expect(mocks.requestPasswordReset).toHaveBeenCalledWith('ana@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('signs in with a passkey and stops offering one on this device', async () => {
    const payload = btoa(JSON.stringify({ email: 'ana@example.com' })).replace(/=+$/, '');
    mocks.signInWithPasskey.mockResolvedValue(`h.${payload}.s`);
    render(<EmailAccess />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar con huella o llave de acceso' }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith(`h.${payload}.s`));
    expect(mocks.markPasskeyPromptAnswered).toHaveBeenCalledWith('ana@example.com');
  });

  it('stays quiet when the passkey dialog is closed', async () => {
    mocks.signInWithPasskey.mockRejectedValue(new DOMException('x', 'NotAllowedError'));
    render(<EmailAccess />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar con huella o llave de acceso' }));

    await waitFor(() => expect(mocks.signInWithPasskey).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens on sign-up when a call to action asks for it, without the passkey button', () => {
    render(
      <EmailAccess
        initialMode="register"
        alternatives={<button type="button">Continuar con Google</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('button', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Entrar con huella o llave de acceso' }),
    ).not.toBeInTheDocument();
  });

  it('hides the passkey button where passkeys are not supported', () => {
    mocks.passkeysSupported.mockReturnValue(false);
    render(<EmailAccess />);
    expect(
      screen.queryByRole('button', { name: 'Entrar con huella o llave de acceso' }),
    ).not.toBeInTheDocument();
  });
});
