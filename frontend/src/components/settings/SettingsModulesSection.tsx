import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LayoutGrid } from 'lucide-react';
import api from '../../api/client';
import type { UserSettings } from '../../types/api';
import { APP_MODULE_OPTIONS, normalizeModules, type AppModules } from '../../lib/appModules';
import { SettingsSectionHeader } from './SettingsSectionHeader';

/** Elige qué partes de la app se muestran: el entreno siempre; nutrición y medidas, opcionales. */
export function SettingsModulesSection() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
  });
  const [saving, setSaving] = useState<AppModules | null>(null);
  const current = normalizeModules(settings?.appModules);

  const choose = async (value: AppModules) => {
    if (!settings || value === current || saving) return;
    setSaving(value);
    try {
      // El PUT exige los campos básicos del plan: reenviamos los que ya hay.
      await api.put('/settings', {
        startWeight: settings.startWeight,
        goalWeight: settings.goalWeight,
        weeklyGoal: settings.weeklyGoal,
        startDate: settings.startDate,
        kcal: settings.kcal,
        appModules: value,
      });
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Módulos actualizados');
    } catch {
      toast.error('No se pudieron guardar los módulos');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="card p-4 sm:p-6">
      <SettingsSectionHeader title="Módulos" icon={LayoutGrid} />
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Oculta lo que no uses. Tus datos no se borran: si vuelves a activar un módulo, siguen ahí.
      </p>
      <fieldset className="mt-4 flex flex-col gap-2" disabled={!settings || saving !== null}>
        <legend className="sr-only">Qué quieres llevar en la app</legend>
        {APP_MODULE_OPTIONS.map((o) => (
          <label
            key={o.value}
            className="kpi-card"
            style={{
              display: 'block',
              padding: '0.75rem',
              cursor: 'pointer',
              border:
                current === o.value ? '2px solid var(--accent-primary)' : '2px solid transparent',
            }}
          >
            <input
              type="radio"
              name="settings-modules"
              value={o.value}
              checked={current === o.value}
              onChange={() => void choose(o.value)}
              className="sr-only"
            />
            <span style={{ fontWeight: 600, display: 'block' }}>
              {o.label}
              {saving === o.value && ' · guardando…'}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {o.description}
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
