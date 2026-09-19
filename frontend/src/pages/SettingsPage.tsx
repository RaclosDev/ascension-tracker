import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import MealConfigurator from '../components/MealConfigurator';
import { useWorkoutStore } from '../lib/workout/store';
import { importHevyCSV } from '../lib/workout/import';
import { useAuth } from '../context/AuthContext';
import { applyThemeColor } from '../utils/colorHelper';
import { Palette, ChevronDown, User, Scale, Activity, Dumbbell, Utensils } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState<any>({
    startDate: '',
    macroStrategy: 'BALANCED',
    customProteinPct: '', customFatPct: '', customCarbsPct: '',
    customProteinGrams: '', customFatGrams: '', customCarbsGrams: '',
    kcal: '',
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [openSections, setOpenSections] = useState<any>({
    personal: false,
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
  const importWorkouts = useWorkoutStore((s) => s.importWorkouts);
  const customExercises = useWorkoutStore((s) => s.customExercises);
  const fileInputRef = useRef(null);
  const { logout } = useAuth();

  const PRESETS = ['#0085FF', '#E11D48', '#FFFFFF', '#FF5E00', '#8B5CF6'];
  const [customColor, setCustomColor] = useState(localStorage.getItem('ascension_custom_color') || '#0085FF');
  const handleColorChange = (color: string) => {
    setCustomColor(color);
    applyThemeColor(color);
  };


  const handleImportHevy = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importHevyCSV(
      file,
      customExercises,
      (workouts, newCustom) => {
        importWorkouts(workouts, newCustom);
        toast.success(`Importados ${workouts.length} entrenamientos`);
      },
      (err) => {
        toast.error(`Error al importar: ${err.message}`);
      }
    );
  };

  useEffect(() => {
    if (location.hash === '#meals') {
      setOpenSections(prev => ({ ...prev, meals: true }));
      setTimeout(() => {
        const el = document.getElementById('meals-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.hash]);

  const toggleSection = (key, e) => {
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
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchData = useCallback(async () => {
    try {
      const settingsRes = await api.get('/settings');
      setSettings(settingsRes.data);
      setForm({
        ...settingsRes.data,
        macroStrategy: settingsRes.data.macroStrategy || 'BALANCED',
        customProteinPct: settingsRes.data.customProteinPct || 30,
        customFatPct: settingsRes.data.customFatPct || 35,
        customCarbsPct: settingsRes.data.customCarbsPct || 35,
        customProteinGrams: settingsRes.data.customProteinGrams || 150,
        customFatGrams: settingsRes.data.customFatGrams || 60,
        customCarbsGrams: settingsRes.data.customCarbsGrams || 150,
      });
    } catch {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const parseSafeFloat = (val, fallback = 0) => {
    if (val === null || val === undefined || val === '') return fallback;
    const normalized = String(val).replace(',', '.').trim();
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? fallback : parsed;
  };

  const handleSavePersonal = async () => {
    try {
      await api.put('/settings', {
        startWeight: parseSafeFloat(form.startWeight, settings?.startWeight || 89.4),
        goalWeight: parseSafeFloat(form.goalWeight, settings?.goalWeight || 74.0),
        weeklyGoal: parseSafeFloat(form.weeklyGoal, settings?.weeklyGoal || 1.0),
        startDate: form.startDate || settings?.startDate || '2026-05-25',
      });
      toast.success('Datos personales guardados');
      fetchData();
    } catch (err) {
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
        startWeight: parseSafeFloat(form.startWeight, settings?.startWeight || 89.4),
        goalWeight: parseSafeFloat(form.goalWeight, settings?.goalWeight || 74.0),
        weeklyGoal: parseSafeFloat(form.weeklyGoal, settings?.weeklyGoal || 1.0),
        startDate: form.startDate || settings?.startDate || '2026-05-25',
        macroStrategy: strategy,
        kcal: payloadKcal,
        customProteinGrams: pG,
        customFatGrams: fG,
        customCarbsGrams: cG,
        customProteinPct: pP,
        customFatPct: fP,
        customCarbsPct: cP,
      });
      toast.success('¡Objetivos de macros guardados!');
      fetchData();
    } catch (err) {
      console.error('Error al guardar macros:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error('Error al guardar objetivos');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!settings) return null;

  return (
    <div className="fade-in">
      <div className="settings-accordion-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* 1. Personal Data */}
        <div className="card accordion-card" style={{ padding: openSections.personal ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease' }}>
          <div 
            className="accordion-header" 
            onClick={(e) => toggleSection('personal', e)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}> Datos Personales</span>
            <span style={{ transform: openSections.personal ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              
            </span>
          </div>
          {openSections.personal && (
            <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <h4 className="subsection-title">Métricas Corporales</h4>
              <div className="form-group">
                <label className="form-label">Peso Inicial (kg)</label>
                <input
                  type="number" inputMode="decimal"
                  className="form-input"
                  step="0.1"
                  value={form.startWeight || ''}
                  onChange={e => setForm({ ...form, startWeight: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Peso Deseado (kg)</label>
                <input
                  type="number" inputMode="decimal"
                  className="form-input"
                  step="0.1"
                  value={form.goalWeight || ''}
                  onChange={e => setForm({ ...form, goalWeight: e.target.value })}
                />
              </div>
              <h4 className="subsection-title">Progreso y Fechas</h4>
              <div className="form-group">
                <label className="form-label">Objetivo de Pérdida Semanal (kg)</label>
                <input
                  type="number" inputMode="decimal"
                  className="form-input"
                  step="0.1"
                  min="0.1"
                  max="2"
                  value={form.weeklyGoal || ''}
                  onChange={e => setForm({ ...form, weeklyGoal: e.target.value })}
                />
                <div className="form-hint">Recomendado: 0.5  1.0 kg/semana para pérdida saludable</div>
              </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: 'auto', minWidth: '180px', maxWidth: '100%' }}
                    value={form.startDate || ''}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleSavePersonal}>
                Guardar Cambios
              </button>
            </div>
          )}
        </div>

        {/* 2. Macro Strategy */}
        <div className="card accordion-card" style={{ padding: openSections.macros ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease' }}>
          <div 
            className="accordion-header" 
            onClick={(e) => toggleSection('macros', e)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}> Estrategia de Macros</span>
            <span style={{ transform: openSections.macros ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              
            </span>
          </div>
          {openSections.macros && (
            <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <h4 className="subsection-title">Estrategia General</h4>
              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label">Modo de Cálculo</label>
                <select 
                  className="form-input" 
                  value={form.macroStrategy || 'CUSTOM_GRAMS'} 
                  onChange={(e) => setForm({...form, macroStrategy: e.target.value})}
                >
                  <option value="CUSTOM_GRAMS">Gramos Exactos (Recomendado )</option>
                  <option value="CUSTOM_PCT">Porcentajes (%)</option>
                  <option value="BALANCED">Balanceada Automática </option>
                </select>
              </div>

              {/* MODE: CUSTOM_GRAMS */}
              {form.macroStrategy === 'CUSTOM_GRAMS' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-protein-light, #a78bfa)' }}> Proteínas (g)</label>
                      <input
                        type="number" inputMode="decimal"
                        className="form-input"
                        value={form.customProteinGrams ?? ''}
                        onChange={e => setForm({...form, customProteinGrams: e.target.value})}
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-fat)' }}> Grasas (g)</label>
                      <input
                        type="number" inputMode="decimal"
                        className="form-input"
                        value={form.customFatGrams ?? ''}
                        onChange={e => setForm({...form, customFatGrams: e.target.value})}
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}> Hidratos (g)</label>
                      <input
                        type="number" inputMode="decimal"
                        className="form-input"
                        value={form.customCarbsGrams ?? ''}
                        onChange={e => setForm({...form, customCarbsGrams: e.target.value})}
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  {/* Live Calculations Summary */}
                  {(() => {
                    const p = parseSafeFloat(form.customProteinGrams, 0);
                    const f = parseSafeFloat(form.customFatGrams, 0);
                    const c = parseSafeFloat(form.customCarbsGrams, 0);
                    const totalK = Math.round(p * 4 + f * 9 + c * 4);
                    const pP = totalK > 0 ? Math.round((p * 4 / totalK) * 100) : 0;
                    const fP = totalK > 0 ? Math.round((f * 9 / totalK) * 100) : 0;
                    const cP = totalK > 0 ? Math.round((c * 4 / totalK) * 100) : 0;
                    return (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calorías calculadas:</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                             {totalK} kcal
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--color-protein-light, #a78bfa)' }}>P: {p}g ({pP}%)</span>
                          <span></span>
                          <span style={{ color: 'var(--color-fat)' }}>G: {f}g ({fP}%)</span>
                          <span></span>
                          <span style={{ color: 'var(--color-warning)' }}>H: {c}g ({cP}%)</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Optional Helper: adjust carbs to target kcal */}
                  <div style={{ background: 'var(--accent-glow)', border: '1px dashed var(--border-accent)', borderRadius: '10px', padding: '10px', marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>¿Objetivo específico de kcal?</label>
                        <input
                          type="number" inputMode="decimal"
                          className="form-input"
                          style={{ height: '32px', fontSize: '0.85rem' }}
                          value={form.kcal || ''}
                          placeholder="Ej: 2000"
                          onChange={e => setForm({...form, kcal: e.target.value})}
                          step="50"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ alignSelf: 'flex-end', height: '32px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                        onClick={() => {
                          const target = parseSafeFloat(form.kcal, 2000);
                          const p = parseSafeFloat(form.customProteinGrams, 0);
                          const f = parseSafeFloat(form.customFatGrams, 0);
                          const rem = target - (p * 4 + f * 9);
                          if (rem <= 0) {
                            toast.error('Proteínas y grasas ya superan las calorías objetivo');
                            return;
                          }
                          const needed = Math.round(rem / 4);
                          setForm(prev => ({ ...prev, customCarbsGrams: needed }));
                          toast.success(`Hidratos ajustados a ${needed}g`);
                        }}
                      >
                         Cuadrar hidratos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE: CUSTOM_PCT */}
              {form.macroStrategy === 'CUSTOM_PCT' && (
                <div>
                  <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                    <label className="form-label"> Calorías Totales Objetivo</label>
                    <input 
                      type="number" inputMode="decimal" 
                      className="form-input" 
                      value={form.kcal || ''} 
                      onChange={e => setForm({...form, kcal: e.target.value})}
                      step="50"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    {(() => {
                      const currentKcal = parseSafeFloat(form.kcal, 2000);
                      const pP = parseSafeFloat(form.customProteinPct, 0);
                      const fP = parseSafeFloat(form.customFatPct, 0);
                      const cP = parseSafeFloat(form.customCarbsPct, 0);
                      return (
                        <>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-protein-light, #a78bfa)' }}>% Proteínas</label>
                            <input type="number" inputMode="decimal" className="form-input" value={form.customProteinPct ?? ''} onChange={e => setForm({...form, customProteinPct: e.target.value})} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> {Math.round((currentKcal * (pP / 100)) / 4)}g</span>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-fat)' }}>% Grasas</label>
                            <input type="number" inputMode="decimal" className="form-input" value={form.customFatPct ?? ''} onChange={e => setForm({...form, customFatPct: e.target.value})} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> {Math.round((currentKcal * (fP / 100)) / 9)}g</span>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>% Hidratos</label>
                            <input type="number" inputMode="decimal" className="form-input" value={form.customCarbsPct ?? ''} onChange={e => setForm({...form, customCarbsPct: e.target.value})} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> {Math.round((currentKcal * (cP / 100)) / 4)}g</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {(() => {
                    const pP = parseSafeFloat(form.customProteinPct, 0);
                    const fP = parseSafeFloat(form.customFatPct, 0);
                    const cP = parseSafeFloat(form.customCarbsPct, 0);
                    const totalPct = Math.round((pP + fP + cP) * 10) / 10;
                    const isExact = Math.abs(totalPct - 100) < 0.5;
                    return (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isExact ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${isExact ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        marginBottom: 'var(--space-md)'
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isExact ? 'var(--color-success)' : 'var(--color-fat)' }}>
                          {isExact ? ' Suma: 100%' : ` Suma: ${totalPct}% (Falta/Sobra: ${(100 - totalPct).toFixed(1)}%)`}
                        </span>
                        {!isExact && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => {
                              const rem = Math.max(0, 100 - pP - fP);
                              setForm(prev => ({ ...prev, customCarbsPct: rem }));
                              toast.success(`Hidratos fijados a ${rem}%`);
                            }}
                          >
                             Ajustar a 100%
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* MODE: BALANCED */}
              {form.macroStrategy === 'BALANCED' && (
                <div>
                  <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                    <label className="form-label"> Calorías Totales Objetivo</label>
                    <input 
                      type="number" inputMode="decimal" 
                      className="form-input" 
                      value={form.kcal || ''} 
                      onChange={e => setForm({...form, kcal: e.target.value})}
                      step="50"
                    />
                  </div>

                  {(() => {
                    const currentKcal = parseSafeFloat(form.kcal, 2000);
                    const w = parseSafeFloat(form.startWeight, 80);
                    const bP = Math.round(w * 2);
                    const bF = Math.round((currentKcal * 0.22) / 9);
                    const bC = Math.max(0, Math.round((currentKcal - bP * 4 - bF * 9) / 4));
                    return (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', marginBottom: 'var(--space-md)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>Cálculo automático:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <div> <strong>Proteínas:</strong> ~{bP}g (2g por kg peso)</div>
                          <div> <strong>Grasas:</strong> ~{bF}g (22% de calorías)</div>
                          <div> <strong>Hidratos:</strong> ~{bC}g (resto para rendimiento)</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleSaveMacros}>
                Guardar Macros
              </button>
            </div>
          )}
        </div>

        {/* 3. Meals */}
        <div id="meals-section" className="card accordion-card" style={{ padding: openSections.meals ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease' }}>
          <div 
            className="accordion-header" 
            onClick={(e) => toggleSection('meals', e)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}> Configurar Comidas</span>
            <span style={{ transform: openSections.meals ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              
            </span>
          </div>
          {openSections.meals && (
            <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <MealConfigurator onSaved={fetchData} />
            </div>
          )}
        </div>


        {/* THEME & APPEARANCE */}
        <div className="card accordion-card" style={{ padding: openSections.theme ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease', marginBottom: '1rem' }}>
          <div 
            className="accordion-header"
            onClick={(e) => toggleSection('theme', e)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Palette size={20} className="text-primary" />
              <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Tema y Apariencia</span>
            </div>
            <span style={{ transform: openSections.theme ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              
            </span>
          </div>
          {openSections.theme && (
            <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Color Principal</label>
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
                      background: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {PRESETS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: color, border: customColor === color ? '2px solid white' : '2px solid transparent',
                          cursor: 'pointer', padding: 0, transition: 'transform 0.1s'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                  El color acento que elegiste es el {customColor}. ¡Se aplicará instantáneamente en toda la aplicación!
                </p>
              </div>

            </div>
          )}
        </div>

        {/* 4. Workout */}
        <div className="card accordion-card" style={{ padding: openSections.workout ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease' }}>
          <div 
            className="accordion-header" 
            onClick={(e) => toggleSection('workout', e)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}> Entrenamiento</span>
            <span style={{ transform: openSections.workout ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              
            </span>
          </div>
          {openSections.workout && (
            <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ paddingRight: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '2px' }}> Descanso Base (segundos)</label>
                  <div className="form-hint" style={{ marginTop: 0 }}>El tiempo que se aplicará por defecto a todos los ejercicios si no configuras uno específico.</div>
                </div>
                <input
                  type="number" inputMode="decimal"
                  className="form-input"
                  style={{ width: '80px', textAlign: 'center', fontWeight: 600 }}
                  value={restPreset}
                  onChange={(e) => setRestPreset(Number(e.target.value) || 90)}
                  min="0"
                  step="15"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '2px' }}>Mostrar RPE (Esfuerzo Percibido)</label>
                  <div className="form-hint" style={{ marginTop: 0 }}>Muestra una columna de RPE en los ejercicios para medir la intensidad (1-10)</div>
                </div>
                <input
                  type="checkbox"
                  checked={workoutSettings?.showRpe ?? false}
                  onChange={(e) => setWorkoutSettings({ ...workoutSettings, showRpe: e.target.checked })}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '2px' }}>Ocultar material no disponible</label>
                <div className="form-hint" style={{ marginTop: 0, marginBottom: '1rem' }}>
                  Los ejercicios que usen estos materiales no aparecerán en las búsquedas ni en los catálogos.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {['barra', 'mancuernas', 'maquina', 'multipower', 'polea', 'banda', 'kettlebell', 'peso corporal'].map((eq) => {
                    const isHidden = hiddenEquipments.includes(eq);
                    return (
                      <label key={eq} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        fontSize: '0.85rem', 
                        color: isHidden ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: isHidden ? 'line-through' : 'none',
                        cursor: 'pointer', 
                        textTransform: 'capitalize' 
                      }}>
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

              <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '1.5rem' }}>
                <label className="form-label">Importar desde Hevy</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
                  Sube el archivo <span style={{ color: 'var(--text-primary)' }}>workout_data.csv</span> exportado de Hevy.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImportHevy}
                />
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span></span> Seleccionar archivo CSV de Hevy
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

