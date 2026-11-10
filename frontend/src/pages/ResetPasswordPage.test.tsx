import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from './ResetPasswordPage';

const mocks = vi.hoisted(() => ({ login: vi.fn(), resetPassword: vi.fn(), navigate: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login: mocks.login }) }));
vi.mock('../auth/accountAccess', () => ({ resetPassword: mocks.resetPassword }));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mocks.navigate,
}));

const renderAt = (hash: string) => {
  window.history.replaceState(null, '', `/restablecer-contrasena${hash}`);
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
};

const fill = (password: string, repeat: string) => {
  fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Repítela'), { target: { value: repeat } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar y entrar' }));
};

describe('ResetPasswordPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('explains a link without a token', () => {
    renderAt('');
    expect(screen.getByRole('alert')).toHaveTextContent('no es válido');
  });

  it('refuses two different passwords', () => {
    renderAt('#token=abc');
    fill('una-frase-larga', 'otra-frase');
    expect(screen.getByRole('alert')).toHaveTextContent('no coinciden');
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it('saves the password, drops the token from the address and signs in', async () => {
    mocks.resetPassword.mockResolvedValue('session');
    renderAt('#token=abc');
    fill('una-frase-larga', 'una-frase-larga');

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(mocks.resetPassword).toHaveBeenCalledWith('abc', 'una-frase-larga');
    expect(mocks.login).toHaveBeenCalledWith('session');
    expect(window.location.hash).toBe('');
  });

  it('shows why the link no longer works', async () => {
    mocks.resetPassword.mockRejectedValue(new Error('x'));
    renderAt('#token=abc');
    fill('una-frase-larga', 'una-frase-larga');

    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido');
  });
});
