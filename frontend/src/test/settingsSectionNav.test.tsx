import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import {
  SettingsSectionNav,
  SETTINGS_SECTIONS,
  isSettingsSection,
} from '../components/settings/SettingsSectionNav';

function NavFromUrl() {
  const [params] = useSearchParams();
  const section = params.get('section');
  return <SettingsSectionNav active={isSettingsSection(section) ? section : 'personal'} />;
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/settings" element={<NavFromUrl />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SettingsSectionNav', () => {
  it('renders one link per section inside a labelled navigation', () => {
    renderAt('/settings');

    const nav = screen.getByRole('navigation', { name: 'Secciones de ajustes' });
    expect(nav).toBeDefined();
    expect(screen.getAllByRole('link')).toHaveLength(SETTINGS_SECTIONS.length);
  });

  it('marks the section from the URL with aria-current and links to ?section=', () => {
    renderAt('/settings?section=workout');

    const active = screen.getByRole('link', { name: 'Entrenamiento' });
    expect(active.getAttribute('aria-current')).toBe('page');
    expect(active.getAttribute('href')).toBe('/settings?section=workout');
    expect(
      screen.getByRole('link', { name: 'Datos personales' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('moves the active section when another link is clicked', () => {
    renderAt('/settings');

    fireEvent.click(screen.getByRole('link', { name: 'Comidas' }));

    expect(screen.getByRole('link', { name: 'Comidas' }).getAttribute('aria-current')).toBe('page');
  });

  it('only accepts known section ids', () => {
    expect(isSettingsSection('theme')).toBe(true);
    expect(isSettingsSection('nope')).toBe(false);
    expect(isSettingsSection(null)).toBe(false);
  });
});
