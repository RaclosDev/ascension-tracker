import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { SettingsForm } from '../../pages/SettingsPage';

interface SettingsPersonalSectionProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent<HTMLDivElement>) => void;
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  onSave: () => void;
}

export function SettingsPersonalSection({
  isOpen,
  onToggle,
  form,
  setForm,
  onSave,
}: SettingsPersonalSectionProps) {
  return (
    <div
      className={`card accordion-card transition-all duration-300 ease-out ${isOpen ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
    >
      <div
        className="accordion-header flex justify-between items-center cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <User size={20} className="text-primary" />
          <span className="card-title m-0 text-base font-semibold">Datos Personales</span>
        </div>
        <span
          className={`text-xs text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <ChevronDown size={18} />
        </span>
      </div>
      {isOpen && (
        <div className="accordion-content fade-in mt-5 pt-5 border-t border-white/10">
          <h4 className="subsection-title">Métricas Corporales y Biometría</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sexo</label>
              <select
                className="form-input"
                value={form.sex || 'M'}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                aria-label="Sexo"
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
                aria-label="Edad"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Altura (cm)</label>
              <input
                type="number"
                className="form-input"
                value={form.heightCm || ''}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                aria-label="Altura en cm"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Actividad</label>
              <select
                className="form-input"
                value={form.activityFactor || '1.2'}
                onChange={(e) => setForm({ ...form, activityFactor: e.target.value })}
                aria-label="Nivel de actividad"
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
                aria-label="Peso inicial en kg"
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
                aria-label="Peso objetivo en kg"
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
                aria-label="Objetivo semanal de pérdida en kg"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fecha de Inicio</label>
              <input
                type="date"
                className="form-input"
                value={form.startDate || ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                aria-label="Fecha de inicio"
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={onSave}
          >
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
}
