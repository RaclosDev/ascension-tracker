import { useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { User, Scale, Activity } from 'lucide-react';
import WeightLossPlan from './calculators/WeightLossPlan';
import MacroConfigurator from './calculators/MacroConfigurator';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({
    sex: 'M',
    age: '',
    heightCm: '',
    startWeight: '',
    goalWeight: '',
    activityFactor: '1.2',
    kcal: 2000,
    macroStrategy: 'BALANCED'
  });
  
  const [mealOption, setMealOption] = useState<'default' | 'custom'>('default');
  const [customMealsCount, setCustomMealsCount] = useState<number>(3);
  
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSavePlan = (kcal: number) => {
    setForm({ ...form, kcal });
    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Guardar settings
      await api.put('/settings', {
        sex: form.sex,
        age: parseInt(form.age) || null,
        heightCm: parseInt(form.heightCm) || null,
        startWeight: parseFloat(form.startWeight) || null,
        goalWeight: parseFloat(form.goalWeight) || null,
        activityFactor: parseFloat(form.activityFactor),
        kcal: form.kcal,
        macroStrategy: form.macroStrategy
      });

      // 2. Configurar comidas
      if (mealOption === 'default') {
        await api.post('/nutrition/meals/reset');
      } else {
        // Crear N comidas
        for (let i = 1; i <= customMealsCount; i++) {
          await api.post('/nutrition/meals', { name: `Comida ${i}`, icon: '' });
        }
      }

      toast.success('¡Configuración completada!');
      onComplete();
    } catch (err) {
      toast.error('Error al guardar configuración inicial');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-default, #0f172a)',
      color: 'var(--text-primary, #fff)',
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-glass-strong, rgba(18, 18, 26, 0.78))',
        backdropFilter: 'blur(20px)',
        padding: '2rem',
        borderRadius: '24px',
        border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.1))',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
        width: '100%',
        maxWidth: '420px'
      }}>
        
        {step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Bienvenido a Ascension</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Para empezar, necesitamos conocer algunos datos básicos sobre ti.
              </p>
            </div>

            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} /> Sexo
                  </label>
                  <select className="form-input" value={form.sex} onChange={e => setForm({...form, sex: e.target.value})}>
                    <option value="M">Hombre</option>
                    <option value="F">Mujer</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Edad</label>
                  <input type="number" required className="form-input" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Altura (cm)</label>
                  <input type="number" required className="form-input" value={form.heightCm} onChange={e => setForm({...form, heightCm: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Scale size={14} /> Peso Inicial (kg)
                  </label>
                  <input type="number" inputMode="decimal" step="0.1" required className="form-input" value={form.startWeight} onChange={e => setForm({...form, startWeight: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Peso Objetivo (kg)</label>
                  <input type="number" inputMode="decimal" step="0.1" required className="form-input" value={form.goalWeight} onChange={e => setForm({...form, goalWeight: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={14} /> Actividad
                </label>
                <select className="form-input" value={form.activityFactor} onChange={e => setForm({...form, activityFactor: e.target.value})}>
                  <option value="1.2">Sedentario</option>
                  <option value="1.375">Ligero</option>
                  <option value="1.55">Moderado</option>
                  <option value="1.725">Alto</option>
                  <option value="1.9">Muy Alto</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}
              >
                Continuar
              </button>
            </form>
          </>
        ) : step === 2 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Configura tus Comidas</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                ¿Cuántas comidas haces al día normalmente?
              </p>
            </div>

            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div 
                onClick={() => setMealOption('default')}
                style={{ 
                  padding: '1rem', 
                  border: mealOption === 'default' ? '2px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  background: mealOption === 'default' ? 'var(--accent-glow)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Por defecto (Recomendado)</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>4 comidas: Desayuno, Comida, Cena y Snacks.</div>
              </div>

              <div 
                onClick={() => setMealOption('custom')}
                style={{ 
                  padding: '1rem', 
                  border: mealOption === 'custom' ? '2px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  background: mealOption === 'custom' ? 'var(--accent-glow)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Personalizado</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Elige el número de comidas y las llamaremos "Comida 1", "Comida 2", etc.
                </div>
                {mealOption === 'custom' && (
                  <input 
                    type="number" 
                    className="form-input" 
                    value={customMealsCount} 
                    onChange={e => setCustomMealsCount(parseInt(e.target.value) || 1)} 
                    min={1} max={10} 
                    style={{ width: '100px' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handlePreviousStep}
                  style={{ flex: 1, padding: '0.875rem' }}
                >
                  Atrás
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2, padding: '0.875rem' }}
                >
                  Continuar
                </button>
              </div>
            </form>
          </>
        ) : step === 3 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Plan de Adelgazamiento</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Ajusta tu plazo y actividad diaria para calcular tus calorías.
              </p>
            </div>

            <WeightLossPlan
              initialWeightKg={form.startWeight}
              initialGoalWeight={form.goalWeight}
              age={form.age}
              heightCm={form.heightCm}
              sex={form.sex as 'M' | 'F'}
              activityFactor={form.activityFactor}
              onSave={handleSavePlan}
              saveButtonText="Guardar y Continuar"
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handlePreviousStep}
                style={{ width: '100%', padding: '0.875rem' }}
              >
                Atrás
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Estrategia de Macros</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Elige cómo quieres repartir tus {Math.round(form.kcal)} kcal.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <MacroConfigurator form={form as any} setForm={setForm} />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handlePreviousStep}
                  style={{ flex: 1, padding: '0.875rem' }}
                >
                  Atrás
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2, padding: '0.875rem' }}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Finalizar y Empezar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
