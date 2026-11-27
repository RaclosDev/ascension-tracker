import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmailVerificationNotice } from './EmailVerificationNotice';

const mocks = vi.hoisted(() => ({
  getEmailStatus: vi.fn(),
  resendVerificationEmail: vi.fn(),
  dismissEmailNotice: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock('../auth/accountAccess', () => ({
  getEmailStatus: mocks.getEmailStatus,
  resendVerificationEmail: mocks.resendVerificationEmail,
  dismissEmailNotice: mocks.dismissEmailNotice,
}));
vi.mock('react-hot-toast', () => ({
  default: { error: mocks.error, success: mocks.success },
}));

const show = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EmailVerificationNotice />
    </QueryClientProvider>,
  );

describe('EmailVerificationNotice', () => {
  afterEach(() => vi.clearAllMocks());

  it('shows nothing for a verified account', async () => {
    mocks.getEmailStatus.mockResolvedValue({ verified: true, notice: null });
    const { container } = show();
    await waitFor(() => expect(mocks.getEmailStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('asks an unverified account to verify and lets it ask for the link again', async () => {
    mocks.getEmailStatus.mockResolvedValue({ verified: false, notice: null });
    mocks.resendVerificationEmail.mockResolvedValue(undefined);
    show();

    expect(await screen.findByText(/no puedes vincular un entrenador/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar enlace' }));

    expect(await screen.findByRole('button', { name: 'Enlace enviado' })).toBeDisabled();
    expect(mocks.resendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('reports why the link could not be sent', async () => {
    mocks.getEmailStatus.mockResolvedValue({ verified: false, notice: null });
    mocks.resendVerificationEmail.mockRejectedValue({
      response: { data: { error: 'Espera un minuto antes de pedir otro enlace.' } },
    });
    show();

    fireEvent.click(await screen.findByRole('button', { name: 'Reenviar enlace' }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith('Espera un minuto antes de pedir otro enlace.'),
    );
  });

  it('tells the account that its earlier links were closed, until it is dismissed', async () => {
    mocks.getEmailStatus.mockResolvedValue({
      verified: true,
      notice: 'Alguien creó esta cuenta antes de que lo verificaras.',
    });
    mocks.dismissEmailNotice.mockResolvedValue(undefined);
    show();

    expect(await screen.findByText(/antes de que lo verificaras/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    await waitFor(() =>
      expect(screen.queryByText(/antes de que lo verificaras/)).not.toBeInTheDocument(),
    );
    expect(mocks.dismissEmailNotice).toHaveBeenCalledTimes(1);
  });
});
