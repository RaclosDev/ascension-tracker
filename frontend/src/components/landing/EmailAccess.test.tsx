import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmailAccess from './EmailAccess';
import { requestEmailAccess } from './emailAccessEvents';

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
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrectos|No se ha podido/);
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('creates an account and signs in directly', async () => {
    mocks.startSignUp.mockResolvedValue('new-session');
    render(<EmailAccess />);
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    type('Email', 'ana@example.com');
    type('Contraseña', 'una-frase-larga');
    fireEvent.click(screen.getAllByRole('button', { name: 'Crear cuenta' })[1]);

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith('new-session'));
    expect(mocks.startSignUp).toHaveBeenCalledWith('ana@example.com', 'una-frase-larga');
  });

  it('sends the reset link and goes back to sign-in', async () => {
    mocks.requestPasswordReset.mockResolvedValue(undefined);
    render(<EmailAccess />);
    fireEvent.click(screen.getByRole('button', { name: '¿Has olvidado la contraseña?' }));
    type('Email', 'ana@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Si hay una cuenta');
    expect(mocks.requestPasswordReset).toHaveBeenCalledWith('ana@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
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

  it('opens in the mode a call to action asks for, with the cursor in the email field', () => {
    render(<EmailAccess alternatives={<button type="button">Continuar con Google</button>} />);
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();

    act(() => requestEmailAccess('register')());

    expect(screen.getAllByRole('button', { name: 'Crear cuenta' })[0]).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByRole('button', { name: 'Crear cuenta' })).toHaveLength(2);
    expect(screen.getByLabelText('Email')).toHaveFocus();
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
