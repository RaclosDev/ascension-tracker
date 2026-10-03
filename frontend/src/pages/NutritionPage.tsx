/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { MealIcon } from '../components/MealIcon';
import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
const MyFoodsPage = lazy(() => import('./MyFoodsPage'));
const FoodSearchModal = lazy(() => import('../components/FoodSearchModal'));
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getLocalDateString, addDaysToDateString, isTodayLocal } from '../utils/dateHelper';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ChevronDown, Trash2, Edit3, GripVertical, Cpu, Copy, Loader2 } from 'lucide-react';
import { SegmentedControl } from '../components/ui/segmented-control';
import { Skeleton } from '../components/ui/skeleton';
import { SwipeableRow } from '../components/SwipeableRow';
import MacroSummaryHeader from '../components/nutrition/MacroSummaryHeader';

const getBasePortion = (portionsJson) => {
  if (!portionsJson) return null;
  try {
    const portions = JSON.parse(portionsJson);
    if (!portions || !Array.isArray(portions) || portions.length === 0) return null;
    const base = portions.find((p) => typeof p.label === 'string' && p.label.startsWith('1 '));
    if (base) return { label: base.label.replace(/^1\s+/, ''), amount: base.amount };
    return { label: portions[0].label, amount: portions[0].amount };
  } catch (e: any) {
    return null;
  }
};

