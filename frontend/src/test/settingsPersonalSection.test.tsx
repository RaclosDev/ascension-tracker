import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders the section title and biometrics inputs', () => {
    const setForm = vi.fn();
    const onSave = vi.fn();

    render(<SettingsPersonalSection form={initialForm} setForm={setForm} onSave={onSave} />);

    expect(screen.getByRole('heading', { name: 'Datos Personales' })).toBeDefined();
    expect(screen.getByText('Métricas Corporales y Biometría')).toBeDefined();
    expect((screen.getByLabelText('Sexo') as HTMLSelectElement).value).toBe('M');
  });

  it('triggers onSave when clicking save button', () => {
    const setForm = vi.fn();
    const onSave = vi.fn();

    render(<SettingsPersonalSection form={initialForm} setForm={setForm} onSave={onSave} />);

    const saveButtons = screen.getAllByRole('button', { name: /guardar cambios/i });
    expect(saveButtons.length).toBeGreaterThan(0);
    fireEvent.click(saveButtons[0]);

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
