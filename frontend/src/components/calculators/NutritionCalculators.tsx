import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import CalculatorCard from './CalculatorCard';
import {
  KCAL_PER_KG_FAT,
  parseNumber,
  calcBmr,
  calcTdee,
  calcMacros,
  calcStepsKcal,
  calcBodyFatNavy,
  calcBodyComposition
} from '../../utils/nutritionCalculators';

export default function NutritionCalculators() {
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [age, setAge] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [activityFactor, setActivityFactor] = useState<string>('1.2');

  // Plan inputs
  const [goalWeight, setGoalWeight] = useState<string>('');
  const [weeks, setWeeks] = useState<string>('16');
  const [dailySteps, setDailySteps] = useState<string>('10000');

  // Body fat inputs
  const [waistCm, setWaistCm] = useState<string>('');
  const [neckCm, setNeckCm] = useState<string>('');
  const [hipCm, setHipCm] = useState<string>('');

  useEffect(() => {
    Promise.allSettled([
      api.get('/weights/dashboard'),
      api.get('/settings')
    ]).then(([weightsRes, settingsRes]) => {
      if (weightsRes.status === 'fulfilled' && weightsRes.value.data.currentWeight) {
        setWeightKg(String(weightsRes.value.data.currentWeight));
      }
      if (settingsRes.status === 'fulfilled') {
        const s = settingsRes.value.data;
        if (s.age) setAge(String(s.age));
        if (s.heightCm) setHeightCm(String(s.heightCm));
        if (s.sex) setSex(s.sex);
        if (s.activityFactor) setActivityFactor(String(s.activityFactor));
        if (s.goalWeight) setGoalWeight(String(s.goalWeight));
      }
    });
  }, []);

  // Base calculations
  const pAge = parseNumber(age);
  const pHeight = parseNumber(heightCm);
  const pWeight = parseNumber(weightKg);
  const pAct = parseNumber(activityFactor) || 1.2;

  const bmr = (pWeight && pHeight && pAge) ? calcBmr(sex, pWeight, pHeight, pAge) : null;
  const tdee = bmr ? calcTdee(bmr, pAct) : null;

  // Plan calculations
  const pGoal = parseNumber(goalWeight);
  const pWeeks = parseNumber(weeks);
  const pSteps = parseNumber(dailySteps);

  const plan = useMemo(() => {
    if (!tdee || !bmr || !pWeight || !pGoal || !pWeeks || pWeeks < 1) return null;
    if (pGoal >= pWeight) return null;

    const totalKgToLose = pWeight - pGoal;
    const totalKcalToLose = totalKgToLose * KCAL_PER_KG_FAT;
    const totalDays = pWeeks * 7;
    const dailyDeficitNeeded = totalKcalToLose / totalDays;
    const weeklyRate = totalKgToLose / pWeeks;
    const ratePct = (weeklyRate / pWeight) * 100;

    // Steps contribution
    const stepsKcal = pSteps && pWeight ? calcStepsKcal(pWeight, pSteps) : 0;

    // TDEE already includes the base activity factor (sedentary etc.)
    // Steps burn is ADDITIONAL activity on top of TDEE
    const tdeeWithSteps = tdee + stepsKcal;

    // How much diet restriction is needed after steps
    const dietDeficit = Math.max(0, dailyDeficitNeeded - stepsKcal);
    const dailyIntake = tdee - dietDeficit; // what you eat (before steps bonus)
    // Alternatively: dailyIntake = tdeeWithSteps - dailyDeficitNeeded

    // Warnings
    const warnings: { level: 'warning' | 'danger'; msg: string }[] = [];

    if (ratePct > 1.5) {
      warnings.push({ level: 'danger', msg: `Ritmo del ${ratePct.toFixed(1)}% semanal: riesgo de pérdida muscular. Aumenta el plazo.` });
    } else if (ratePct > 1) {
      warnings.push({ level: 'warning', msg: `Ritmo del ${ratePct.toFixed(1)}% semanal: agresivo pero viable si mantienes proteína alta.` });
    }

    if (dailyIntake < bmr) {
      warnings.push({ level: 'danger', msg: `Ingesta de ${Math.round(dailyIntake)} kcal por debajo de tu BMR (${Math.round(bmr)} kcal). Sube los pasos o aumenta el plazo.` });
    }

    const deficitPctOfTdee = (dietDeficit / tdee) * 100;
    if (deficitPctOfTdee > 30) {
      warnings.push({ level: 'warning', msg: `La restricción calórica representa el ${Math.round(deficitPctOfTdee)}% de tu TDEE. Considera añadir más pasos.` });
    }

    if (stepsKcal > 0 && stepsKcal >= dailyDeficitNeeded) {
      warnings.push({ level: 'warning', msg: `¡Solo con los pasos ya cubres el déficit! Puedes comer a mantenimiento (${Math.round(tdee)} kcal) y perder peso.` });
    }

    // Macros on the resulting intake
    const macros = pWeight ? calcMacros({ kcal: dailyIntake, weightKg: pWeight }) : null;

    return {
      totalKgToLose,
      totalKcalToLose,
      dailyDeficitNeeded,
      weeklyRate,
      stepsKcal,
      dietDeficit,
      dailyIntake,
      tdeeWithSteps,
      macros,
      warnings
    };
  }, [tdee, bmr, pWeight, pGoal, pWeeks, pSteps, pAct, sex]);

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
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
        Calculadoras de Nutrición
      </h3>

      {/* TDEE Card */}
      <div className="utilities-grid">
        <CalculatorCard title="Gasto de mantenimiento (TDEE)">
          {tdee && bmr ? (
            <div>
              <div className="kpi-card" style={{ textAlign: 'center', padding: '24px' }}>
                <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{Math.round(tdee)} kcal</div>
                <div className="kpi-detail">Gasto Energético Diario (TDEE)</div>
                <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Tu metabolismo basal (BMR) es de {Math.round(bmr)} kcal.
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rellena tu sexo, edad, altura, peso y nivel de actividad en Ajustes.</p>
          )}
        </CalculatorCard>

        {/* PLAN Card */}
        <CalculatorCard title="Plan de Adelgazamiento" defaultOpen>
          {!tdee ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Primero necesito tu TDEE. Rellena tus datos en Ajustes.</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="plan-goal">Peso objetivo (kg)</label>
                  <input id="plan-goal" type="number" className="form-input" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="plan-weeks">Plazo (semanas)</label>
                  <input id="plan-weeks" type="number" className="form-input" value={weeks} onChange={e => setWeeks(e.target.value)} min={1} max={104} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="plan-steps">Pasos diarios objetivo</label>
                  <input id="plan-steps" type="number" className="form-input" value={dailySteps} onChange={e => setDailySteps(e.target.value)} step={500} />
                </div>
              </div>

              {pGoal && pWeight && pGoal >= pWeight && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>El peso objetivo debe ser menor al actual.</p>
              )}

              {plan && (
                <div>
                  {/* Summary KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="kpi-card" style={{ padding: '16px', textAlign: 'center' }}>
                      <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{plan.totalKgToLose.toFixed(1)} kg</div>
                      <div className="kpi-detail">Total a perder</div>
                    </div>
                    <div className="kpi-card" style={{ padding: '16px', textAlign: 'center' }}>
                      <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{Math.round(plan.dailyDeficitNeeded)}</div>
                      <div className="kpi-detail">Déficit diario (kcal)</div>
                    </div>
                  </div>

                  {/* The split: steps vs diet */}
                  <div className="kpi-card" style={{ padding: '20px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>Reparto del déficit</div>

                    {/* Visual bar */}
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', height: '28px', marginBottom: '12px' }}>
                      <div style={{
                        width: `${Math.min(100, (plan.stepsKcal / plan.dailyDeficitNeeded) * 100)}%`,
                        background: 'var(--color-carbs)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                        minWidth: plan.stepsKcal > 0 ? '40px' : '0'
                      }}>
                        {plan.stepsKcal > 0 ? `${Math.round(plan.stepsKcal)}` : ''}
                      </div>
                      <div style={{
                        flex: 1,
                        background: 'var(--color-fat)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                        minWidth: '40px'
                      }}>
                        {Math.round(plan.dietDeficit)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--color-carbs)' }}>🚶 Pasos: {Math.round(plan.stepsKcal)} kcal</span>
                      <span style={{ color: 'var(--color-fat)' }}>🍽️ Dieta: {Math.round(plan.dietDeficit)} kcal</span>
                    </div>
                  </div>

                  {/* Result: what to eat */}
                  <div className="kpi-card" style={{ textAlign: 'center', padding: '24px', marginBottom: '1rem', borderTop: '3px solid var(--accent-primary)' }}>
                    <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{Math.round(plan.dailyIntake)} kcal</div>
                    <div className="kpi-detail">Calorías diarias a comer</div>
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      TDEE {Math.round(tdee)} − restricción {Math.round(plan.dietDeficit)} kcal
                    </div>
                  </div>

                  {/* Macros */}
                  {plan.macros && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div className="kpi-card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid var(--color-protein)' }}>
                        <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{Math.round(plan.macros.proteinG)}g</div>
                        <div className="kpi-detail" style={{ fontSize: '0.7rem' }}>Prot ({Math.round(plan.macros.proteinPct)}%)</div>
                      </div>
                      <div className="kpi-card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid var(--color-fat)' }}>
                        <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{Math.round(plan.macros.fatG)}g</div>
                        <div className="kpi-detail" style={{ fontSize: '0.7rem' }}>Grasas ({Math.round(plan.macros.fatPct)}%)</div>
                      </div>
                      <div className="kpi-card" style={{ padding: '12px', textAlign: 'center', borderTop: '3px solid var(--color-carbs)' }}>
                        <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{Math.round(plan.macros.carbsG)}g</div>
                        <div className="kpi-detail" style={{ fontSize: '0.7rem' }}>Carbos ({Math.round(plan.macros.carbsPct)}%)</div>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {plan.warnings.map((w, i) => (
                    <div key={i} role="alert" className={`kpi-card ${w.level}`} style={{ marginBottom: '8px', borderLeft: `4px solid var(--color-${w.level === 'danger' ? 'fat' : 'carbs'})`, padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.85rem' }}>{w.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CalculatorCard>

        {/* Body fat Card */}
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
      </div>

      <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Las calculadoras proporcionan estimaciones orientativas basadas en fórmulas estándar. No sustituyen el consejo de un profesional médico o nutricionista.
      </p>
    </div>
  );
}
