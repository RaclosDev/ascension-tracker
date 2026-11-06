import React from 'react';
import { User } from 'lucide-react';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { SettingsForm } from '../../pages/SettingsPage';

interface SettingsPersonalSectionProps {
  form: SettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  onSave: () => void;
  isSaving?: boolean;
}

export function SettingsPersonalSection({
  form,
  setForm,
  onSave,
  isSaving = false,
}: SettingsPersonalSectionProps) {
  const isGaining =
    Number(form.goalWeight) && Number(form.startWeight)
      ? Number(form.goalWeight) > Number(form.startWeight)
      : false;

  return (
    <div className="card p-4 sm:p-6">
      <SettingsSectionHeader title="Datos Personales" icon={User} />
      <div className="mt-5 pt-5 border-t border-white/10">
        <h3 className="subsection-title">Métricas Corporales y Biometría</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="settings-personal-section-sexo" className="form-label">
              Sexo
            </label>
            <select
              id="settings-personal-section-sexo"
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
            <label htmlFor="settings-personal-section-edad" className="form-label">
              Edad
            </label>
            <input
              id="settings-personal-section-edad"
              type="number"
              className="form-input"
              value={form.age || ''}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              aria-label="Edad"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="settings-personal-section-altura-cm" className="form-label">
              Altura (cm)
            </label>
            <input
              id="settings-personal-section-altura-cm"
              type="number"
              className="form-input"
              value={form.heightCm || ''}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              aria-label="Altura en cm"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="settings-personal-section-actividad" className="form-label">
              Actividad
            </label>
            <select
              id="settings-personal-section-actividad"
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
            <label htmlFor="settings-personal-section-peso-inicial-kg" className="form-label">
              Peso Inicial (kg)
            </label>
            <input
              id="settings-personal-section-peso-inicial-kg"
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
            <label htmlFor="settings-personal-section-peso-deseado-kg" className="form-label">
              Peso Deseado (kg)
            </label>
            <input
              id="settings-personal-section-peso-deseado-kg"
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

        <h3 className="subsection-title" style={{ marginTop: '1.5rem' }}>
          Progreso y Fechas
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="settings-personal-section-ritmo" className="form-label">
              {isGaining ? 'Ganancia (kg/sem)' : 'Pérdida (kg/sem)'}
            </label>
            <input
              id="settings-personal-section-ritmo"
              type="number"
              inputMode="decimal"
              className="form-input"
              step="0.1"
              min="0.1"
              max="2"
              value={form.weeklyGoal || ''}
              onChange={(e) => setForm({ ...form, weeklyGoal: e.target.value })}
              aria-label={
                isGaining
                  ? 'Objetivo semanal de ganancia en kg'
                  : 'Objetivo semanal de pérdida en kg'
              }
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="settings-personal-section-fecha-de-inicio" className="form-label">
              Fecha de Inicio
            </label>
            <input
              id="settings-personal-section-fecha-de-inicio"
              type="date"
              className="form-input"
              value={form.startDate || ''}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              aria-label="Fecha de inicio"
            />
          </div>
        </div>
        <button
          className="btn btn-primary min-h-11"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
