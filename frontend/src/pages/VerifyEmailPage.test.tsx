import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VerifyEmailPage from './VerifyEmailPage';

const mocks = vi.hoisted(() => ({ verifyEmail: vi.fn() }));
vi.mock('../auth/accountAccess', () => ({ verifyEmail: mocks.verifyEmail }));

const renderAt = (hash: string) => {
  window.history.replaceState(null, '', `/verificar-email${hash}`);
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VerifyEmailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return invalidate;
};

describe('VerifyEmailPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('explains a link without a token and sends nothing', () => {
    renderAt('');
    expect(screen.getByRole('alert')).toHaveTextContent('no es válido');
    expect(mocks.verifyEmail).not.toHaveBeenCalled();
  });

  it('confirms the address once, drops the token from the address bar and refreshes the notice', async () => {
    mocks.verifyEmail.mockResolvedValue(undefined);
    const invalidate = renderAt('#token=abc');

    expect(await screen.findByText(/tu email está verificado/)).toBeInTheDocument();
    expect(mocks.verifyEmail).toHaveBeenCalledTimes(1);
    expect(mocks.verifyEmail).toHaveBeenCalledWith('abc');
    expect(window.location.hash).toBe('');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['account', 'email'] });
  });

  it('shows why a spent or expired link does not work', async () => {
    mocks.verifyEmail.mockRejectedValue({
      response: { data: { error: 'El enlace ha caducado.' } },
    });
    renderAt('#token=abc');

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('El enlace ha caducado.'),
    );
  });
});
