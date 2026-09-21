import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../../api/client';
import CalculatorCard from './CalculatorCard';
import {
  ACTIVITY_LEVELS,
  parseNumber,
  calcBmr,
  calcTdee,
  findIntakeForGoal,
  simulateWeightChange,
  assessPlan,
  calcMacros,
  calcBodyFatNavy,
  calcBodyComposition,
  weeklyGoalToDailyDeficit
} from '../../utils/nutritionCalculators';

export default function NutritionCalculators() {
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [age, setAge] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [activityFactor, setActivityFactor] = useState<string>('1.375');

  const [goalWeight, setGoalWeight] = useState<string>('');
  const [weeks, setWeeks] = useState<string>('12');
  const [settingsWeeklyGoal, setSettingsWeeklyGoal] = useState<number | null>(null);

  const [customKcal, setCustomKcal] = useState<string>('');
  const [proteinPerKg, setProteinPerKg] = useState<string>('2.0');
  const [fatPerKg, setFatPerKg] = useState<string>('0.75');

  const [waistCm, setWaistCm] = useState<string>('');
  const [neckCm, setNeckCm] = useState<string>('');
  const [hipCm, setHipCm] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('ascension_calc_profile');
    let loadedWeight = false;
    let loadedGoal = false;

    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.sex) setSex(p.sex);
        if (p.age) setAge(p.age);
        if (p.heightCm) setHeightCm(p.heightCm);
        if (p.activityFactor) setActivityFactor(p.activityFactor);
        if (p.weightKg) { setWeightKg(p.weightKg); loadedWeight = true; }
      } catch (e) {}
    }

    Promise.allSettled([
      api.get('/weights/dashboard'),
      api.get('/settings')
    ]).then(([weightsRes, settingsRes]) => {
      if (!loadedWeight && weightsRes.status === 'fulfilled' && weightsRes.value.data.currentWeight) {
        setWeightKg(String(weightsRes.value.data.currentWeight.weight));
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        if (settingsRes.value.data.goalWeight) {
          setGoalWeight(String(settingsRes.value.data.goalWeight));
        }
        if (settingsRes.value.data.weeklyGoal) {
          setSettingsWeeklyGoal(settingsRes.value.data.weeklyGoal);
        }
      }
    });
  }, []);

  useEffect(() => {
    const profile = { sex, age, heightCm, weightKg, activityFactor };
    localStorage.setItem('ascension_calc_profile', JSON.stringify(profile));
  }, [sex, age, heightCm, weightKg, activityFactor]);

  const pAge = parseNumber(age);
  const pHeight = parseNumber(heightCm);
  const pWeight = parseNumber(weightKg);
  const pAct = parseNumber(activityFactor) || 1.2;

  const bmr = (pWeight && pHeight && pAge) ? calcBmr(sex, pWeight, pHeight, pAge) : null;
  const tdee = bmr ? calcTdee(bmr, pAct) : null;

  // Plan logic
  const pGoal = parseNumber(goalWeight);
  const pWeeks = parseNumber(weeks);

  const planParams = useMemo(() => {
    if (!tdee || !bmr || !pWeight || !pHeight || !pAge || !pGoal || !pWeeks) return null;
    if (pGoal >= pWeight || !Number.isInteger(pWeeks) || pWeeks < 1) return null;

    const intake = findIntakeForGoal(sex, pAge, pHeight, pWeight, pGoal, pAct, pWeeks);
    if (!intake) return { unreachable: true };

    const initialDeficit = tdee - intake;
    const weeklyRateKg = (pWeight - pGoal) / pWeeks;
    
    const warnings = assessPlan(pWeight, weeklyRateKg, initialDeficit, tdee, intake, bmr);
    const sim = simulateWeightChange({ sex, age: pAge, heightCm: pHeight, weightKg: pWeight, activityFactor: pAct, intakeKcal: intake, weeks: pWeeks });
    
    const finalTdee = sim ? sim[sim.length - 1].tdee : tdee;
    const finalDeficit = finalTdee - intake;

    return {
      intake,
      initialDeficit,
      finalDeficit,
      weeklyRateKg,
      ratePct: (weeklyRateKg / pWeight) * 100,
      warnings,
      sim
    };
  }, [tdee, bmr, pWeight, pHeight, pAge, pGoal, pWeeks, pAct, sex]);

  // Macros logic
  const effectiveKcalForMacros = parseNumber(customKcal) || (planParams && !planParams.unreachable ? planParams.intake : tdee);
  const pProt = parseNumber(proteinPerKg) || 2;
  const pFat = parseNumber(fatPerKg) || 0.75;

  const macros = (effectiveKcalForMacros && pWeight) 
    ? calcMacros({ kcal: effectiveKcalForMacros, weightKg: pWeight, proteinPerKg: pProt, fatPerKg: pFat }) 
    : null;

  // Body Fat logic
  const pWaist = parseNumber(waistCm);
  const pNeck = parseNumber(neckCm);
  const pHip = parseNumber(hipCm);
  
  const bfPct = calcBodyFatNavy({
    sex, heightCm: pHeight || 0, waistCm: pWaist || 0, neckCm: pNeck || 0, hipCm: pHip || 0
  });
  const bodyComp = (bfPct && pWeight) ? calcBodyComposition(pWeight, bfPct) : null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Calculadoras de Nutrición</h2>

      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <h3 className="card-title" style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Tus datos base</h3>
        <div className="utilities-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="calc-sex">Sexo</label>
            <select id="calc-sex" className="form-input" value={sex} onChange={e => setSex(e.target.value as 'M'|'F')}>
              <option value="M">Hombre</option>
              <option value="F">Mujer</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-age">Edad</label>
            <input id="calc-age" type="number" className="form-input" value={age} onChange={e => setAge(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-height">Altura (cm)</label>
            <input id="calc-height" type="number" className="form-input" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-weight">Peso actual (kg)</label>
            <input id="calc-weight" type="number" className="form-input" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="calc-activity">Nivel de Actividad</label>
            <select id="calc-activity" className="form-input" value={activityFactor} onChange={e => setActivityFactor(e.target.value)}>
              {ACTIVITY_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <CalculatorCard title="Gasto de mantenimiento (TDEE)">
        {tdee ? (
          <div>
            <div className="kpi-card" style={{ marginBottom: '16px', textAlign: 'center', padding: '24px' }}>
              <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{Math.round(tdee)} kcal</div>
              <div className="kpi-detail">Gasto Energético Diario (TDEE)</div>
              <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Tu metabolismo basal (BMR) es de {Math.round(bmr!)} kcal.<br/>
                Para definir, un déficit moderado del 15-20% sería comer entre {Math.round(tdee * 0.8)} y {Math.round(tdee * 0.85)} kcal.
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rellena tu sexo, edad, altura y peso en "Tus datos base".</p>
        )}
      </CalculatorCard>

      <CalculatorCard title="Plan de déficit y plazo">
        <div className="utilities-grid" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-goal">Peso objetivo (kg)</label>
            <input id="calc-goal" type="number" className="form-input" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-weeks">Plazo (semanas)</label>
            <input id="calc-weeks" type="number" className="form-input" value={weeks} onChange={e => setWeeks(e.target.value)} min={1} max={104} />
          </div>
        </div>
        
        {settingsWeeklyGoal && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Nota: Tienes un ritmo configurado en Ajustes de {settingsWeeklyGoal} kg/semana, que equivale a un déficit fijo de unos {Math.round(weeklyGoalToDailyDeficit(settingsWeeklyGoal))} kcal/día.
          </p>
        )}

        {!tdee && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Faltan datos base.</p>}
        {tdee && (!pGoal || !pWeeks) && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rellena el peso objetivo y el plazo.</p>}
        {tdee && pGoal && pWeight && pGoal >= pWeight && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>El peso objetivo debe ser menor al actual (solo pérdida de peso).</p>}
        {tdee && pGoal && pWeight && pGoal < pWeight && planParams?.unreachable && (
          <div className="kpi-card danger" role="alert" style={{ marginBottom: '16px' }}>
            <strong>Inalcanzable:</strong> No puedes perder tanto peso en tan poco tiempo, incluso comiendo 0 calorías. Aumenta el plazo.
          </div>
        )}

        {tdee && planParams && !planParams.unreachable && (
          <div>
            <div className="kpi-card" style={{ marginBottom: '16px', textAlign: 'center', padding: '24px' }}>
              <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{Math.round(planParams.intake)} kcal</div>
              <div className="kpi-detail">Ingesta diaria objetivo</div>
            </div>

            <div className="utilities-grid" style={{ marginBottom: '16px' }}>
              <div className="kpi-card">
                <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{Math.round(planParams.initialDeficit)} <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>→ {Math.round(planParams.finalDeficit)}</span></div>
                <div className="kpi-detail">Déficit Diario (kcal)</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{planParams.weeklyRateKg.toFixed(2)} kg</div>
                <div className="kpi-detail">Ritmo semanal ({planParams.ratePct.toFixed(1)}%)</div>
              </div>
            </div>

            {planParams.warnings.map((w, i) => (
              <div key={i} role="alert" className={`kpi-card ${w.level}`} style={{ marginBottom: '8px', borderLeft: `4px solid var(--color-${w.level === 'danger' ? 'fat' : 'carbs'})` }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: w.level === 'danger' ? 'var(--color-fat)' : 'var(--color-carbs)' }}>Aviso de seguridad</strong>
                <span style={{ fontSize: '0.9rem' }}>{w.message}</span>
              </div>
            ))}

            {planParams.sim && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Proyección de peso</h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <AreaChart data={planParams.sim} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="week" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-glass-strong)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                        labelFormatter={(l) => `Semana ${l}`}
                      />
                      <ReferenceLine y={pGoal} stroke="var(--color-carbs)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Objetivo', fill: 'var(--color-carbs)', fontSize: 12 }} />
                      <Area type="monotone" dataKey="weightKg" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </CalculatorCard>

      <CalculatorCard title="Macros por peso corporal">
        <div className="utilities-grid" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-macros-kcal">Calorías a repartir</label>
            <input 
              id="calc-macros-kcal" 
              type="number" 
              className="form-input" 
              value={customKcal} 
              onChange={e => setCustomKcal(e.target.value)} 
              placeholder={effectiveKcalForMacros ? String(Math.round(effectiveKcalForMacros)) : ''}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-macros-prot">Proteína (g/kg)</label>
            <input id="calc-macros-prot" type="number" step="0.1" className="form-input" value={proteinPerKg} onChange={e => setProteinPerKg(e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="calc-macros-fat">Grasas (g/kg)</label>
            <input id="calc-macros-fat" type="number" step="0.05" className="form-input" value={fatPerKg} onChange={e => setFatPerKg(e.target.value)} />
          </div>
        </div>

        {!pWeight && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Falta tu peso en "Tus datos base".</p>}
        {pWeight && macros && (
          <div>
            <div className="utilities-grid" style={{ marginBottom: '16px' }}>
              <div className="kpi-card" style={{ borderTop: '3px solid var(--color-protein)' }}>
                <div className="kpi-value">{Math.round(macros.proteinG)}g</div>
                <div className="kpi-detail">Proteínas ({Math.round(macros.proteinPct)}%)</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '3px solid var(--color-fat)' }}>
                <div className="kpi-value">{Math.round(macros.fatG)}g</div>
                <div className="kpi-detail">Grasas ({Math.round(macros.fatPct)}%)</div>
              </div>
              <div className="kpi-card" style={{ borderTop: '3px solid var(--color-carbs)' }}>
                <div className="kpi-value">{Math.round(macros.carbsG)}g</div>
                <div className="kpi-detail">Carbos ({Math.round(macros.carbsPct)}%)</div>
              </div>
            </div>
            {macros.overBudgetKcal > 0 && (
              <div role="alert" className="kpi-card danger" style={{ borderLeft: '4px solid var(--color-fat)' }}>
                <strong style={{ color: 'var(--color-fat)' }}>Aviso:</strong> Proteínas y grasas suman más calorías que tu objetivo total. Faltan {Math.round(macros.overBudgetKcal)} kcal. Sube las calorías totales o baja los g/kg.
              </div>
            )}
          </div>
        )}
      </CalculatorCard>

      <CalculatorCard title="% de grasa corporal (método Marina)">
        <div className="utilities-grid" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-bf-waist">Cintura (cm)</label>
            <input id="calc-bf-waist" type="number" className="form-input" value={waistCm} onChange={e => setWaistCm(e.target.value)} placeholder="A la altura del ombligo" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-bf-neck">Cuello (cm)</label>
            <input id="calc-bf-neck" type="number" className="form-input" value={neckCm} onChange={e => setNeckCm(e.target.value)} placeholder="Por debajo de la nuez" />
          </div>
          {sex === 'F' && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="calc-bf-hip">Cadera (cm)</label>
              <input id="calc-bf-hip" type="number" className="form-input" value={hipCm} onChange={e => setHipCm(e.target.value)} placeholder="Parte más ancha" />
            </div>
          )}
        </div>
        
        {bfPct ? (
          <div>
            <div className="kpi-card" style={{ marginBottom: '16px', textAlign: 'center', padding: '24px' }}>
              <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{bfPct.toFixed(1)}%</div>
              <div className="kpi-detail">Grasa Corporal Estimada</div>
            </div>
            {bodyComp && (
               <div className="utilities-grid">
                <div className="kpi-card">
                  <div className="kpi-value">{bodyComp.fatKg.toFixed(1)} kg</div>
                  <div className="kpi-detail">Masa Grasa</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value">{bodyComp.leanKg.toFixed(1)} kg</div>
                  <div className="kpi-detail">Masa Magra</div>
                </div>
               </div>
            )}
            <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Nota: Este método tiene un margen de error de ±3-4%. Para mayor precisión usa plicómetros (calipers) o DEXA.
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Faltan medidas para calcular (o los valores no son válidos).</p>
        )}
      </CalculatorCard>

      <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Las calculadoras proporcionan estimaciones orientativas basadas en fórmulas estándar. No sustituyen el consejo de un profesional médico o nutricionista.
      </p>
    </div>
  );
}
