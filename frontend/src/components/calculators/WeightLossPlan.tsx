import { useState, useMemo } from 'react';
import {
  KCAL_PER_KG_FAT,
  parseNumber,
  calcBmr,
  calcTdee,
  calcStepsFromKcal,
  calcStepsKcal
} from '../../utils/nutritionCalculators';

interface WeightLossPlanProps {
  initialWeightKg: string;
  initialGoalWeight: string;
  age: string;
  heightCm: string;
  sex: 'M' | 'F';
  activityFactor: string;
  
  onSave?: (totalKcal: number) => void;
  saveButtonText?: string;
}

export default function WeightLossPlan({
  initialWeightKg,
  initialGoalWeight,
  age,
  heightCm,
  sex,
  activityFactor,
  onSave,
  saveButtonText = "Guardar y Continuar"
}: WeightLossPlanProps) {
  const [goalWeight, setGoalWeight] = useState<string>(initialGoalWeight);
  const [weeks, setWeeks] = useState<string>('16');
  const [stepsPct, setStepsPct] = useState<number>(50); // % of deficit from steps

  // Base calculations
  const pAge = parseNumber(age);
  const pHeight = parseNumber(heightCm);
  const pWeight = parseNumber(initialWeightKg);
  const pAct = parseNumber(activityFactor) || 1.2;

  const bmr = (pWeight && pHeight && pAge) ? calcBmr(sex, pWeight, pHeight, pAge) : null;
  const tdee = bmr ? calcTdee(bmr, pAct) : null;

  // Plan calculations
  const pGoal = parseNumber(goalWeight);
  const pWeeks = parseNumber(weeks);

  const plan = useMemo(() => {
    if (!tdee || !bmr || !pWeight || !pGoal || !pWeeks || pWeeks < 1) return null;
    if (pGoal >= pWeight) return null;

    const totalKgToLose = pWeight - pGoal;
    const totalKcalToLose = totalKgToLose * KCAL_PER_KG_FAT;
    const totalDays = pWeeks * 7;
    const dailyDeficitNeeded = totalKcalToLose / totalDays;
    const weeklyRate = totalKgToLose / pWeeks;

    // Split based on slider
    const stepsKcal = dailyDeficitNeeded * (stepsPct / 100);
    const dietDeficit = dailyDeficitNeeded - stepsKcal;
    const dailyIntake = tdee - dietDeficit;

    // How many steps are needed for that kcal?
    const stepsNeeded = Math.round(calcStepsFromKcal(pWeight, stepsKcal));

    // Warnings
    const warnings: { level: 'warning' | 'danger'; msg: string }[] = [];

    const ratePct = (weeklyRate / pWeight) * 100;
    if (ratePct > 1.5) {
      warnings.push({ level: 'danger', msg: `Ritmo del ${ratePct.toFixed(1)}% semanal: riesgo de pérdida muscular. Aumenta el plazo.` });
    } else if (ratePct > 1) {
      warnings.push({ level: 'warning', msg: `Ritmo del ${ratePct.toFixed(1)}% semanal: agresivo pero viable si mantienes proteína alta.` });
    }

    if (dailyIntake < bmr) {
      warnings.push({ level: 'danger', msg: `Ingesta de ${Math.round(dailyIntake)} kcal por debajo de tu BMR (${Math.round(bmr)} kcal). Mueve el slider hacia pasos o aumenta el plazo.` });
    }

    if (stepsNeeded > 25000) {
      warnings.push({ level: 'warning', msg: `${stepsNeeded.toLocaleString()} pasos diarios es muy ambicioso. Reduce el % de pasos o aumenta el plazo.` });
    }

    if (stepsPct >= 100) {
      warnings.push({ level: 'warning', msg: `¡Solo con los pasos cubres el déficit! Puedes comer a mantenimiento (${Math.round(tdee)} kcal).` });
    }

    return {
      totalKgToLose,
      dailyDeficitNeeded,
      weeklyRate,
      stepsKcal,
      stepsNeeded,
      dietDeficit,
      dailyIntake,
      warnings
    };
  }, [tdee, bmr, pWeight, pGoal, pWeeks, stepsPct, pAct, sex]);

  const handleManualSteps = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!plan || !pWeight || isNaN(val)) return;
    const manualStepsKcal = calcStepsKcal(pWeight, val);
    const newStepsPct = Math.min(100, Math.max(0, (manualStepsKcal / plan.dailyDeficitNeeded) * 100));
    setStepsPct(newStepsPct);
  };

  if (!tdee) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Faltan datos básicos para calcular tu TDEE.</p>;
  }

  const sliderBg = `linear-gradient(to right, var(--color-carbs) 0%, var(--color-carbs) ${stepsPct}%, var(--color-fat) ${stepsPct}%, var(--color-fat) 100%)`;

  return (
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

          {/* Interactive slider */}
          <div className="kpi-card" style={{ padding: '20px', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Reparto del déficit — arrastra para ajustar
            </div>

            {/* Range slider */}
            <input
              type="range"
              min={0}
              max={100}
              value={stepsPct}
              onChange={e => setStepsPct(Number(e.target.value))}
              style={{
                width: '100%',
                height: '28px',
                borderRadius: '8px',
                appearance: 'none',
                WebkitAppearance: 'none',
                background: sliderBg,
                outline: 'none',
                cursor: 'grab',
                border: 'none',
              }}
              aria-label="Reparto del déficit entre pasos y dieta"
            />

            {/* Labels under slider */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '8px' }}>
              <span style={{ color: 'var(--color-carbs)', fontWeight: 600 }}>👟 {Math.round(plan.stepsKcal)} kcal</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{Math.round(stepsPct)}% pasos / {Math.round(100 - stepsPct)}% dieta</span>
              <span style={{ color: 'var(--color-fat)', fontWeight: 600 }}>🍽️ {Math.round(plan.dietDeficit)} kcal</span>
            </div>

            {/* Steps needed */}
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pasos diarios (estimado)</span>
              <input 
                type="number" 
                className="form-input" 
                style={{ width: '100px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-carbs)' }}
                value={plan.stepsNeeded}
                onChange={handleManualSteps}
              />
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

          {/* Warnings */}
          {plan.warnings.map((w, i) => (
            <div key={i} role="alert" className={`kpi-card ${w.level}`} style={{ marginBottom: '8px', borderLeft: `4px solid var(--color-${w.level === 'danger' ? 'fat' : 'carbs'})`, padding: '12px 16px' }}>
              <span style={{ fontSize: '0.85rem' }}>{w.msg}</span>
            </div>
          ))}

          {onSave && (
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => onSave(Math.round(plan.dailyIntake))}
            >
              {saveButtonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
