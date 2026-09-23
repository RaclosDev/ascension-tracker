import { useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { User, Scale, Activity } from 'lucide-react';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({
    sex: 'M',
    age: '',
    heightCm: '',
    startWeight: '',
    goalWeight: '',
    activityFactor: '1.2'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/settings', {
        sex: form.sex,
        age: parseInt(form.age) || null,
        heightCm: parseInt(form.heightCm) || null,
        startWeight: parseFloat(form.startWeight) || null,
        goalWeight: parseFloat(form.goalWeight) || null,
        activityFactor: parseFloat(form.activityFactor),
        macroStrategy: 'BALANCED'
      });
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
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Bienvenido a Ascension</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Para empezar, necesitamos conocer algunos datos básicos sobre ti.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
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
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar y Empezar'}
          </button>
        </form>
      </div>
    </div>
  );
}
