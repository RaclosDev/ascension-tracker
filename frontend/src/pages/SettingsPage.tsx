import { User, Drumstick, Droplet, Wheat, Flame, Utensils, Dumbbell, FileDown } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import MealConfigurator from '../components/MealConfigurator';
import { getLocalDateString } from '../utils/dateHelper';
import { useWorkoutStore } from '../lib/workout/store';
import { importHevyCSV } from '../lib/workout/import';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { applyThemeColor } from '../utils/colorHelper';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any><Dumbbell className="w-4 h-4 inline mr-2" /> Entrenamiento</span>
            <span style={{ transform: openSections.workout ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ▼
            </span>
          </div>
          {openSections.workout && (
            <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ paddingRight: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '2px' }}>⏱️ Descanso Base (segundos)</label>
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

