/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const WeightLossPlan = lazy(() => import('../components/calculators/WeightLossPlan'));
const MacroConfigurator = lazy(() => import('../components/calculators/MacroConfigurator'));
const MealConfigurator = lazy(() => import('../components/MealConfigurator'));
import { useWorkoutStore } from '../lib/workout/store';
import { useAuth } from '../context/AuthContext';
import { applyThemeColor } from '../utils/colorHelper';
import { Skeleton } from '../components/ui/skeleton';
import { Palette, User, Scale, Activity, Dumbbell, Utensils, LogOut } from 'lucide-react';

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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState<SettingsForm>({
    startDate: '',
    macroStrategy: 'BALANCED',
    customProteinPct: '',
    customFatPct: '',
    customCarbsPct: '',
    customProteinGrams: '',
    customFatGrams: '',
    customCarbsGrams: '',
    kcal: '',
    age: '',
    heightCm: '',
    sex: 'M',
    activityFactor: '1.2',
  });
  const location = useLocation();
  const queryClient = useQueryClient();

  const {
    data: querySettings,
    isLoading: loading,
    isError,
    refetch: refetchSettings,
  } = useQuery<any, any>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
  });
  const [openSections, setOpenSections] = useState<any>({
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
  const { logout } = useAuth();
  const { data: dashboard } = useQuery<any, any>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/weights/dashboard').then((res) => res.data),
  });

  const handleExportData = async () => {
    try {
      const weights = await api.get('/weights').then((res) => res.data);
      let csvContent = 'data:text/csv;charset=utf-8,Date,Weight\n';
      weights.forEach((row: any) => {
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
    } catch (e: any) {
      toast.error('Error al exportar datos');
    }
  };

  const PRESETS = ['#0085FF', '#E11D48', '#FFFFFF', '#FF5E00', '#8B5CF6'];
  const [customColor, setCustomColor] = useState(
    localStorage.getItem('ascension_custom_color') || '#0085FF',
  );
  const handleColorChange = (color: string) => {
    setCustomColor(color);
    applyThemeColor(color);
  };
  useEffect(() => {
    if (location.hash === '#meals') {
      setOpenSections((prev: any) => ({ ...prev, meals: true }));
      setTimeout(() => {
        const el = document.getElementById('meals-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.hash]);

  const toggleSection = (key: any, e: any) => {
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
    setOpenSections((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (querySettings) {
      setSettings(querySettings);
      setForm({
        ...querySettings,
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

  const parseSafeFloat = (val: any, fallback = 0) => {
    if (val === null || val === undefined || val === '') return fallback;
    const normalized = String(val).replace(',', '.').trim();
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? fallback : parsed;
  };

  const handleSavePersonal = async () => {
    try {
      await api.put('/settings', {
        startWeight: parseSafeFloat(form.startWeight, settings?.startWeight || 0.0),
        goalWeight: parseSafeFloat(form.goalWeight, settings?.goalWeight || 0.0),
        weeklyGoal: parseSafeFloat(form.weeklyGoal, settings?.weeklyGoal || 0.0),
        startDate: form.startDate || settings?.startDate || '',
        age: form.age ? parseInt(String(form.age), 10) : null,
        heightCm: form.heightCm ? parseInt(String(form.heightCm), 10) : null,
        sex: form.sex,
        activityFactor: form.activityFactor ? parseFloat(String(form.activityFactor)) : null,
      });
      toast.success('Datos personales guardados');
      refetchSettings();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      console.error('Error al guardar datos personales:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error(msg ? `Error al guardar: ${msg}` : 'Error al guardar datos personales');
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
        startWeight: parseSafeFloat(form.startWeight, settings?.startWeight || 0.0),
        goalWeight: parseSafeFloat(form.goalWeight, settings?.goalWeight || 0.0),
        weeklyGoal: parseSafeFloat(form.weeklyGoal, settings?.weeklyGoal || 0.0),
        startDate: form.startDate || settings?.startDate || '',
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
    } catch (err: any) {
      console.error('Error al guardar macros:', err);
      toast.error('Error al guardar objetivos');
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

  if (loading) {
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
  if (!settings) return null;

  return (
    <div className="fade-in">
      <div
        className="settings-accordion-container"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
      >
        {/* 1. Personal Data */}
        <div
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.personal ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <div
            className="accordion-header flex justify-between items-center cursor-pointer select-none"
            onClick={(e) => toggleSection('personal', e)}
          >
            <div className="flex items-center gap-2">
              <User size={20} className="text-primary" />
              <span className="card-title m-0 text-base font-semibold">Datos Personales</span>
            </div>
            <span
              className={`text-xs text-muted transition-transform duration-300 ${openSections.personal ? 'rotate-180' : 'rotate-0'}`}
            >
              ?
            </span>
          </div>
          {openSections.personal && (
            <div className="accordion-content fade-in mt-5 pt-5 border-t border-white/10">
              <h4 className="subsection-title">Métricas Corporales y Biometría</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Sexo</label>
                  <select
                    className="form-input"
                    value={form.sex || 'M'}
                    onChange={(e) => setForm({ ...form, sex: e.target.value })}
                  >
                    <option value="M">Hombre</option>
                    <option value="F">Mujer</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Edad</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.age || ''}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Altura (cm)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.heightCm || ''}
                    onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Actividad</label>
                  <select
                    className="form-input"
                    value={form.activityFactor || '1.2'}
                    onChange={(e) => setForm({ ...form, activityFactor: e.target.value })}
                  >
                    <option value="1.2">Sedentario</option>
                    <option value="1.375">Ligero</option>
                    <option value="1.55">Moderado</option>
                    <option value="1.725">Alto</option>
                    <option value="1.9">Muy Alto</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Peso Inicial (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="form-input"
                    step="0.1"
                    value={form.startWeight || ''}
                    onChange={(e) => setForm({ ...form, startWeight: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Peso Deseado (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="form-input"
                    step="0.1"
                    value={form.goalWeight || ''}
                    onChange={(e) => setForm({ ...form, goalWeight: e.target.value })}
                  />
                </div>
              </div>

              <h4 className="subsection-title" style={{ marginTop: '1.5rem' }}>
                Progreso y Fechas
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pérdida (kg/sem)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="form-input"
                    step="0.1"
                    min="0.1"
                    max="2"
                    value={form.weeklyGoal || ''}
                    onChange={(e) => setForm({ ...form, weeklyGoal: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.startDate || ''}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={handleSavePersonal}
              >
                Guardar Cambios
              </button>
            </div>
          )}
        </div>

        {/* 1.5 Plan de Adelgazamiento */}
        <div
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.plan ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <div
            className="accordion-header flex justify-between items-center cursor-pointer select-none"
            onClick={(e) => toggleSection('plan', e)}
          >
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              <span className="card-title m-0 text-base font-semibold">Plan de Adelgazamiento</span>
            </div>
            <span
              className={`text-xs text-muted transition-transform duration-300 ${openSections.plan ? 'rotate-180' : 'rotate-0'}`}
            >
              ?
            </span>
          </div>
          {openSections.plan && (
            <div className="accordion-content fade-in mt-5 pt-5 border-t border-white/10">
              <WeightLossPlan
                initialWeightKg={String(
                  dashboard?.currentWeight ||
                    settings?.currentWeight ||
                    settings?.startWeight ||
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
                }}
                saveButtonText="Aplicar Calorías a Macros"
              />
            </div>
          )}
        </div>

        {/* 2. Macro Strategy */}
        <div
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.macros ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <div
            className="accordion-header flex justify-between items-center cursor-pointer select-none"
            onClick={(e) => toggleSection('macros', e)}
          >
            <div className="flex items-center gap-2">
              <Scale size={20} className="text-primary" />
              <span className="card-title m-0 text-base font-semibold">Estrategia de Macros</span>
            </div>
            <span
              className={`text-xs text-muted transition-transform duration-300 ${openSections.macros ? 'rotate-180' : 'rotate-0'}`}
            >
              ?
            </span>
          </div>
          {openSections.macros && (
            <div className="accordion-content fade-in mt-5 pt-5 border-t border-white/10">
              <MacroConfigurator
                form={form as any}
                setForm={setForm as any}
                initialStartWeight={dashboard?.currentWeight || settings?.startWeight}
              />
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={handleSaveMacros}
              >
                Guardar Macros
              </button>
            </div>
          )}
        </div>

        {/* 3. Meals */}
        <div
          id="meals-section"
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.meals ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <div
            className="accordion-header flex justify-between items-center cursor-pointer select-none"
            onClick={(e) => toggleSection('meals', e)}
          >
            <div className="flex items-center gap-2">
              <Utensils size={20} className="text-primary" />
              <span className="card-title m-0 text-base font-semibold">Configurar Comidas</span>
            </div>
            <span
              className={`text-xs text-muted transition-transform duration-300 ${openSections.meals ? 'rotate-180' : 'rotate-0'}`}
            >
              ?
            </span>
          </div>
          {openSections.meals && (
            <div className="accordion-content fade-in mt-5 pt-5 border-t border-white/10">
              <MealConfigurator onSaved={refetchSettings} />
            </div>
          )}
        </div>

        {/* THEME & APPEARANCE */}
        <div
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.theme ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <div
            className="accordion-header flex justify-between items-center cursor-pointer select-none"
            onClick={(e) => toggleSection('theme', e)}
          >
            <div className="flex items-center gap-2">
              <Palette size={20} className="text-primary" />
              <span className="card-title m-0 text-base font-semibold">Tema y Apariencia</span>
            </div>
            <span
              className={`text-xs text-muted transition-transform duration-300 ${openSections.theme ? 'rotate-180' : 'rotate-0'}`}
            >
              ?
            </span>
          </div>
          {openSections.theme && (
            <div className="accordion-content fade-in mt-5 pt-5 border-t border-white/10">
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Color Principal
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: '0',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  />
                  <div
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}
                  >
                    {PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: color,
                          border:
                            customColor === color ? '2px solid white' : '2px solid transparent',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'transform 0.1s',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.75rem',
                  }}
                >
                  El color acento que elegiste es el {customColor}. ¡Se aplicará instantáneamente en
                  toda la aplicación!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Workout */}
        <div
          className={`card accordion-card transition-all duration-300 ease-out ${openSections.workout ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
        >
          <div
            className="accordion-header flex justify-between items-center cursor-pointer select-none"
            onClick={(e) => toggleSection('workout', e)}
          >
            <div className="flex items-center gap-2">
              <Dumbbell size={20} className="text-primary" />
              <span className="card-title m-0 text-base font-semibold">Entrenamiento</span>
            </div>
            <span
              className={`text-xs text-muted transition-transform duration-300 ${openSections.workout ? 'rotate-180' : 'rotate-0'}`}
            >
              ?
            </span>
          </div>
          {openSections.workout && (
            <div className="accordion-content fade-in mt-5 pt-5 border-t border-white/10">
              <div
                className="form-group"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ paddingRight: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '2px' }}>
                    {' '}
                    Descanso Base (segundos)
                  </label>
                  <div className="form-hint" style={{ marginTop: 0 }}>
                    El tiempo que se aplicará por defecto a todos los ejercicios si no configuras
                    uno específico.
                  </div>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  style={{ width: '80px', textAlign: 'center', fontWeight: 600 }}
                  value={restPreset}
                  onChange={(e) => setRestPreset(Number(e.target.value) || 90)}
                  min="0"
                  step="15"
                />
              </div>

              <div
                className="form-group"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <label className="form-label" style={{ marginBottom: '2px' }}>
                    Mostrar RPE (Esfuerzo Percibido)
                  </label>
                  <div className="form-hint" style={{ marginTop: 0 }}>
                    Muestra una columna de RPE en los ejercicios para medir la intensidad (1-10)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={workoutSettings?.showRpe ?? false}
                  onChange={(e) =>
                    setWorkoutSettings({ ...workoutSettings, showRpe: e.target.checked })
                  }
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>

              <div
                style={{
                  marginTop: '1.5rem',
                  borderTop: '1px dashed var(--border-subtle)',
                  paddingTop: '1.5rem',
                }}
              >
                <label className="form-label" style={{ marginBottom: '2px' }}>
                  Ocultar material no disponible
                </label>
                <div className="form-hint" style={{ marginTop: 0, marginBottom: '1rem' }}>
                  Los ejercicios que usen estos materiales no aparecerán en las búsquedas ni en los
                  catálogos.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    'barra',
                    'mancuernas',
                    'maquina',
                    'multipower',
                    'polea',
                    'banda',
                    'kettlebell',
                    'peso corporal',
                  ].map((eq) => {
                    const isHidden = hiddenEquipments.includes(eq);
                    return (
                      <label
                        key={eq}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          color: isHidden ? 'var(--text-muted)' : 'var(--text-secondary)',
                          textDecoration: isHidden ? 'line-through' : 'none',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isHidden}
                          onChange={() => toggleHiddenEquipment(eq)}
                        />
                        {eq === 'multipower' ? 'Multipower (Smith)' : eq}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.5rem',
                  borderTop: '1px dashed var(--border-subtle)',
                  paddingTop: '1.5rem',
                }}
              >
                <label className="form-label">Importar desde Hevy</label>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginBottom: 'var(--space-md)',
                  }}
                >
                  Sube el archivo{' '}
                  <span style={{ color: 'var(--text-primary)' }}>workout_data.csv</span> exportado
                  de Hevy.
                </p>{' '}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  La importación de CSV se ha deshabilitado temporalmente debido a la migración a la
                  nube. Volverá pronto.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 5. Account / Logout */}
        <div
          className="card accordion-card"
          style={{
            padding: 'var(--space-lg)',
            transition: 'all 0.25s ease',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex items-center gap-2">
              <LogOut size={20} style={{ color: 'var(--color-danger, #ef4444)' }} />
              <span
                className="card-title"
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-danger, #ef4444)',
                }}
              >
                Cuenta
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: '1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '1.25rem',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Descarga todos tus datos de peso registrados en un archivo CSV.
            </p>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '1.5rem' }}
              onClick={handleExportData}
            >
              Exportar Datos a CSV
            </button>
            <div
              style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '1.5rem 0' }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Cierra tu sesión de forma segura en este dispositivo.
            </p>
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
              }}
              onClick={() => {
                logout();
                toast.success('Sesión cerrada');
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





