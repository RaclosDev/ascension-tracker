import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api, { exportUserData } from '../api/client';
import toast from 'react-hot-toast';

import WeightLossPlan from '../components/calculators/WeightLossPlan';
import MacroConfigurator, { MacroForm } from '../components/calculators/MacroConfigurator';
import { SettingsMealsSection } from '../components/settings/SettingsMealsSection';
import { haptics } from '../lib/haptics';
import { useWorkoutStore } from '../lib/workout/store';
import { useCustomExercises, useWorkoutPreferencesActions } from '../lib/workout/api';
import { HevyImportModal } from '../components/workout/HevyImportModal';
import { RestoreBackupModal } from '../components/settings/RestoreBackupModal';
import { SettingsPersonalSection } from '../components/settings/SettingsPersonalSection';
import { SettingsThemeSection } from '../components/settings/SettingsThemeSection';
import { SettingsWorkoutSection } from '../components/settings/SettingsWorkoutSection';
import { SettingsDataSection } from '../components/settings/SettingsDataSection';
import { useAuth } from '../context/AuthContext';
import { applyThemeColor, readThemeColor } from '../utils/colorHelper';
import { Skeleton } from '../components/ui/skeleton';
import { Scale, Activity } from 'lucide-react';
import { SettingsAccordionHeader } from '../components/settings/SettingsAccordionHeader';

export interface SettingsForm {
  startDate: string;
  macroStrategy: string;
  customProteinPct: string | number;
  customFatPct: string | number;
  customCarbsPct: string | number;
  customProteinGrams: string | number;
  customFatGrams: string | number;
  customCarbsGrams: string | number;
  kcal: string | number;
  age: string | number;
  heightCm: string | number;
  sex: string;
  activityFactor: string;
  startWeight?: string | number;
  goalWeight?: string | number;
  weeklyGoal?: string | number;
  currentWeight?: number;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const cachedSettings = queryClient.getQueryData<Partial<SettingsForm>>(['settings']);

  const [settings, setSettings] = useState<SettingsForm | null>(
    () => (cachedSettings as SettingsForm) || null,
  );
  const [form, setForm] = useState<SettingsForm>(() => ({
    startDate: cachedSettings?.startDate || '',
    macroStrategy: cachedSettings?.macroStrategy || 'BALANCED',
    customProteinPct: cachedSettings?.customProteinPct ?? '',
    customFatPct: cachedSettings?.customFatPct ?? '',
    customCarbsPct: cachedSettings?.customCarbsPct ?? '',
    customProteinGrams: cachedSettings?.customProteinGrams ?? '',
    customFatGrams: cachedSettings?.customFatGrams ?? '',
    customCarbsGrams: cachedSettings?.customCarbsGrams ?? '',
    kcal: cachedSettings?.kcal ?? '',
    age: cachedSettings?.age ?? '',
    heightCm: cachedSettings?.heightCm ?? '',
    sex: cachedSettings?.sex || 'M',
    activityFactor: cachedSettings?.activityFactor ? String(cachedSettings.activityFactor) : '1.2',
  }));

