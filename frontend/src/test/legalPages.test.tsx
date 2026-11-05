import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LegalPage from '../pages/LegalPage';
import { LEGAL_DOCS } from '../lib/legal/docs';
import { LEGAL_TEXTS } from '../lib/legal/texts';
import { mockPublicInfo } from './publicInfoMock';

afterEach(() => vi.unstubAllGlobals());

describe('LegalPage', () => {
  it.each(LEGAL_DOCS)('shows %s as a draft with links to the other texts', (doc) => {
    render(
      <MemoryRouter>
        <LegalPage doc={doc} />
      </MemoryRouter>,
      { wrapper: mockPublicInfo() },
    );
    expect(
      screen.getByRole('heading', { level: 1, name: LEGAL_TEXTS[doc].title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Borrador pendiente de revisión legal');
    const nav = screen.getByRole('navigation', { name: 'Textos legales' });
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([...LEGAL_DOCS.filter((d) => d !== doc).map((d) => `/${d}`), '/']);
  });

  it('asks for explicit consent for health data in the privacy policy', () => {
    render(
      <MemoryRouter>
        <LegalPage doc="privacidad" />
      </MemoryRouter>,
      { wrapper: mockPublicInfo() },
    );
    expect(screen.getByText(/consentimiento explícito/)).toBeInTheDocument();
    expect(screen.getByText(/Agencia Española de Protección de Datos/)).toBeInTheDocument();
  });

  it('shows the contact email, or the in-app form when there is none', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <LegalPage doc="terminos" />
      </MemoryRouter>,
      { wrapper: mockPublicInfo() },
    );
    expect(await screen.findByRole('link', { name: 'hola@ascension.test' })).toHaveAttribute(
      'href',
      'mailto:hola@ascension.test',
    );
    unmount();
    render(
      <MemoryRouter>
        <LegalPage doc="terminos" />
      </MemoryRouter>,
      { wrapper: mockPublicInfo(null) },
    );
    expect(
      await screen.findByText(/través del formulario de contacto de la app/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\[CONTACTO\]/)).not.toBeInTheDocument();
  });
});
