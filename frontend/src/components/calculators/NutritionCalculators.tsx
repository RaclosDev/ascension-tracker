import { useState, useEffect } from 'react';
import api from '../../api/client';
import CalculatorCard from './CalculatorCard';
import {
  parseNumber,
  calcBmr,
  calcTdee,
  calcMacros,
  calcBodyFatNavy,
  calcBodyComposition
} from '../../utils/nutritionCalculators';

export default function NutritionCalculators() {
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [age, setAge] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [activityFactor, setActivityFactor] = useState<string>('1.375');

  const [customKcal, setCustomKcal] = useState<string>('');
  const [proteinPerKg, setProteinPerKg] = useState<string>('2.0');
  const [fatPerKg, setFatPerKg] = useState<string>('0.75');

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
      }
    });
  }, []);

  const pAge = parseNumber(age);
  const pHeight = parseNumber(heightCm);
  const pWeight = parseNumber(weightKg);
  const pAct = parseNumber(activityFactor) || 1.2;

  const bmr = (pWeight && pHeight && pAge) ? calcBmr(sex, pWeight, pHeight, pAge) : null;
  const tdee = bmr ? calcTdee(bmr, pAct) : null;

  // Macros logic
  const effectiveKcalForMacros = parseNumber(customKcal) || tdee;
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
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
        Calculadoras de Nutrición
      </h3>

      <div className="utilities-grid">
        <CalculatorCard title="Gasto de mantenimiento (TDEE)">
          {tdee && bmr ? (
            <div>
              <div className="kpi-card" style={{ marginBottom: '16px', textAlign: 'center', padding: '24px' }}>
                <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{Math.round(tdee)} kcal</div>
                <div className="kpi-detail">Gasto Energético Diario (TDEE)</div>
                <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Tu metabolismo basal (BMR) es de {Math.round(bmr)} kcal.<br/>
                  Para definir, un déficit moderado del 15-20% sería comer entre {Math.round(tdee * 0.8)} y {Math.round(tdee * 0.85)} kcal.
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rellena tu sexo, edad, altura, peso y nivel de actividad en Ajustes.</p>
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

          {!pWeight && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Falta tu peso en Ajustes o en tus registros.</p>}
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
      </div>

      <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Las calculadoras proporcionan estimaciones orientativas basadas en fórmulas estándar. No sustituyen el consejo de un profesional médico o nutricionista.
      </p>
    </div>
  );
}
