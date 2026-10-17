import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { FoodLog, Macros, Meal, UserSettings } from '../../types/api';
import { EditingLog } from '../../types/nutrition';
import { getLocalDateString, addDaysToDateString } from '../../utils/dateHelper';

export function useNutritionDiary() {
  const queryClient = useQueryClient();

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

  // Main Data Query
  const {
    data,
    isLoading: loading,
    refetch: fetchData,
  } = useQuery<{ foodLogs: FoodLog[]; macros: Macros; meals: Meal[]; settings: UserSettings }>({
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

  const { foodLogs = [], macros = null, meals = [], settings = null } = data || {};

  useEffect(() => {
    if (meals.length > 0) {
      const newCollapsed: Record<number, boolean> = {};
      meals.forEach((_: Meal, i: number) => {
        newCollapsed[i] = true;
      });
      setCollapsedMeals(newCollapsed);
    }
  }, [meals.length]);

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
      if (parsed.sourceMealIndex === targetMealIndex) return;

      await api.put(`/nutrition/logs/${parsed.id}`, {
        date: parsed.date || selectedDate,
        product: parsed.product,
        quantity: parsed.quantity,
        kcal: parsed.kcal,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        mealIndex: targetMealIndex,
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
    const loadingToast = toast.loading('Copiando de ayer...');
    try {
      const yesterday = addDaysToDateString(selectedDate, -1);
      const res = await api.get(`/nutrition/logs?date=${yesterday}`);
      const logsToCopy = res.data.filter((log: FoodLog) => log.mealIndex === mealIndex);

      if (logsToCopy.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay alimentos en esta comida ayer');
        return;
      }

      await Promise.all(
        logsToCopy.map((log: FoodLog) =>
          api.post('/nutrition/logs', {
            date: selectedDate,
            mealIndex: mealIndex,
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

      fetchData();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
      toast.dismiss(loadingToast);
      toast.success('¡Comida copiada!');
    } catch (err: unknown) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error('Error al copiar la comida');
    }
  };

  // Delete Log Mutation
  const deleteLogMutation = useMutation<unknown, Error, number | string>({
    mutationFn: (id) => api.delete(`/nutrition/logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
      toast.success('Alimento eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar alimento');
    },
  });

  const handleDeleteLog = (id: number | string) => {
    deleteLogMutation.mutate(id);
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
      console.error(e);
    }
    setEditInputMode(hasPortions ? 'portions' : 'grams');
    const isZeroQty = log.quantity <= 0;
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
