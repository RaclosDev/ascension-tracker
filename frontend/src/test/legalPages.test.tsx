import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LegalPage from '../pages/LegalPage';
import { LEGAL_DOCS } from '../lib/legal/docs';
import { LEGAL_TEXTS } from '../lib/legal/texts';

describe('LegalPage', () => {
  it.each(LEGAL_DOCS)('shows %s as a draft with links to the other texts', (doc) => {
    render(
      <MemoryRouter>
        <LegalPage doc={doc} />
      </MemoryRouter>,
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
    );
    expect(screen.getByText(/consentimiento explícito/)).toBeInTheDocument();
    expect(screen.getByText(/Agencia Española de Protección de Datos/)).toBeInTheDocument();
  });
});