  const {
    data: querySettings,
    isLoading: loading,
    isError,
    refetch: refetchSettings,
  } = useQuery<Partial<SettingsForm>, Error>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
  });

  const effectiveSettings =
    settings || (querySettings as SettingsForm) || (cachedSettings as SettingsForm) || null;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: false,
    plan: false,
    macros: false,
    theme: false,
    workout: false,
    meals: false,
  });

  const workoutSettings = useWorkoutStore((s) => s.settings);
  const setWorkoutSettings = useWorkoutStore((s) => s.setSettings);
  const restPreset = useWorkoutStore((s) => s.restPreset);
  const setRestPreset = useWorkoutStore((s) => s.setRestPreset);
  const hiddenEquipments = useWorkoutStore((s) => s.hiddenEquipments) || [];
  const toggleHiddenEquipment = useWorkoutStore((s) => s.toggleHiddenEquipment);
  const setHiddenEquipments = useWorkoutStore((s) => s.setHiddenEquipments);
  const {
    prefs: workoutPrefs,
    toggleHiddenEquipment: togglePrefHiddenEquipment,
    setRestPresetPref,
  } = useWorkoutPreferencesActions();

  useEffect(() => {
    if (workoutPrefs?.hiddenEquipments) {
      setHiddenEquipments(workoutPrefs.hiddenEquipments);
    }
  }, [workoutPrefs?.hiddenEquipments, setHiddenEquipments]);

  const [isHevyModalOpen, setIsHevyModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const { data: customExercises = [] } = useCustomExercises();
  const { logout } = useAuth();
  const { data: dashboard } = useQuery<{ currentWeight?: number }, Error>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/weights/dashboard').then((res) => res.data),
  });

  const handleExportData = async () => {
    try {
      const weights = await api.get('/weights').then((res) => res.data);
      let csvContent = 'data:text/csv;charset=utf-8,Date,Weight\n';
      weights.forEach((row: { date: string; weight: number }) => {
        csvContent += `${row.date},${row.weight}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `ascension_weights_${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Datos exportados con éxito');
    } catch {
      toast.error('Error al exportar datos');
    }
  };

  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  const handleExportJson = async () => {
    try {
      setIsExportingJson(true);
      await exportUserData();
      toast.success('Copia de seguridad exportada con éxito');
    } catch (error) {
      console.error(
        'Error al exportar copia de seguridad:',
        error instanceof Error ? error.message : String(error),
      );
      toast.error('Error al exportar la copia de seguridad');
    } finally {
      setIsExportingJson(false);
    }
  };

  const [customColor, setCustomColor] = useState(readThemeColor());
  const handleColorChange = (color: string) => {
    setCustomColor(color);
    applyThemeColor(color);
  };

  useEffect(() => {
    if (location.hash === '#meals') {
      setOpenSections((prev: Record<string, boolean>) => ({ ...prev, meals: true }));
      setTimeout(() => {
        const el = document.getElementById('meals-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.hash]);

  const toggleSection = (key: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    haptics.medium();
    if (!openSections[key] && e?.currentTarget) {
      const el = e.currentTarget;
      setTimeout(() => {
        const offset = 140;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }, 50);
    }
    setOpenSections((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (querySettings) {
      setSettings(querySettings as SettingsForm);
      setForm({
        ...querySettings,
        startDate: querySettings.startDate || '',
        macroStrategy: querySettings.macroStrategy || 'BALANCED',
        customProteinPct: querySettings.customProteinPct || 30,
        customFatPct: querySettings.customFatPct || 35,
        customCarbsPct: querySettings.customCarbsPct || 35,
        customProteinGrams: querySettings.customProteinGrams || 150,
        customFatGrams: querySettings.customFatGrams || 60,
        customCarbsGrams: querySettings.customCarbsGrams || 150,
        kcal: querySettings.kcal || 2000,
        age: querySettings.age || '',
        heightCm: querySettings.heightCm || '',
        sex: querySettings.sex || 'M',
        activityFactor: querySettings.activityFactor || '1.2',
      });
    }
  }, [querySettings]);

  const parseSafeFloat = (val: string | number | null | undefined, fallback: number = 0) => {
    if (val === null || val === undefined || val === '') return fallback;
    const normalized = String(val).replace(',', '.').trim();
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? fallback : parsed;
  };

  const handleSavePersonal = async () => {
    try {
      setIsSavingPersonal(true);
      await api.put('/settings', {
        startWeight: parseSafeFloat(form.startWeight, Number(effectiveSettings?.startWeight || 0)),
        goalWeight: parseSafeFloat(form.goalWeight, Number(effectiveSettings?.goalWeight || 0)),
        weeklyGoal: parseSafeFloat(form.weeklyGoal, Number(effectiveSettings?.weeklyGoal || 0)),
        startDate: form.startDate || effectiveSettings?.startDate || '',
        age: form.age ? parseInt(String(form.age), 10) : null,
        heightCm: form.heightCm ? parseInt(String(form.heightCm), 10) : null,
        sex: form.sex,
        activityFactor: form.activityFactor ? parseFloat(String(form.activityFactor)) : null,
      });
      toast.success('Datos personales guardados');
      refetchSettings();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: unknown) {
      console.error(
        'Error al guardar datos personales:',
        err instanceof Error ? err.message : String(err),
      );
      const e = err as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const msg = e.response?.data?.message || e.response?.data?.error || e.message;
      toast.error(msg ? `Error al guardar: ${msg}` : 'Error al guardar datos personales');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleSaveMacros = async () => {
    try {
      const strategy = form.macroStrategy || 'CUSTOM_GRAMS';
      const pG = Math.round(parseSafeFloat(form.customProteinGrams, 160) * 10) / 10;
      const fG = Math.round(parseSafeFloat(form.customFatGrams, 65) * 10) / 10;
      const cG = Math.round(parseSafeFloat(form.customCarbsGrams, 190) * 10) / 10;

      const pP = Math.round(parseSafeFloat(form.customProteinPct, 30) * 10) / 10;
      const fP = Math.round(parseSafeFloat(form.customFatPct, 30) * 10) / 10;
      const cP = Math.round(parseSafeFloat(form.customCarbsPct, 40) * 10) / 10;

      let payloadKcal = Math.round(parseSafeFloat(form.kcal, 2000));

      if (strategy === 'CUSTOM_GRAMS') {
        payloadKcal = Math.round(pG * 4 + fG * 9 + cG * 4);
      } else if (strategy === 'CUSTOM_PCT') {
        const total = Math.round((pP + fP + cP) * 10) / 10;
        if (Math.abs(total - 100) > 1.5) {
          toast.error(`Los porcentajes deben sumar 100% (actual: ${total}%)`);
          return;
        }
      }

      await api.put('/settings', {
        startWeight: parseSafeFloat(form.startWeight, Number(effectiveSettings?.startWeight || 0)),
        goalWeight: parseSafeFloat(form.goalWeight, Number(effectiveSettings?.goalWeight || 0)),
        weeklyGoal: parseSafeFloat(form.weeklyGoal, Number(effectiveSettings?.weeklyGoal || 0)),
        startDate: form.startDate || effectiveSettings?.startDate || '',
        macroStrategy: strategy,
        kcal: payloadKcal,
        customProteinGrams: pG,
        customFatGrams: fG,
        customCarbsGrams: cG,
        customProteinPct: String(pP),
        customFatPct: String(fP),
        customCarbsPct: String(cP),
      });
      toast.success('¡Objetivos de macros guardados!');
      refetchSettings();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: unknown) {
      console.error('Error al guardar macros:', err instanceof Error ? err.message : String(err));
      const e = err as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const msg = e.response?.data?.message || e.response?.data?.error || e.message;
      toast.error(msg ? `Error al guardar: ${msg}` : 'Error al guardar objetivos');
    }
  };

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">Error al cargar la configuración.</p>
        <button className="btn btn-primary" onClick={() => refetchSettings()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (loading && !effectiveSettings) {
    return (
      <div className="fade-in">
        <div
          className="settings-accordion-container"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card px-5 py-4 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!effectiveSettings) return null;

  return (
    <div
      className="fade-in max-w-2xl mx-auto px-4 pt-2 sm:pt-4"
      style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 24px))' }}
    >
      <header className="mb-6 pb-2 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Ajustes y Preferencias</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Configuración personal, macros, entrenamiento y privacidad.
        </p>
      </header>

      <div
        className="settings-accordion-container"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
      >
        <SettingsPersonalSection
          isOpen={openSections.personal}
          onToggle={(e) => toggleSection('personal', e)}
          form={form}
          setForm={setForm}
          onSave={handleSavePersonal}
          isSaving={isSavingPersonal}
        />

        <div
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.plan ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <SettingsAccordionHeader
            panelId="settings-plan-panel"
            title="Plan de Adelgazamiento"
            icon={Activity}
            isOpen={openSections.plan}
            onToggle={(e) => toggleSection('plan', e)}
          />
          {openSections.plan && (
            <div
              id="settings-plan-panel"
              className="accordion-content fade-in mt-5 pt-5 border-t border-white/10"
            >
              <WeightLossPlan
                initialWeightKg={String(
                  dashboard?.currentWeight ||
                    effectiveSettings?.currentWeight ||
                    effectiveSettings?.startWeight ||
                    '',
                )}
                initialGoalWeight={String(form.goalWeight || '')}
                age={String(form.age)}
                heightCm={String(form.heightCm)}
                sex={form.sex as 'M' | 'F'}
                activityFactor={form.activityFactor}
                onSave={(kcal) => {
                  setForm({ ...form, kcal });
                  setOpenSections({ ...openSections, plan: false, macros: true });
                  toast.success(
                    `Calorías aplicadas (${kcal} kcal). Recuerda pulsar "Guardar Macros" abajo para confirmar los cambios.`,
                    { duration: 4500 },
                  );
                }}
                saveButtonText="Aplicar Calorías a Macros"
              />
            </div>
          )}
        </div>

        <div
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.macros ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <SettingsAccordionHeader
            panelId="settings-macros-panel"
            title="Estrategia de Macros"
            icon={Scale}
            isOpen={openSections.macros}
            onToggle={(e) => toggleSection('macros', e)}
          />
          {openSections.macros && (
            <div
              id="settings-macros-panel"
              className="accordion-content fade-in mt-5 pt-5 border-t border-white/10"
            >
              <MacroConfigurator
                form={form}
                setForm={setForm as unknown as React.Dispatch<React.SetStateAction<MacroForm>>}
                initialStartWeight={dashboard?.currentWeight || effectiveSettings?.startWeight}
              />
              <button
                className="btn btn-primary min-h-11"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={handleSaveMacros}
              >
                Guardar Macros
              </button>
            </div>
          )}
        </div>

        <SettingsMealsSection
          isOpen={openSections.meals}
          onToggle={(event) => toggleSection('meals', event)}
          onSaved={refetchSettings}
        />

        <SettingsThemeSection
          isOpen={openSections.theme}
          onToggle={(e) => toggleSection('theme', e)}
          customColor={customColor}
          onColorChange={handleColorChange}
        />

        <SettingsWorkoutSection
          isOpen={openSections.workout}
          onToggle={(e) => toggleSection('workout', e)}
          restPreset={restPreset}
          onRestPresetChange={(val) => {
            setRestPreset(val);
            setRestPresetPref(val);
          }}
          workoutSettings={workoutSettings}
          onWorkoutSettingsChange={setWorkoutSettings}
          hiddenEquipments={hiddenEquipments}
          onToggleHiddenEquipment={(eq) => {
            toggleHiddenEquipment(eq);
            togglePrefHiddenEquipment(eq);
          }}
          onOpenHevyModal={() => setIsHevyModalOpen(true)}
        />

        <SettingsDataSection
          isExportingJson={isExportingJson}
          onExportJson={handleExportJson}
          onOpenRestoreModal={() => setIsRestoreModalOpen(true)}
          onExportCsv={handleExportData}
          onLogout={() => {
            logout();
            toast.success('Sesión cerrada');
          }}
        />
      </div>

      <HevyImportModal
        isOpen={isHevyModalOpen}
        onClose={() => setIsHevyModalOpen(false)}
        customExercises={customExercises}
      />
      <RestoreBackupModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
      />
    </div>
  );
}
