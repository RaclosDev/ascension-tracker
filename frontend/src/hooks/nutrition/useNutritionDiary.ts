import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { FoodLog, Macros, Meal, UserSettings } from '../../types/api';
import { EditingLog } from '../../types/nutrition';
import { getLocalDateString, addDaysToDateString } from '../../utils/dateHelper';
import { belongsToMeal } from '../../utils/mealGroups';

export function useNutritionDiary() {
  const queryClient = useQueryClient();
  const copyingMeals = useRef(new Set<string>());

  // Date and Modals State
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState(0);
  const [editingLog, setEditingLog] = useState<EditingLog | null>(null);
  const [editInputMode, setEditInputMode] = useState<'grams' | 'portions'>('grams');

  const [collapsedMeals, setCollapsedMeals] = useState<Record<number, boolean>>({});
  const [dragOverMealIndex, setDragOverMealIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'diary' | 'foods'>('diary');
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const {
    data,
    isLoading: loading,
    refetch: fetchData,
    isError,
    isFetching,
  } = useQuery<{ foodLogs: FoodLog[]; macros: Macros; meals: Meal[]; settings: UserSettings }>({
    queryKey: ['nutritionData', selectedDate],
    queryFn: async ({ signal }) => {
      const [macrosRes, mealsRes, settingsRes, logsRes] = await Promise.all([
        api.get<Macros>('/nutrition/macros', { signal }),
        api.get<Meal[]>('/nutrition/meals', { signal }),
        api.get<UserSettings>('/settings', { signal }),
        api.get<FoodLog[]>(`/nutrition/logs?date=${selectedDate}`, { signal }),
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

  const { foodLogs = [], macros = null, meals = [], settings = null } = data || {};

  const mealCount = meals.length;
  useEffect(() => {
    if (mealCount > 0) {
      const newCollapsed: Record<number, boolean> = {};
      for (let i = 0; i < mealCount; i++) {
        newCollapsed[i] = true;
      }
      setCollapsedMeals(newCollapsed);
    }
  }, [mealCount]);

  const toggleMealCollapse = (index: number, e?: React.MouseEvent | React.KeyboardEvent) => {
    setCollapsedMeals((prev: Record<number, boolean>) => {
      const isCurrentlyCollapsed = prev[index] !== false;
      return {
        ...prev,
        [index]: !isCurrentlyCollapsed,
      };
    });

    if (collapsedMeals[index] !== false && e?.currentTarget) {
      const el = e.currentTarget as HTMLElement;
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

  // Drag and Drop Handlers with safe requestAnimationFrame
  const scrollRAFRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scrollRAFRef.current !== null) {
        cancelAnimationFrame(scrollRAFRef.current);
        scrollRAFRef.current = null;
      }
    };
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, log: FoodLog) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ ...log, sourceMealIndex: log.mealIndex }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.clientY === 0) return;
    if (scrollRAFRef.current === null) {
      scrollRAFRef.current = requestAnimationFrame(() => {
        const threshold = 250;
        if (e.clientY < threshold) {
          const speed = Math.max(8, 35 - (e.clientY / threshold) * 30);
          window.scrollBy({ top: -speed, behavior: 'auto' });
        } else if (window.innerHeight - e.clientY < threshold) {
          const distFromEdge = window.innerHeight - e.clientY;
          const speed = Math.max(8, 35 - (distFromEdge / threshold) * 30);
          window.scrollBy({ top: speed, behavior: 'auto' });
        }
        scrollRAFRef.current = null;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverMealIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverMealIndex(null);
  };

  const handleDropOnMeal = async (e: React.DragEvent<HTMLDivElement>, targetMealIndex: number) => {
    e.preventDefault();
    setDragOverMealIndex(null);
    if (scrollRAFRef.current !== null) {
      cancelAnimationFrame(scrollRAFRef.current);
      scrollRAFRef.current = null;
    }
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const parsed = JSON.parse(rawData);
      const targetMeal = meals[targetMealIndex];
      if (!targetMeal) return;
      if (
        parsed.mealKey
          ? parsed.mealKey === targetMeal.mealKey
          : parsed.sourceMealIndex === targetMealIndex
      )
        return;

      await api.put(`/nutrition/logs/${parsed.id}`, {
        date: parsed.date || selectedDate,
        product: parsed.product,
        quantity: parsed.quantity,
        kcal: parsed.kcal,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        mealIndex: targetMealIndex,
        mealKey: targetMeal.mealKey,
        portionsJson: parsed.portionsJson,
      });
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
      toast.success('Movido correctamente');
    } catch {
      toast.error('Error al mover');
    }
  };

  // Copy from Yesterday
  const handleCopyFromYesterday = async (
    e: React.MouseEvent<HTMLButtonElement>,
    mealIndex: number,
  ) => {
    e.stopPropagation();
    const copyKey = `${selectedDate}:${mealIndex}`;
    if (copyingMeals.current.has(copyKey)) return;
    copyingMeals.current.add(copyKey);
    const loadingToast = toast.loading('Copiando de ayer...');
    try {
      const yesterday = addDaysToDateString(selectedDate, -1);
      const [res, current] = await Promise.all([
        api.get<FoodLog[]>(`/nutrition/logs?date=${yesterday}`),
        api.get<FoodLog[]>(`/nutrition/logs?date=${selectedDate}`),
      ]);
      const meal = meals[mealIndex];
      const matchesMeal = (log: FoodLog) =>
        meal ? belongsToMeal(log, meal, mealIndex) : !log.mealKey && log.mealIndex === mealIndex;
      const logsToCopy = res.data.filter(matchesMeal);

      if (logsToCopy.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay alimentos en esta comida ayer');
        return;
      }

      // Filter out items already logged in this meal today to prevent duplicates
      const currentLogsInMeal = current.data.filter(matchesMeal);
      const newLogsToCopy = logsToCopy.filter(
        (yesterdayLog: FoodLog) =>
          !currentLogsInMeal.some(
            (todayLog: FoodLog) =>
              todayLog.product?.trim().toLowerCase() === yesterdayLog.product?.trim().toLowerCase(),
          ),
      );

      if (newLogsToCopy.length === 0) {
        toast.dismiss(loadingToast);
        toast('Los alimentos de ayer ya están registrados en esta comida', { icon: 'ℹ️' });
        return;
      }

      const results = await Promise.allSettled(
        newLogsToCopy.map((log: FoodLog) =>
          api.post('/nutrition/logs', {
            date: selectedDate,
            mealIndex: mealIndex,
            mealKey: meal?.mealKey,
            product: log.product,
            quantity: log.quantity,
            kcal: log.kcal,
            protein: log.protein,
            carbs: log.carbs,
            fat: log.fat,
            portionsJson: log.portionsJson || null,
          }),
        ),
      );

      await queryClient.invalidateQueries({ queryKey: ['nutritionData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
      toast.dismiss(loadingToast);
      const failures = results.filter((result) => result.status === 'rejected').length;
      if (failures > 0) {
        toast.error(
          `Se han copiado ${results.length - failures} alimentos; ${failures} no se pudieron copiar. Puedes reintentarlo.`,
        );
        return;
      }
      toast.success(
        newLogsToCopy.length === logsToCopy.length
          ? '¡Comida copiada!'
          : `¡${newLogsToCopy.length} alimento(s) añadidos (los ya existentes se omitieron)!`,
      );
    } catch (err: unknown) {
      console.error('Error al copiar la comida:', err instanceof Error ? err.message : String(err));
      toast.dismiss(loadingToast);
      toast.error('Error al copiar la comida');
    } finally {
      copyingMeals.current.delete(copyKey);
    }
  };

  // Delete Log Mutation with Undo support
  const deleteLogMutation = useMutation<unknown, Error, { id: number | string; log?: FoodLog }>({
    mutationFn: ({ id }) => api.delete(`/nutrition/logs/${id}`),
    onSuccess: (_, { log }) => {
      queryClient.invalidateQueries({ queryKey: ['nutritionData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
      if (!log) {
        toast.success('Alimento eliminado');
        return;
      }
      toast.success(
        (t) =>
          React.createElement(
            'span',
            { className: 'flex items-center gap-3' },
            React.createElement('span', null, 'Alimento eliminado'),
            React.createElement(
              'button',
              {
                type: 'button',
                className:
                  'text-xs font-bold underline opacity-90 hover:opacity-100 cursor-pointer',
                onClick: async () => {
                  toast.dismiss(t.id);
                  try {
                    await api.post('/nutrition/logs', {
                      date: log.date,
                      mealIndex: log.mealIndex,
                      mealKey: log.mealKey,
                      mealName: log.mealName,
                      mealIcon: log.mealIcon,
                      product: log.product,
                      quantity: log.quantity,
                      kcal: log.kcal,
                      protein: log.protein,
                      carbs: log.carbs,
                      fat: log.fat,
                      portionsJson: log.portionsJson || null,
                    });
                    queryClient.invalidateQueries({ queryKey: ['nutritionData'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                    queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
                    queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
                    toast.success('¡Alimento restaurado!');
                  } catch {
                    toast.error('Error al restaurar alimento');
                  }
                },
              },
              'Deshacer',
            ),
          ),
        { duration: 5000 },
      );
    },
    onError: () => {
      toast.error('Error al eliminar alimento');
    },
  });

  const handleDeleteLog = (id: number | string) => {
    const logToDelete = foodLogs.find((l: FoodLog) => l.id === id);
    deleteLogMutation.mutate({ id, log: logToDelete });
  };

  // Edit Log Handlers
  const handleEditLog = (log: FoodLog) => {
    let hasPortions = false;
    try {
      if (log.portionsJson) {
        const p = JSON.parse(log.portionsJson);
        hasPortions = p && p.length > 0;
      }
    } catch (e: unknown) {
      console.error('Error al analizar portionsJson:', e instanceof Error ? e.message : String(e));
    }
    setEditInputMode(hasPortions ? 'portions' : 'grams');
    const isZeroQty = log.quantity <= 0;
    setEditingLog({
      id: log.id,
      date: log.date,
      mealIndex: log.mealIndex,
      mealKey: log.mealKey,
      mealName: log.mealName,
      mealIcon: log.mealIcon,
      product: log.product,
      quantity: log.quantity,
      kcal: log.kcal,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      _kcalPer100: isZeroQty ? log.kcal : (log.kcal / log.quantity) * 100,
      _protPer100: isZeroQty ? log.protein : (log.protein / log.quantity) * 100,
      _carbsPer100: isZeroQty ? log.carbs : (log.carbs / log.quantity) * 100,
      _fatPer100: isZeroQty ? log.fat : (log.fat / log.quantity) * 100,
      portionsJson: log.portionsJson,
    });
  };

  const handleEditQuantityChange = (newQty: number | string) => {
    const q = typeof newQty === 'string' ? parseFloat(newQty) || 0 : newQty;
    setEditingLog((prev: EditingLog | null) =>
      prev
        ? {
            ...prev,
            quantity: q,
            kcal: Math.round(((prev._kcalPer100 * q) / 100) * 10) / 10,
            protein: Math.round(((prev._protPer100 * q) / 100) * 10) / 10,
            carbs: Math.round(((prev._carbsPer100 * q) / 100) * 10) / 10,
            fat: Math.round(((prev._fatPer100 * q) / 100) * 10) / 10,
          }
        : prev,
    );
  };

  const updateLogMutation = useMutation({
    mutationFn: (data: Partial<FoodLog>) => api.put(`/nutrition/logs/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
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
      mealKey: editingLog.mealKey,
      mealName: editingLog.mealName,
      mealIcon: editingLog.mealIcon,
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
      (acc: Macros, log: FoodLog) => ({
        kcal: acc.kcal + (Number(log.kcal) || 0),
        protein: acc.protein + (Number(log.protein) || 0),
        carbs: acc.carbs + (Number(log.carbs) || 0),
        fat: acc.fat + (Number(log.fat) || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [foodLogs]);

  const pieData = useMemo(() => {
    if (!macros) return [];
    return [
      { name: 'Proteínas Consumidas', value: consumed.protein * 4, color: 'var(--color-protein)' },
      { name: 'Hidratos Consumidos', value: consumed.carbs * 4, color: 'var(--color-carbs)' },
      { name: 'Grasas Consumidas', value: consumed.fat * 9, color: 'var(--color-fat)' },
      {
        name: 'Calorías Restantes',
        value: Math.max(0, macros.kcal - consumed.kcal),
        color: 'rgba(255,255,255,0.05)',
      },
    ];
  }, [macros, consumed]);

  return {
    isError,
    isFetching,
    selectedDate,
    setSelectedDate,
    searchModalOpen,
    setSearchModalOpen,
    selectedMealIndex,
    setSelectedMealIndex,
    editingLog,
    editInputMode,
    setEditInputMode,
    collapsedMeals,
    dragOverMealIndex,
    activeTab,
    setActiveTab,
    showChart,
    foodLogs,
    macros,
    meals,
    settings,
    loading,
    fetchData,
    consumed,
    pieData,
    toggleMealCollapse,
    handleDragStart,
    handleDrag,
    handleDragOver,
    handleDragLeave,
    handleDropOnMeal,
    handleCopyFromYesterday,
    handleDeleteLog,
    handleEditLog,
    handleEditQuantityChange,
    handleUpdateLog,
    setEditingLog,
  };
}