export default function NutritionPage() {
  const queryClient = useQueryClient();

  // Food Logging State
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState(0);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editInputMode, setEditInputMode] = useState<'grams' | 'portions'>('grams'); // { id, product, quantity, kcal, protein, carbs, fat }

  const [collapsedMeals, setCollapsedMeals] = useState<any>({});
  const [dragOverMealIndex, setDragOverMealIndex] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'diary' | 'foods'>('diary');
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const touchStartRef = useRef<any>(null);
  const touchEndRef = useRef<any>(null);
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
      setSelectedDate((prev) => addDaysToDateString(prev, isLeftSwipe ? 1 : -1));
    }
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const toggleMealCollapse = (index, e) => {
    setCollapsedMeals((prev) => {
      const isCurrentlyCollapsed = prev[index] !== false; // default true if undefined
      return {
        ...prev,
        [index]: !isCurrentlyCollapsed,
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
          behavior: 'smooth',
        });
      }, 100);
    }
  };

  const handleDragStart = (e, log) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ ...log, sourceMealIndex: log.mealIndex }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  let scrollRAF: number | null = null;
  const handleDrag = (e) => {
    if (e.clientY === 0) return;
    if (!scrollRAF) {
      scrollRAF = requestAnimationFrame(() => {
        const threshold = 250;
        if (e.clientY < threshold) {
          const speed = Math.max(8, 35 - (e.clientY / threshold) * 30);
          window.scrollBy({ top: -speed, behavior: 'auto' });
        } else if (window.innerHeight - e.clientY < threshold) {
          const distFromEdge = window.innerHeight - e.clientY;
          const speed = Math.max(8, 35 - (distFromEdge / threshold) * 30);
          window.scrollBy({ top: speed, behavior: 'auto' });
        }
        scrollRAF = null;
      });
    }
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
        date: data.date || selectedDate,
        product: data.product,
        quantity: data.quantity,
        kcal: data.kcal,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        mealIndex: targetMealIndex,
        portionsJson: data.portionsJson,
      });
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['week-summaries'] });
      toast.success('Movido correctamente');
    } catch {
      toast.error('Error al mover');
    }
  };

  const handleCopyFromYesterday = async (e, mealIndex) => {
    e.stopPropagation();
    const loadingToast = toast.loading('Copiando de ayer...');
    try {
      const yesterday = addDaysToDateString(selectedDate, -1);
      const res = await api.get(`/nutrition/logs?date=${yesterday}`);
      const logsToCopy = res.data.filter((log) => log.mealIndex === mealIndex);

      if (logsToCopy.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay alimentos en esta comida ayer');
        return;
      }

      for (const log of logsToCopy) {
        await api.post('/nutrition/logs', {
          date: selectedDate,
          mealIndex: mealIndex,
          product: log.product,
          quantity: log.quantity,
          kcal: log.kcal,
          protein: log.protein,
          carbs: log.carbs,
          fat: log.fat,
          barcode: log.barcode,
          myFoodId: log.myFoodId,
          portionsJson: log.portionsJson,
        });
      }

      fetchData();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['week-summaries'] });
      toast.dismiss(loadingToast);
      toast.success('Ã‚Â¡Comida copiada!');
    } catch (err: any) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error('Error al copiar la comida');
    }
  };

  const {
    data = {},
    isLoading: loading,
    refetch: fetchData,
  } = useQuery<any, any>({
    queryKey: ['nutritionData', selectedDate],
    queryFn: async () => {
      const [macrosRes, mealsRes, settingsRes, logsRes] = await Promise.all([
        api.get('/nutrition/macros').catch(() => ({ data: null })),
        api.get('/nutrition/meals').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: null })),
        api.get(`/nutrition/logs?date=${selectedDate}`).catch(() => ({ data: [] })),
      ]);

      return {
        foodLogs: logsRes.data,
        macros: macrosRes.data,
        meals: mealsRes.data,
        settings: settingsRes.data,
      };
    },
    placeholderData: keepPreviousData,
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

  const deleteLogMutation = useMutation({
    mutationFn: (id) => api.delete(`/nutrition/logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['week-summaries'] });
      toast.success('Alimento eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar alimento');
    },
  });

  const handleDeleteLog = (id) => {
    deleteLogMutation.mutate(id);
  };

  const handleEditLog = (log) => {
    let hasPortions = false;
    try {
      if (log.portionsJson) {
        const p = JSON.parse(log.portionsJson);
        hasPortions = p && p.length > 0;
      }
    } catch (e: any) {
      console.error(e);
    }
    setEditInputMode(hasPortions ? 'portions' : 'grams');
    setEditingLog({
      id: log.id,
      date: log.date,
      mealIndex: log.mealIndex,
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
      portionsJson: log.portionsJson,
    });
  };

  const handleEditQuantityChange = (newQty) => {
    const q = parseFloat(newQty) || 0;
    setEditingLog((prev) => ({
      ...prev,
      quantity: q,
      kcal: Math.round(((prev._kcalPer100 * q) / 100) * 10) / 10,
      protein: Math.round(((prev._protPer100 * q) / 100) * 10) / 10,
      carbs: Math.round(((prev._carbsPer100 * q) / 100) * 10) / 10,
      fat: Math.round(((prev._fatPer100 * q) / 100) * 10) / 10,
    }));
  };

  const updateLogMutation = useMutation({
    mutationFn: (data: any) => api.put(`/nutrition/logs/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['week-summaries'] });
      setEditingLog(null);
      toast.success('Registro actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar');
    },
  });

  const handleUpdateLog = () => {
    if (!editingLog) return;
    updateLogMutation.mutate({
      id: editingLog.id,
      date: editingLog.date,
      mealIndex: editingLog.mealIndex,
      product: editingLog.product,
      quantity: editingLog.quantity,
      kcal: editingLog.kcal,
      protein: editingLog.protein,
      carbs: editingLog.carbs,
      fat: editingLog.fat,
      portionsJson: editingLog.portionsJson,
    });
  };

  const consumed = useMemo(() => {
    return (foodLogs || []).reduce(
      (acc, log) => ({
        kcal: acc.kcal + (Number(log.kcal) || 0),
        protein: acc.protein + (Number(log.protein) || 0),
        carbs: acc.carbs + (Number(log.carbs) || 0),
        fat: acc.fat + (Number(log.fat) || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [foodLogs]);

  if (loading) {
    return (
      <div className="fade-in">
        {/* Segmented Control Skeleton */}
        <Skeleton className="h-10 w-full max-w-sm mx-auto mb-6" />

        {/* Date Navigation Skeleton */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Macros Summary Skeleton */}
        <div className="kpi-grid mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card" style={{ padding: '0.75rem 1rem' }}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>

        {/* Meals Skeleton */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-8 w-full rounded-md opacity-50" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!macros || !settings) return null;



  const pieData = [
    { name: 'ProteÃƒÂ­nas Consumidas', value: consumed.protein * 4, color: 'var(--color-protein)' },
    { name: 'Hidratos Consumidos', value: consumed.carbs * 4, color: 'var(--color-carbs)' },
    { name: 'Grasas Consumidas', value: consumed.fat * 9, color: 'var(--color-fat)' },
    {
      name: 'CalorÃƒÂ­as Restantes',
      value: Math.max(0, macros.kcal - consumed.kcal),
      color: 'rgba(255,255,255,0.05)',
    },
  ];

  const totalProtein = macros.protein;

  return (
    <div className="fade-in">
      {/* Segmented Control */}
      <SegmentedControl
        options={[
          { label: 'Diario', value: 'diary' },
          { label: 'Mis Alimentos', value: 'foods' },
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'diary' | 'foods')}
        className="mb-6"
      />

      {activeTab === 'foods' ? (
        <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando alimentos...</div>}>
          <MyFoodsPage />
        </Suspense>
      ) : (
        <>
          {/* Date Navigation */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: 'var(--space-lg)',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
          >
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedDate((prev) => addDaysToDateString(prev, -1))}
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
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  minWidth: '140px',
                  textAlign: 'center',
                }}
              >
                {isTodayLocal(selectedDate)
                  ? 'Hoy'
                  : format(parseISO(selectedDate), 'd MMM yyyy', { locale: es })}
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedDate((prev) => addDaysToDateString(prev, 1))}
              style={{ padding: '0.4rem 1rem', borderRadius: '24px' }}
            >
              &rarr;
            </button>
          </div>

          {/* Global Add Button (FAB-style for mobile, fixed for PC) */}
          <button
            className="btn"
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
              color: 'var(--accent-text, white)',
              border: 'none',
            }}
            onClick={() => {
              setSelectedMealIndex(0);
              setSearchModalOpen(true);
            }} aria-label="Añadir alimento"
          >
            +
          </button>

          {/* Macro Summary */}
          <MacroSummaryHeader consumed={consumed} macros={macros} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Daily Food Logs */}
            <div className="nutrition-meals-grid">
              {meals.map((meal, index) => {
                const logs = foodLogs.filter((log) => log.mealIndex === index);

                const mealSubtotal = logs.reduce(
                  (acc, log) => ({
                    kcal: acc.kcal + (Number(log.kcal) || 0),
                    protein: acc.protein + (Number(log.protein) || 0),
                    carbs: acc.carbs + (Number(log.carbs) || 0),
                    fat: acc.fat + (Number(log.fat) || 0),
                  }),
                  { kcal: 0, protein: 0, carbs: 0, fat: 0 },
                );

                const isCollapsed = collapsedMeals[index];

                return (
                  <div
                    key={meal.id || index}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      border:
                        dragOverMealIndex === index ? '2px dashed var(--color-carbs)' : undefined,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnMeal(e, index)}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMealCollapse(index, e as any); } }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => toggleMealCollapse(index, e)}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <ChevronDown
                          size={18}
                          style={{
                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'var(--text-secondary)',
                          }}
                        />
                        <span style={{ marginRight: 'var(--space-xs)' }}>
                          <MealIcon
                            iconString={meal.icon || meal.name}
                            className="w-5 h-5 inline-block text-[var(--text-secondary)]"
                          />
                        </span>{' '}
                        {meal.name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '0.4rem',
                            borderRadius: '16px',
                            color: 'var(--text-secondary)',
                          }}
                          title="Copiar comida de ayer"
                          onClick={(e) => handleCopyFromYesterday(e, index)}
                        >
                          <Copy size={16} />
                        </button>
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
                    </div>

                    {logs.length > 0 && (
                      <div
                        className="meal-subtotal-row"
                        style={{ marginBottom: isCollapsed ? '0' : '0.75rem' }}
                      >
                        <span className="subtotal-val kcal">
                          {Math.round(mealSubtotal.kcal)} kcal
                        </span>
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
                            <div
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                fontStyle: 'italic',
                                marginTop: '0.25rem',
                              }}
                            >
                              Sin registrar
                            </div>
                          ) : (
                            logs.map((log) => (
                              <div
                                key={log.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, log)}
                                onDrag={(e) => handleDrag(e)}
                                style={{
                                  background: 'var(--bg-primary)',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  cursor: 'grab',
                                }}
                              >
                                {editingLog && editingLog.id === log.id ? (
                                  /* EDIT MODE */
                                  <div
                                    style={{
                                      padding: '0.75rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.5rem',
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 500,
                                        marginBottom: '0.15rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <span>{editingLog.product}</span>
                                    </div>
                                    {(() => {
                                      const basePortion = getBasePortion(editingLog.portionsJson);
                                      const hasPortions = !!basePortion;
                                      const multiplier =
                                        hasPortions && editingLog.quantity
                                          ? Number(
                                              (editingLog.quantity / basePortion.amount).toFixed(2),
                                            )
                                          : 0;
                                      const portionLabel = basePortion
                                        ? basePortion.label.replace(/^1\s*/, '')
                                        : 'ud';

                                      return (
                                        <div
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem',
                                            marginBottom: '0.25rem',
                                          }}
                                        >
                                          {hasPortions && (
                                            <div style={{ width: '100%' }}>
                                              <SegmentedControl
                                                options={[
                                                  { label: 'Gramos', value: 'grams' },
                                                  { label: 'PorciÃƒÂ³n', value: 'portions' },
                                                ]}
                                                value={editInputMode}
                                                onChange={(val: string) =>
                                                  setEditInputMode(val as 'grams' | 'portions')
                                                }
                                              />
                                            </div>
                                          )}

                                          {editInputMode === 'grams' || !hasPortions ? (
                                            <div
                                              style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              <input
                                                type="number"
                                                inputMode="decimal"
                                                className="form-input"
                                                style={{
                                                  fontSize: '1.2rem',
                                                  padding: '0.5rem',
                                                  fontWeight: 600,
                                                  width: '100px',
                                                  textAlign: 'center',
                                                }}
                                                value={
                                                  editingLog.quantity === 0
                                                    ? ''
                                                    : editingLog.quantity
                                                }
                                                onChange={(e) =>
                                                  handleEditQuantityChange(e.target.value)
                                                }
                                                autoFocus
                                              />
                                              <span
                                                style={{
                                                  fontSize: '1.1rem',
                                                  color: 'var(--text-secondary)',
                                                }}
                                              >
                                                g
                                              </span>
                                            </div>
                                          ) : (
                                            <div
                                              style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              <button
                                                className="btn btn-secondary"
                                                onClick={() =>
                                                  handleEditQuantityChange(
                                                    Math.max(
                                                      0,
                                                      (multiplier - 1) * basePortion.amount,
                                                    ),
                                                  )
                                                }
                                                style={{
                                                  width: '40px',
                                                  height: '40px',
                                                  fontSize: '1.2rem',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  padding: 0,
                                                }}
                                              >
                                                -
                                              </button>
                                              <input
                                                type="number"
                                                inputMode="decimal"
                                                className="form-input"
                                                style={{
                                                  fontSize: '1.2rem',
                                                  padding: '0.5rem',
                                                  fontWeight: 600,
                                                  width: '80px',
                                                  textAlign: 'center',
                                                }}
                                                value={multiplier === 0 ? '' : multiplier}
                                                onChange={(e) =>
                                                  handleEditQuantityChange(
                                                    Number(e.target.value) * basePortion.amount,
                                                  )
                                                }
                                                autoFocus
                                              />
                                              <button
                                                className="btn btn-secondary"
                                                onClick={() =>
                                                  handleEditQuantityChange(
                                                    (multiplier + 1) * basePortion.amount,
                                                  )
                                                }
                                                style={{
                                                  width: '40px',
                                                  height: '40px',
                                                  fontSize: '1.2rem',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  padding: 0,
                                                }}
                                              >
                                                +
                                              </button>
                                              <span
                                                style={{
                                                  fontSize: '1.1rem',
                                                  color: 'var(--text-secondary)',
                                                }}
                                              >
                                                x {portionLabel}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <div
                                      style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                                    >
                                      {Math.round(editingLog.kcal)} kcal | P:{' '}
                                      {editingLog.protein.toFixed(1)}g | C:{' '}
                                      {editingLog.carbs.toFixed(1)}g | G:{' '}
                                      {editingLog.fat.toFixed(1)}g
                                    </div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        justifyContent: 'flex-end',
                                      }}
                                    >
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '0.3rem 0.6rem' }}
                                        onClick={() => setEditingLog(null)}
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        className="btn btn-primary btn-sm"
                                        style={{ padding: '0.3rem 0.6rem' }}
                                        onClick={handleUpdateLog}
                                      >
                                        Guardar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* VIEW MODE */
                                  <SwipeableRow
                                    onEdit={() => handleEditLog(log)}
                                    onDelete={() => handleDeleteLog(log.id)}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 500, marginBottom: '0.15rem' }}>
                                          {log.product}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontWeight: 500,
                                              color: 'var(--text-primary)',
                                            }}
                                          >
                                            {(() => {
                                              const basePortion = getBasePortion(log.portionsJson);
                                              if (basePortion) {
                                                const count = Number(
                                                  (log.quantity / basePortion.amount).toFixed(1),
                                                );
                                                return `${count}x ${basePortion.label} (${log.quantity}g)`;
                                              }
                                              return `${log.quantity}g`;
                                            })()}
                                          </span>
                                          {' Ã¢â‚¬Â¢ '}
                                          {Math.round(Number(log.kcal) || 0)} kcal | P:{' '}
                                          {(Number(log.protein) || 0).toFixed(1)}g | C:{' '}
                                          {(Number(log.carbs) || 0).toFixed(1)}g | G:{' '}
                                          {(Number(log.fat) || 0).toFixed(1)}g
                                        </div>
                                      </div>
                                    </div>
                                  </SwipeableRow>
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
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1.5rem',
                marginBottom: 'var(--space-xxl)',
              }}
            >
              <h3
                style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '1rem' }}
              >
                DistribuciÃƒÂ³n de Macros
              </h3>
              <div style={{ width: '100%', maxWidth: '300px', height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {showChart ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(17, 24, 39, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                        }}
                        formatter={(value, name) => {
                          const total = pieData.reduce((a: any, b: any) => a + b.value, 0);
                          return [
                            `${Number(value).toFixed(0)} kcal (${((Number(value) / total) * 100).toFixed(1)}%)`,
                            name,
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                )}
              </div>
            </div>
          </div>

          <Suspense fallback={null}>
            {searchModalOpen && (
              <FoodSearchModal
                isOpen={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
            mealIndex={selectedMealIndex}
            date={selectedDate}
            onLogAdded={() => {
              fetchData();
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              queryClient.invalidateQueries({ queryKey: ['week-summaries'] });
            }}
            meals={meals}
          />
            )}
          </Suspense>
        </>
      )}
    </div>
  );
}




