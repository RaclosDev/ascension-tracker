import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettingsPersonalSection } from '../components/settings/SettingsPersonalSection';
import { SettingsForm } from '../pages/SettingsPage';

describe('SettingsPersonalSection Component', () => {
  const initialForm: SettingsForm = {
    startDate: '2026-01-01',
    macroStrategy: 'balanced',
    customProteinPct: 30,
    customFatPct: 30,
    customCarbsPct: 40,
    customProteinGrams: 150,
    customFatGrams: 60,
    customCarbsGrams: 200,
    kcal: 2500,
    age: '28',
    heightCm: '180',
    sex: 'M',
    activityFactor: 'moderate',
    startWeight: 80,
    goalWeight: 75,
    weeklyGoal: -0.5,
    currentWeight: 78,
  };

  it('renders collapsed state showing only the header', () => {
    const onToggle = vi.fn();
    const setForm = vi.fn();
    const onSave = vi.fn();

    render(
      <SettingsPersonalSection
        isOpen={false}
        onToggle={onToggle}
        form={initialForm}
        setForm={setForm}
        onSave={onSave}
      />,
    );

    expect(screen.getByText('Datos Personales')).toBeDefined();
    expect(screen.queryByText('Métricas Corporales y Biometría')).toBeNull();
  });

  it('renders expanded state with biometrics inputs', () => {
    const onToggle = vi.fn();
    const setForm = vi.fn();
    const onSave = vi.fn();

    render(
      <SettingsPersonalSection
        isOpen={true}
        onToggle={onToggle}
        form={initialForm}
        setForm={setForm}
        onSave={onSave}
      />,
    );

    expect(screen.getByText('Datos Personales')).toBeDefined();
    expect(screen.getByText('Métricas Corporales y Biometría')).toBeDefined();
    expect((screen.getByLabelText('Sexo') as HTMLSelectElement).value).toBe('M');
  });

  it('triggers onToggle when header is clicked', () => {
    const onToggle = vi.fn();
    const setForm = vi.fn();
    const onSave = vi.fn();

    render(
      <SettingsPersonalSection
        isOpen={false}
        onToggle={onToggle}
        form={initialForm}
        setForm={setForm}
        onSave={onSave}
      />,
    );

    const header = screen.getByText('Datos Personales');
    fireEvent.click(header);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('triggers onSave when clicking save button', () => {
    const onToggle = vi.fn();
    const setForm = vi.fn();
    const onSave = vi.fn();

    render(
      <SettingsPersonalSection
        isOpen={true}
        onToggle={onToggle}
        form={initialForm}
        setForm={setForm}
        onSave={onSave}
      />,
    );

    const saveButtons = screen.getAllByRole('button', { name: /guardar cambios/i });
    expect(saveButtons.length).toBeGreaterThan(0);
    fireEvent.click(saveButtons[0]);

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
