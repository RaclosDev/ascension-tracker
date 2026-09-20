import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, Scale, Footprints, Apple, Flame, X } from 'lucide-react';
import { parseSafeWeight } from '../utils/weightHelper';

const DayCell = ({ dateStr, dayName, dayData, isToday, onOpenModal, showWeight, showSteps, showCalories }) => {
  const isFuture = dateStr > format(new Date(), 'yyyy-MM-dd');

  const handleClick = () => {
    if (isFuture) return;
    onOpenModal({ dateStr, dayName, dayData });
  };

  return (
    <div 
      className={`calendar-day ${isToday ? 'is-today' : ''} ${isFuture ? 'is-future' : ''}`}
      onClick={handleClick}
      style={{ cursor: isFuture ? 'default' : 'pointer', minHeight: '100px', display: 'flex', flexDirection: 'column' }}
    >
      <div className="calendar-day-name">{dayName}</div>
      <div className="calendar-day-date">{format(new Date(dateStr + 'T00:00:00'), 'd MMM', { locale: es })}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem', flex: 1, justifyContent: 'flex-end', width: '100%' }}>
        {showWeight && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', minHeight: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dayData.weight !== null ? <>{dayData.weight.toFixed(2)}<span className="hide-on-mobile" style={{fontWeight:400, opacity:0.5, marginLeft:'2px'}}>kg</span></> : <span style={{opacity: 0.3}}>—</span>}
          </div>
        )}
        {showSteps && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', minHeight: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dayData.steps !== null ? <>{Math.round(dayData.steps)}<span className="hide-on-mobile" style={{fontWeight:400, opacity:0.7, marginLeft:'2px'}}>pas</span></> : <span style={{opacity: 0.3}}>—</span>}
          </div>
        )}
        {showCalories && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', minHeight: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dayData.calories !== null ? <>{Math.round(dayData.calories)}<span className="hide-on-mobile" style={{fontWeight:400, opacity:0.7, marginLeft:'2px'}}>kcal</span></> : <span style={{opacity: 0.3}}>—</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default function TrackingPage() {
  const [showWeight, setShowWeight] = useState(() => {
    const saved = localStorage.getItem('tracking_showWeight');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showSteps, setShowSteps] = useState(() => {
    const saved = localStorage.getItem('tracking_showSteps');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showCalories, setShowCalories] = useState(() => {
    const saved = localStorage.getItem('tracking_showCalories');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => { localStorage.setItem('tracking_showWeight', JSON.stringify(showWeight)); }, [showWeight]);
  useEffect(() => { localStorage.setItem('tracking_showSteps', JSON.stringify(showSteps)); }, [showSteps]);
  useEffect(() => { localStorage.setItem('tracking_showCalories', JSON.stringify(showCalories)); }, [showCalories]);

  const [modalData, setModalData] = useState<any>(null);
  const [modalWeight, setModalWeight] = useState('');
  const [modalSteps, setModalSteps] = useState('');

  const { data: weeks = [], isLoading, refetch: fetchData } = useQuery({
    queryKey: ['trackingWeeks'],
    queryFn: async () => {
      const [weightsRes, stepsRes, caloriesRes] = await Promise.all([
        api.get('/weights/weekly').catch(() => ({ data: [] })),
        api.get('/steps/weekly').catch(() => ({ data: [] })),
        api.get('/nutrition/calories/weekly').catch(() => ({ data: [] }))
      ]);

      const weeksMap = new Map();

      const mergeIntoWeeks = (resData: any[], type: string) => {
        if (!resData) return;
        resData.forEach(week => {
          if (!weeksMap.has(week.weekStart)) {
            weeksMap.set(week.weekStart, {
              weekStart: week.weekStart,
              averageWeight: null, deltaWeight: null,
              averageSteps: null, deltaSteps: null,
              averageCalories: null, deltaCalories: null,
              days: Array(7).fill(null).map(() => ({ weight: null, steps: null, calories: null }))
            });
          }
          const w = weeksMap.get(week.weekStart);
          
          if (type === 'weight') {
             w.averageWeight = week.average; w.deltaWeight = week.delta;
             week.days.forEach((val: any, i: number) => w.days[i].weight = val);
          }
          if (type === 'steps') {
             w.averageSteps = week.average; w.deltaSteps = week.delta;
             week.days.forEach((val: any, i: number) => w.days[i].steps = val);
          }
          if (type === 'calories') {
             w.averageCalories = week.average; w.deltaCalories = week.delta;
             week.days.forEach((val: any, i: number) => w.days[i].calories = val);
          }
        });
      };

      mergeIntoWeeks(weightsRes.data, 'weight');
      mergeIntoWeeks(stepsRes.data, 'steps');
      mergeIntoWeeks(caloriesRes.data, 'calories');

      return Array.from(weeksMap.values()).sort((a: any, b: any) => a.weekStart.localeCompare(b.weekStart));
    }
  });

  const handleOpenDayModal = ({ dateStr, dayName, dayData }) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    setModalData({
      dateStr,
      dayName,
      dayData,
      fullLabel: format(dateObj, "EEEE d 'de' MMMM", { locale: es })
    });
    setModalWeight(dayData.weight !== null ? dayData.weight.toString() : '');
    setModalSteps(dayData.steps !== null ? dayData.steps.toString() : '');
  };

  const handleModalSave = async () => {
    if (!modalData) return;
    const dateStr = modalData.dateStr;
    const currentData = modalData.dayData;
    
    try {
      let changed = false;
      
      // Handle Weight
      const wVal = parseSafeWeight(modalWeight);
      if (modalWeight === '' && currentData.weight !== null) {
        await api.delete(`/weights/${dateStr}`);
        changed = true;
      } else if (wVal !== null && wVal !== currentData.weight) {
        await api.post('/weights', { date: dateStr, weight: wVal });
        changed = true;
      }

      // Handle Steps
      const sVal = modalSteps === '' ? null : parseInt(modalSteps, 10);
      if (modalSteps === '' && currentData.steps !== null) {
        await api.delete(`/steps/${dateStr}`);
        changed = true;
      } else if (sVal !== null && !isNaN(sVal) && sVal !== currentData.steps) {
        await api.post('/steps', { date: dateStr, steps: sVal });
        changed = true;
      }

      if (changed) {
         toast.success('Registros guardados');
         await fetchData();
      }
      setModalData(null);
    } catch (err) {
      toast.error('Error al guardar');
    }
  };

  const handleModalDelete = async () => {
    if (!modalData) return;
    try {
      if (modalData.dayData.weight !== null) await api.delete(`/weights/${modalData.dateStr}`);
      if (modalData.dayData.steps !== null) await api.delete(`/steps/${modalData.dateStr}`);
      await fetchData();
      toast.success('Registros eliminados');
      setModalData(null);
    } catch { 
      toast.error('Error al eliminar'); 
    }
  };

  const handleDeltaAdjust = (metric, delta) => {
    if (metric === 'weight') {
      let current = parseFloat(modalWeight);
      if (isNaN(current)) current = 75;
      setModalWeight((Math.round((current + delta) * 100) / 100).toFixed(2));
    } else if (metric === 'steps') {
      let current = parseInt(modalSteps, 10);
      if (isNaN(current)) current = 5000;
      setModalSteps(Math.max(0, Math.round(current + delta)).toString());
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const getMondayStr = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return format(d, 'yyyy-MM-dd');
  };
  const currentMonday = getMondayStr();
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (isLoading && weeks.length === 0) return <div className="loading-screen"><div className="spinner" /></div>;

  const weightDeltas = [-0.5, -0.1, 0.1, 0.5];
  const stepsDeltas = [-1000, -100, 100, 1000];

  return (
    <div className="fade-in">
      
      {/* Metric Toggles */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: 'var(--space-xl)', padding: '0.35rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '14px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.02)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
        <button 
          onClick={() => setShowWeight(!showWeight)}
          style={{ flex: 1, padding: '0.45rem 0.6rem', borderRadius: '10px', border: 'none', background: showWeight ? 'rgba(255, 255, 255, 0.12)' : 'transparent', color: showWeight ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: showWeight ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', boxShadow: showWeight ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset' : 'none', transform: showWeight ? 'scale(1)' : 'scale(0.98)' }}
        >
          <Scale className="w-4 h-4 inline-block mr-1" /> Peso
        </button>
        <button 
          onClick={() => setShowSteps(!showSteps)}
          style={{ flex: 1, padding: '0.45rem 0.6rem', borderRadius: '10px', border: 'none', background: showSteps ? 'rgba(255, 255, 255, 0.12)' : 'transparent', color: showSteps ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: showSteps ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', boxShadow: showSteps ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset' : 'none', transform: showSteps ? 'scale(1)' : 'scale(0.98)' }}
        >
          <Footprints className="w-4 h-4 inline-block mr-1" /> Pasos
        </button>
        <button 
          onClick={() => setShowCalories(!showCalories)}
          style={{ flex: 1, padding: '0.45rem 0.6rem', borderRadius: '10px', border: 'none', background: showCalories ? 'rgba(255, 255, 255, 0.12)' : 'transparent', color: showCalories ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: showCalories ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', boxShadow: showCalories ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset' : 'none', transform: showCalories ? 'scale(1)' : 'scale(0.98)' }}
        >
          <Apple className="w-4 h-4 inline-block mr-1" /> Kcal
        </button>
      </div>

      <div className="calendar-container" style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {[...weeks].reverse().map((week) => {
          const isCurrentWeek = week.weekStart === currentMonday;
          return (
            <div key={week.weekStart} className="calendar-week">
              <div className="calendar-week-header">
                <div className="calendar-week-title">
                  {format(new Date(week.weekStart + 'T00:00:00'), "d MMM", { locale: es })}
                  {isCurrentWeek && <span className="current-week-label">  ACTUAL</span>}
                </div>
                
                {/* Stats Container */}
                <div className="calendar-week-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, max-content)', gap: '0.5rem', justifyContent: 'end' }}>
                  {showWeight && (
                    <>
                      <div style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '0.3rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="hide-on-mobile" style={{ color: 'var(--text-secondary)' }}>Peso:</span>
                        <span className="show-on-mobile" style={{ display: 'none', color: 'var(--text-secondary)' }}><Scale className="w-4 h-4 inline-block mr-1" /></span>
                        <strong style={{ color: 'var(--accent-primary-light)' }}>
                          {week.averageWeight !== null ? <>{week.averageWeight.toFixed(2)}<span className="hide-on-mobile"> kg</span></> : ''}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '0.3rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Δ:</span>
                        <strong className={
                          week.deltaWeight === null ? 'delta-neutral' :
                          week.deltaWeight < 0 ? 'delta-negative' :
                          week.deltaWeight > 0 ? 'delta-positive' : 'delta-neutral'
                        }>
                          {week.deltaWeight !== null ? <>{week.deltaWeight > 0 ? `+${week.deltaWeight.toFixed(2)}` : week.deltaWeight.toFixed(2)}<span className="hide-on-mobile"> kg</span></> : ''}
                        </strong>
                      </div>
                    </>
                  )}
                  {showSteps && (
                    <div style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '0.3rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="hide-on-mobile" style={{ color: 'var(--text-secondary)' }}>Pasos:</span>
                      <span className="show-on-mobile" style={{ display: 'none', color: 'var(--text-secondary)' }}><Footprints className="w-4 h-4 inline-block mr-1" /></span>
                      <strong style={{ color: 'var(--accent-primary-light)' }}>
                        {week.averageSteps !== null ? <>{Math.round(week.averageSteps)}<span className="hide-on-mobile"> pasos</span></> : ''}
                      </strong>
                    </div>
                  )}
                  {showCalories && (
                    <div style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '0.3rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="hide-on-mobile" style={{ color: 'var(--text-secondary)' }}>Kcal:</span>
                      <span className="show-on-mobile" style={{ display: 'none', color: 'var(--text-secondary)' }}><Apple className="w-4 h-4 inline-block mr-1" /></span>
                      <strong style={{ color: 'var(--accent-primary-light)' }}>
                        {week.averageCalories !== null ? <>{Math.round(week.averageCalories)}<span className="hide-on-mobile"> kcal</span></> : ''}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="calendar-grid">
                {week.days.map((dayData, d) => {
                  const date = new Date(week.weekStart + 'T00:00:00');
                  date.setDate(date.getDate() + d);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  
                  return (
                    <DayCell 
                      key={dateStr}
                      dateStr={dateStr}
                      dayName={dayNames[d]}
                      dayData={dayData}
                      isToday={dateStr === todayStr}
                      onOpenModal={handleOpenDayModal}
                      showWeight={showWeight}
                      showSteps={showSteps}
                      showCalories={showCalories}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        {weeks.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No hay datos registrados aún.
          </div>
        )}
      </div>

      {modalData && (
        <div className="modal-backdrop" onClick={() => setModalData(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'capitalize' }}>
                  {modalData.fullLabel}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Edita las métricas del día
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setModalData(null)}
                style={{ padding: '0.2rem 0.6rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              {/* Weight Section */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Scale className="w-4 h-4 inline-block mr-1" /> Peso
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    className="form-input"
                    style={{ fontSize: '1.2rem', textAlign: 'center', fontWeight: 700, padding: '0.5rem', width: '120px' }}
                    placeholder="00.00"
                    value={modalWeight}
                    onChange={e => setModalWeight(e.target.value)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>kg</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  {weightDeltas.map(step => (
                    <button key={step} type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0' }} onClick={() => handleDeltaAdjust('weight', step)}>
                      {step > 0 ? `+${step}` : step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steps Section */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Footprints className="w-4 h-4 inline-block mr-1" /> Pasos
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-input"
                    style={{ fontSize: '1.2rem', textAlign: 'center', fontWeight: 700, padding: '0.5rem', width: '120px' }}
                    placeholder="0"
                    value={modalSteps}
                    onChange={e => setModalSteps(e.target.value)}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>pasos</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  {stepsDeltas.map(step => (
                    <button key={step} type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0' }} onClick={() => handleDeltaAdjust('steps', step)}>
                      {step > 0 ? `+${step}` : step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calories Read-only Section */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Apple className="w-4 h-4 inline-block mr-1" /> Calorías de hoy
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary-light)' }}>
                  {modalData.dayData.calories !== null ? `${Math.round(modalData.dayData.calories)} kcal` : ''}
                </span>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleModalDelete}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: (modalData.dayData.weight !== null || modalData.dayData.steps !== null) ? 1 : 0, pointerEvents: (modalData.dayData.weight !== null || modalData.dayData.steps !== null) ? 'auto' : 'none' }}
              >
                <Trash2 size={16} /> Borrar Ambos
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalData(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleModalSave}
                  style={{ minWidth: '110px' }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
