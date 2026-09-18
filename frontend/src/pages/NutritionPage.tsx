import { MealIcon } from '../components/MealIcon';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MyFoodsPage from './MyFoodsPage';
import FoodSearchModal from '../components/FoodSearchModal';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getLocalDateString, addDaysToDateString, isTodayLocal } from '../utils/dateHelper';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ChevronDown, Trash2, Edit3, GripVertical } from 'lucide-react';
import { SegmentedControl } from '../components/ui/segmented-control';

export default function NutritionPage() {
  const queryClient = useQueryClient();
  
  // Food Logging State
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState(0);
  const [editingLog, setEditingLog] = useState<any>(null); // { id, product, quantity, kcal, protein, carbs, fat }

  const [collapsedMeals, setCollapsedMeals] = useState({});
  const [dragOverMealIndex, setDragOverMealIndex] = useState(null);
  const [activeTab, setActiveTab] = useState<'diary' | 'foods'>('diary');

  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEndHandler = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      setSelectedDate(prev => addDaysToDateString(prev, isLeftSwipe ? 1 : -1));
    }
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const toggleMealCollapse = (index, e) => {
    setCollapsedMeals(prev => {
      const isCurrentlyCollapsed = prev[index] !== false; // default true if undefined
      return {
        ...prev,
        [index]: !isCurrentlyCollapsed
      };
    });

    // Only scroll if we are expanding it
    if (collapsedMeals[index] !== false && e?.currentTarget) {
      const el = e.currentTarget;
      setTimeout(() => {
        const offset = 140;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const handleDragStart = (e, log) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ ...log, sourceMealIndex: log.mealIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverMealIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverMealIndex(null);
  };

  const handleDropOnMeal = async (e, targetMealIndex) => {
    e.preventDefault();
    setDragOverMealIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.sourceMealIndex === targetMealIndex) return;

      await api.put(`/nutrition/logs/${data.id}`, {
        product: data.product,
        quantity: data.quantity,
        kcal: data.kcal,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        mealIndex: targetMealIndex
      });
      fetchData();
      toast.success('Movido correctamente');
    } catch {
      toast.error('Error al mover');
    }
  };

  const { data = {}, isLoading: loading, refetch: fetchData } = useQuery({
    queryKey: ['nutritionData', selectedDate],
    queryFn: async () => {
      const [macrosRes, mealsRes, settingsRes, logsRes] = await Promise.all([
        api.get('/nutrition/macros').catch(() => ({ data: null })),
        api.get('/nutrition/meals').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: null })),
        api.get(`/nutrition/logs?date=${selectedDate}`).catch(() => ({ data: [] }))
      ]);

      return {
        foodLogs: logsRes.data,
        macros: macrosRes.data,
        meals: mealsRes.data,
        settings: settingsRes.data
      };
    }
  });

  const { foodLogs = [], macros, meals = [], settings } = data as any;

  useEffect(() => {
    if (meals.length > 0) {
      const newCollapsed: any = {};
      meals.forEach((_, i) => {
        newCollapsed[i] = true;
      });
      setCollapsedMeals(newCollapsed);
    }
  }, [meals.length]); // Only run when meals array length changes, indicating load



  const handleDeleteLog = async (id) => {
    try {
      await api.delete(`/nutrition/logs/${id}`);
      fetchData();
      toast.success('Alimento eliminado');
    } catch {
      toast.error('Error al eliminar alimento');
    }
  };

  const handleEditLog = (log) => {
    setEditingLog({
      id: log.id,
      product: log.product,
      quantity: log.quantity,
      kcal: log.kcal,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      // store per-100g for recalc
      _kcalPer100: log.quantity > 0 ? (log.kcal / log.quantity) * 100 : 0,
      _protPer100: log.quantity > 0 ? (log.protein / log.quantity) * 100 : 0,
      _carbsPer100: log.quantity > 0 ? (log.carbs / log.quantity) * 100 : 0,
      _fatPer100: log.quantity > 0 ? (log.fat / log.quantity) * 100 : 0,
    });
  };

  const handleEditQuantityChange = (newQty) => {
    const q = parseFloat(newQty) || 0;
    setEditingLog(prev => ({
      ...prev,
      quantity: q,
      kcal: Math.round((prev._kcalPer100 * q / 100) * 10) / 10,
      protein: Math.round((prev._protPer100 * q / 100) * 10) / 10,
      carbs: Math.round((prev._carbsPer100 * q / 100) * 10) / 10,
      fat: Math.round((prev._fatPer100 * q / 100) * 10) / 10,
    }));
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;
    try {
      await api.put(`/nutrition/logs/${editingLog.id}`, {
        product: editingLog.product,
        quantity: editingLog.quantity,
        kcal: editingLog.kcal,
        protein: editingLog.protein,
        carbs: editingLog.carbs,
        fat: editingLog.fat,
      });
      setEditingLog(null);
      fetchData();
      toast.success('Registro actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!macros || !settings) return null;


  const consumed = foodLogs.reduce((acc, log) => ({
    kcal: acc.kcal + (Number(log.kcal) || 0),
    protein: acc.protein + (Number(log.protein) || 0),
    carbs: acc.carbs + (Number(log.carbs) || 0),
    fat: acc.fat + (Number(log.fat) || 0)
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const pieData = [
    { name: 'Proteínas Consumidas', value: consumed.protein * 4, color: 'var(--color-protein)' },
    { name: 'Hidratos Consumidos', value: consumed.carbs * 4, color: 'var(--color-carbs)' },
    { name: 'Grasas Consumidas', value: consumed.fat * 9, color: 'var(--color-fat)' },
    { name: 'Calorías Restantes', value: Math.max(0, macros.kcal - consumed.kcal), color: 'rgba(255,255,255,0.05)' },
  ];


  const totalProtein = macros.protein;

  return (
    <div className="fade-in">
      {/* Segmented Control */}
      <SegmentedControl
        options={[
          { label: 'Diario', value: 'diary' },
          { label: 'Mis Alimentos', value: 'foods' }
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'diary' | 'foods')}
        className="mb-6"
      />

      {activeTab === 'foods' ? (
        <MyFoodsPage />
      ) : (
        <>
      {/* Date Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: 'var(--space-lg)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => setSelectedDate(prev => addDaysToDateString(prev, -1))}
          style={{ padding: '0.4rem 1rem', borderRadius: '24px' }}
        >
          &larr;
        </button>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              position: 'absolute', 
              opacity: 0, 
              width: '100%', 
              height: '100%', 
              cursor: 'pointer' 
            }}
          />
          <div style={{ fontWeight: 600, fontSize: '1.1rem', minWidth: '140px', textAlign: 'center' }}>
            {isTodayLocal(selectedDate) 
              ? 'Hoy' 
              : format(parseISO(selectedDate), "d MMM yyyy", { locale: es })}
          </div>
        </div>

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => setSelectedDate(prev => addDaysToDateString(prev, 1))}
          style={{ padding: '0.4rem 1rem', borderRadius: '24px' }}
        >
          &rarr;
        </button>
      </div>




      {/* Global Add Button (FAB-style for mobile, fixed for PC) */}
              <button
          className="btn shadow-glow"
          style={{
            position: 'fixed',
            bottom: 'calc(95px + env(safe-area-inset-bottom))',
            right: '20px',
            zIndex: 90,
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            lineHeight: 1,
            background: 'var(--gradient-primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0, 133, 255, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)'
          }}
          onClick={() => {
            setSelectedMealIndex(0);
            setSearchModalOpen(true);
          }}
        >
          +
        </button>

      {/* Macro Summary */}
      <div className="card nutrition-summary-card">
        <div className="nutrition-summary-main">
          <div className="nutrition-summary-header">
            <span className="nutrition-summary-title">Calorías</span>
            <span className="nutrition-summary-value">
              {Math.round(consumed.kcal)} <span className="nutrition-summary-unit">/ {macros.kcal} kcal</span>
            </span>
          </div>
          <div className="macro-progress-bg main-progress">
            <div className="macro-progress-fill" style={{ width: `${Math.min(100, (consumed.kcal / macros.kcal) * 100)}%`, background: 'var(--accent-primary)' }} />
          </div>
        </div>

        <div className="nutrition-summary-macros">
          {/* Prot */}
          <div className="macro-item">
            <div className="macro-item-header">
              <span className="macro-item-title">Proteínas</span>
              <span className="macro-item-value">{consumed.protein.toFixed(0)}/{macros.protein.toFixed(0)}g</span>
            </div>
            <div className="macro-progress-bg">
              <div className="macro-progress-fill" style={{ width: `${Math.min(100, (consumed.protein / macros.protein) * 100)}%`, background: 'var(--color-protein)' }} />
            </div>
          </div>
          {/* Carbs */}
          <div className="macro-item">
            <div className="macro-item-header">
              <span className="macro-item-title">Hidratos</span>
              <span className="macro-item-value">{consumed.carbs.toFixed(0)}/{macros.carbs.toFixed(0)}g</span>
            </div>
            <div className="macro-progress-bg">
              <div className="macro-progress-fill" style={{ width: `${Math.min(100, (consumed.carbs / macros.carbs) * 100)}%`, background: 'var(--color-carbs)' }} />
            </div>
          </div>
          {/* Fat */}
          <div className="macro-item">
            <div className="macro-item-header">
              <span className="macro-item-title">Grasas</span>
              <span className="macro-item-value">{consumed.fat.toFixed(0)}/{macros.fat.toFixed(0)}g</span>
            </div>
            <div className="macro-progress-bg">
              <div className="macro-progress-fill" style={{ width: `${Math.min(100, (consumed.fat / macros.fat) * 100)}%`, background: 'var(--color-fat)' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div className="daily-food-logs-header">
          <button
            className="btn btn-secondary btn-sm ai-log-btn"
            onClick={() => {
              setSelectedMealIndex(-1);
              setSearchModalOpen(true);
            }}
          >
            <span></span> Registro IA
          </button>
        </div>

        {/* Daily Food Logs */}
        <div className="nutrition-meals-grid">
          {meals.map((meal, index) => {
            const logs = foodLogs.filter(log => log.mealIndex === index);
            
            const mealSubtotal = logs.reduce((acc, log) => ({
              kcal: acc.kcal + (Number(log.kcal) || 0),
              protein: acc.protein + (Number(log.protein) || 0),
              carbs: acc.carbs + (Number(log.carbs) || 0),
              fat: acc.fat + (Number(log.fat) || 0)
            }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

            const isCollapsed = collapsedMeals[index];

            return (
              <div 
                key={meal.id || index} 
                className="card"
                style={{ 
                  padding: '1.25rem',
                  border: dragOverMealIndex === index ? '2px dashed var(--color-carbs)' : undefined,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropOnMeal(e, index)}
              >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer' }} onClick={(e) => toggleMealCollapse(index, e)}>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ChevronDown size={18} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--text-secondary)' }} />
                      <span style={{ marginRight: "var(--space-xs)" }}><MealIcon iconString={meal.icon || meal.name} className="w-5 h-5 inline-block text-[var(--text-secondary)]" /></span> {meal.name}
                    </div>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '16px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMealIndex(index);
                      setSearchModalOpen(true);
                    }}
                  >
                    +
                  </button>
                </div>

                {logs.length > 0 && (
                  <div className="meal-subtotal-row" style={{ marginBottom: isCollapsed ? '0' : '0.75rem' }}>
                    <span className="subtotal-val kcal">{Math.round(mealSubtotal.kcal)} kcal</span>
                    <span className="subtotal-dot"></span>
                    <span className="subtotal-val">P: {mealSubtotal.protein.toFixed(1)}g</span>
                    <span className="subtotal-dot"></span>
                    <span className="subtotal-val">C: {mealSubtotal.carbs.toFixed(1)}g</span>
                    <span className="subtotal-dot"></span>
                    <span className="subtotal-val">G: {mealSubtotal.fat.toFixed(1)}g</span>
                  </div>
                )}

                {!isCollapsed && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {logs.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.25rem' }}>Sin registrar</div>
                      ) : (
                        logs.map(log => (
                          <div 
                            key={log.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, log)}
                            style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden', cursor: 'grab' }}
                          >
                            {editingLog && editingLog.id === log.id ? (
                              /* EDIT MODE */
                              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ fontWeight: 500, marginBottom: '0.15rem' }}>{editingLog.product}</div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cantidad (g):</label>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '100px', padding: '0.4rem' }}
                                    value={editingLog.quantity}
                                    onChange={(e) => handleEditQuantityChange(e.target.value)}
                                    autoFocus
                                  />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {Math.round(editingLog.kcal)} kcal | P: {editingLog.protein.toFixed(1)}g | C: {editingLog.carbs.toFixed(1)}g | G: {editingLog.fat.toFixed(1)}g
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setEditingLog(null)}>Cancelar</button>
                                  <button className="btn btn-primary btn-sm" style={{ padding: '0.3rem 0.6rem' }} onClick={handleUpdateLog}>Guardar</button>
                                </div>
                              </div>
                            ) : (
                              /* VIEW MODE */
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem' }}>
                                <div>
                                  <div style={{ fontWeight: 500, marginBottom: '0.15rem' }}>{log.product} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({log.quantity}g)</span></div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {Math.round(Number(log.kcal) || 0)} kcal | P: {(Number(log.protein) || 0).toFixed(1)}g | C: {(Number(log.carbs) || 0).toFixed(1)}g | G: {(Number(log.fat) || 0).toFixed(1)}g
                                  </div>
                                </div>
                                <div className="food-log-actions">
                                  <button
                                    className="icon-btn edit-btn"
                                    onClick={(e) => { e.stopPropagation(); handleEditLog(log); }}
                                    title="Editar cantidad"
                                  >
                                    
                                  </button>
                                  <button
                                    className="icon-btn delete-btn"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                                    title="Eliminar"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Chart (Moved to bottom) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', marginBottom: 'var(--space-xxl)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>Distribución de Macros</h3>
          <div style={{ width: '100%', maxWidth: '300px', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  formatter={(value, name) => {
                    const total = pieData.reduce((a, b) => a + b.value, 0);
                    return [`${value.toFixed(0)} kcal (${((value / total) * 100).toFixed(1)}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <FoodSearchModal 
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        mealIndex={selectedMealIndex}
        date={selectedDate}
        onLogAdded={fetchData}
        meals={meals}
      />
        </>
      )}
    </div>
  );
}
