import React from 'react';
import toast from 'react-hot-toast';

const parseSafeFloat = (val: any, fallback = 0) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

export interface MacroForm {
  macroStrategy: string;
  kcal: number | string;
  customProteinGrams: number | string;
  customFatGrams: number | string;
  customCarbsGrams: number | string;
  customProteinPct: number | string;
  customFatPct: number | string;
  customCarbsPct: number | string;
  startWeight: number | string;
  goalWeight: number | string;
  [key: string]: any;
}

interface MacroConfiguratorProps {
  form: MacroForm;
  setForm: any;
}

export default function MacroConfigurator({ form, setForm }: MacroConfiguratorProps) {
  return (
    <div>
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


    </div>
  );
}
