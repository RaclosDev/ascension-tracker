import { lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FoodLog, Meal } from '../types/api';
import { Loader2, Plus } from 'lucide-react';
import { SegmentedControl } from '../components/ui/segmented-control';
import { Skeleton } from '../components/ui/skeleton';
import MacroSummaryHeader from '../components/nutrition/MacroSummaryHeader';
import { NutritionDateBar } from '../components/nutrition/NutritionDateBar';
import { MealFoodGroup } from '../components/nutrition/MealFoodGroup';
import { useNutritionDiary } from '../hooks/nutrition/useNutritionDiary';

const MyFoodsPage = lazy(() => import('./MyFoodsPage'));
const FoodSearchModal = lazy(() => import('../components/FoodSearchModal'));
const NutritionPieChart = lazy(() => import('../components/nutrition/NutritionPieChart'));

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const {
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
  } = useNutritionDiary();

  if (loading) {
    return (
      <div className="fade-in">
        <Skeleton className="h-10 w-full max-w-sm mx-auto mb-6" />
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

        <div className="kpi-grid mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card" style={{ padding: '0.75rem 1rem' }}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>

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

  return (
    <div className="fade-in">
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
        <Suspense
          fallback={<div className="p-4 text-center text-gray-500">Cargando alimentos...</div>}
        >
          <MyFoodsPage />
        </Suspense>
      ) : (
        <>
          <NutritionDateBar selectedDate={selectedDate} onDateChange={setSelectedDate} />

          <button
            type="button"
            className="fixed z-40 rounded-full w-14 h-14 flex items-center justify-center bg-[var(--accent-primary)] text-white shadow-xl shadow-[var(--accent-primary)]/30 hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              bottom: 'calc(90px + env(safe-area-inset-bottom, 16px))',
              right: '1.25rem',
            }}
            onClick={() => {
              setSelectedMealIndex(0);
              setSearchModalOpen(true);
            }}
            aria-label="Añadir alimento"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>

          <MacroSummaryHeader consumed={consumed} macros={macros} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="nutrition-meals-grid">
              {meals.map((meal: Meal, index: number) => {
                const logs = foodLogs.filter((log: FoodLog) => log.mealIndex === index);
                const isCollapsed = collapsedMeals[index];

                return (
                  <MealFoodGroup
                    key={meal.id || index}
                    meal={meal}
                    mealIndex={index}
                    logs={logs}
                    isCollapsed={isCollapsed}
                    isDragOver={dragOverMealIndex === index}
                    editingLog={editingLog}
                    editInputMode={editInputMode}
                    onToggleCollapse={toggleMealCollapse}
                    onCopyFromYesterday={handleCopyFromYesterday}
                    onOpenAddFoodModal={(mIdx) => {
                      setSelectedMealIndex(mIdx);
                      setSearchModalOpen(true);
                    }}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropOnMeal}
                    onEditLog={handleEditLog}
                    onDeleteLog={handleDeleteLog}
                    onEditInputModeChange={setEditInputMode}
                    onEditQuantityChange={handleEditQuantityChange}
                    onUpdateLog={handleUpdateLog}
                    onCancelEdit={() => setEditingLog(null)}
                  />
                );
              })}
            </div>

            <div className="card flex flex-col items-center p-6 mb-12">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                Distribución de Macros
              </h3>
              <div
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: 250,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {showChart ? (
                  <Suspense fallback={<Skeleton className="w-48 h-48 rounded-full mx-auto" />}>
                    <NutritionPieChart pieData={pieData} />
                  </Suspense>
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
                  queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
                  queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
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
