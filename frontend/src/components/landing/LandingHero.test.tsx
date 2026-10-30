import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CredentialResponse } from '@react-oauth/google';
import LandingHero from './LandingHero';

const { post, login } = vi.hoisted(() => ({ post: vi.fn(), login: vi.fn() }));
vi.mock('../../api/client', () => ({ default: { post } }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login }) }));
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (response: CredentialResponse) => void }) => (
    <button onClick={() => onSuccess({ credential: 'google-id-credential' })}>Elegir cuenta</button>
  ),
}));

describe('Google authentication contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exchanges the Google identity credential for an application session', async () => {
    post.mockResolvedValue({ data: { token: 'application-session' } });
    render(<LandingHero />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir cuenta' }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('application-session'));
    expect(post).toHaveBeenCalledWith('/auth/login', { token: 'google-id-credential' });
  });

  it('does not establish a session when the backend omits its token', async () => {
    post.mockResolvedValue({ data: {} });
    render(<LandingHero />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido iniciar sesión');
    expect(login).not.toHaveBeenCalled();
  });
});
