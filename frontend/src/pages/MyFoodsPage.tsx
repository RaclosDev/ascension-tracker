import { useState, useEffect, lazy, Suspense } from 'react';
import { Skeleton } from '../components/ui/skeleton';
import { useMyFoodsData } from '../hooks/my-foods/useMyFoodsData';
import { useFoodFilters } from '../hooks/my-foods/useFoodFilters';
import { useFoodForms } from '../hooks/my-foods/useFoodForms';
import { useScannerAndOCR } from '../hooks/my-foods/useScannerAndOCR';
import { useAiAssistant } from '../hooks/my-foods/useAiAssistant';
import { useMealSelection } from '../hooks/my-foods/useMealSelection';

import { FoodFiltersBar } from '../components/my-foods/FoodFiltersBar';
import { BulkSelectionToolbar } from '../components/my-foods/BulkSelectionToolbar';
import FoodFormModal from '../components/my-foods/FoodFormModal';
import RecipeFormModal from '../components/my-foods/RecipeFormModal';
import MealSelectorModal from '../components/my-foods/MealSelectorModal';
import FoodCard from '../components/my-foods/FoodCard';
import RecipeCard from '../components/my-foods/RecipeCard';
import AiFoodModal from '../components/my-foods/AiFoodModal';

import { ChevronDown, ChevronRight, ScanLine, Pencil, X, Loader2, Plus, Sparkles } from 'lucide-react';
import { PageFoodItem } from '../types/myfoods';
import { Recipe, FoodLog, SavedFood } from '../types/api';
const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'));

export default function MyFoodsPage() {
  const {
    recentFoods,
    savedFoods,
    recipes,
    isLoading,
    fetchData,
    deleteFoodsBulk,
    deleteRecipe,
    deleteSavedFood,
  } = useMyFoodsData();

  const [searchFilter, setSearchFilter] = useState('all');
  const filters = useFoodFilters(recentFoods, savedFoods, recipes);
  const forms = useFoodForms(fetchData);

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const ai = useAiAssistant(fetchData);

  const scanner = useScannerAndOCR(
    fetchData,
    setIsActionMenuOpen,
    forms.setEditingFoodId,
    forms.setFoodForm,
    forms.setIsFoodFormOpen,
  );

  const meals = useMealSelection(savedFoods);

  useEffect(() => {
    (window as unknown as { __testScanBarcode?: (code: string) => void }).__testScanBarcode =
      scanner.handleScanBarcode;
    return () => {
      delete (window as unknown as { __testScanBarcode?: unknown }).__testScanBarcode;
    };
  }, [scanner.handleScanBarcode]);

  const [expandedSections, setExpandedSections] = useState({
    recent: true,
    foods: true,
    recipes: true,
  });
  const toggleSection = (sec: keyof typeof expandedSections) =>
    setExpandedSections((p) => ({ ...p, [sec]: !p[sec] }));

  if (isLoading)
    return (
      <div className="fade-in">
        <Skeleton className="h-10 w-full mb-3" />
      </div>
    );

  return (
    <div className="fade-in">
      <FoodFiltersBar
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
        totalResults={filters.totalResults}
        filteredRecentCount={filters.filteredRecent.length}
        filteredFoodsCount={filters.filteredFoods.length}
        filteredRecipesCount={filters.filteredRecipes.length}
        macroFilter={filters.macroFilter}
        setMacroFilter={filters.setMacroFilter}
        sortBy={filters.sortBy}
        setSortBy={filters.setSortBy}
      />

      <div className="flex flex-col lg:flex-row gap-5">
        {/* MAIN CONTENT AREA: MIS ALIMENTOS */}
        {['all', 'foods'].includes(searchFilter) && (
          <div
            className={`flex flex-col gap-5 ${searchFilter === 'all' ? 'w-full lg:w-2/3' : 'w-full'}`}
          >
            <div
              className={`card ${scanner.dragOverTarget === 'foods' ? 'border-2 border-dashed border-[var(--color-carbs)]' : ''}`}
              onDragOver={(e) => scanner.handleDragOver(e, 'foods')}
              onDragLeave={scanner.handleDragLeave}
              onDrop={scanner.handleDropOnFoods}
            >
              <div
                onClick={() => toggleSection('foods')}
                className="flex justify-between items-center bg-white/5 p-2 rounded-lg cursor-pointer"
              >
                <h2 className="text-xl m-0 font-semibold">Mis Alimentos</h2>
                {expandedSections.foods ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>

              {expandedSections.foods && (
                <div className="flex flex-col gap-4 mt-4">
                  <BulkSelectionToolbar
                    selectedCount={meals.selectedFoods.size}
                    onBulkDelete={async () => {
                      if (await deleteFoodsBulk(meals.selectedFoods)) meals.clearSelection();
                    }}
                    onClearSelection={meals.clearSelection}
                    onOpenMealSelector={meals.openMealSelector}
                  />

                  <div
                    className={
                      filters.viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'
                        : 'flex flex-col gap-2'
                    }
                  >
                    {filters.filteredFoods.map((f: PageFoodItem) => (
                      <FoodCard
                        key={f.id}
                        food={f as unknown as SavedFood}
                        isSelected={f.id !== undefined && meals.selectedFoods.has(Number(f.id))}
                        onToggleSelect={meals.toggleFoodSelection}
                        onEdit={(food) => forms.handleEditFood(food as unknown as PageFoodItem)}
                        onDelete={deleteSavedFood}
                        viewMode={filters.viewMode as 'grid' | 'list'}
                        onDragStart={(e, d) => scanner.handleDragStart(e, d as PageFoodItem)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RECIENTES Y RECETAS */}
        {['all', 'recent', 'recipes'].includes(searchFilter) && (
          <div
            className={`flex flex-col gap-5 ${searchFilter === 'all' ? 'w-full lg:w-1/3' : 'w-full'}`}
          >
            {/* RECIENTES */}
            {['all', 'recent'].includes(searchFilter) && (
              <div className="card flex flex-col">
                <div
                  onClick={() => toggleSection('recent')}
                  className="flex justify-between items-center bg-white/5 p-2 rounded-lg cursor-pointer mb-3"
                >
                  <h2 className="text-lg m-0 font-semibold">Recientes</h2>
                </div>
                {expandedSections.recent && (
                  <div className="flex flex-col gap-2 flex-1">
                    {filters.filteredRecent.map((f: FoodLog) => (
                      <div
                        key={f.id}
                        className="p-2 bg-white/10 rounded-lg flex justify-between items-center"
                      >
                        <div className="text-sm font-medium">{f.product}</div>
                        <button
                          onClick={() => scanner.saveRecentAsFood(f as unknown as PageFoodItem)}
                          className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded"
                        >
                          Añadir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RECETAS */}
            {['all', 'recipes'].includes(searchFilter) && (
              <div
                className={`card ${scanner.dragOverTarget === 'recipes' ? 'border-2 border-dashed border-[var(--color-warning)]' : ''}`}
                onDragOver={(e) => scanner.handleDragOver(e, 'recipes')}
                onDragLeave={scanner.handleDragLeave}
                onDrop={scanner.handleDropOnRecipes}
              >
                <div
                  onClick={() => toggleSection('recipes')}
                  className="flex justify-between items-center bg-white/5 p-2 rounded-lg cursor-pointer"
                >
                  <h2 className="text-lg m-0 font-semibold">Mis Recetas</h2>
                  {expandedSections.recipes ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
                {expandedSections.recipes && (
                  <div className="flex flex-col gap-2 mt-4">
                    {filters.filteredRecipes.map((r: Recipe) => (
                      <RecipeCard key={r.id} recipe={r} onEdit={forms.handleEditRecipe} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <FoodFormModal
        isOpen={forms.isFoodFormOpen}
        onClose={() => {
          forms.setIsFoodFormOpen(false);
          forms.setEditingFoodId(null);
        }}
        foodForm={forms.foodForm}
        updateFoodForm={forms.updateFoodForm}
        handleAddSavedFood={forms.handleAddSavedFood}
        editingFoodId={forms.editingFoodId}
        handleDeleteFood={deleteSavedFood}
      />
      <RecipeFormModal
        isOpen={forms.isRecipeFormOpen}
        onToggle={() => forms.setIsRecipeFormOpen(!forms.isRecipeFormOpen)}
        recipeForm={forms.recipeForm}
        updateRecipeForm={forms.updateRecipeForm}
        handleAddRecipe={forms.handleAddRecipe}
        editingRecipeId={forms.editingRecipeId}
        onCancelEdit={() => forms.setIsRecipeFormOpen(false)}
        handleDeleteRecipe={deleteRecipe}
      />

      <MealSelectorModal
        isOpen={meals.isMealSelectorOpen}
        onClose={() => meals.setIsMealSelectorOpen(false)}
        selectedFoods={meals.selectedFoods}
        savedFoods={savedFoods}
        bulkQuantities={meals.bulkQuantities}
        setBulkQuantities={meals.setBulkQuantities}
        mealSelectorDate={meals.mealSelectorDate}
        setMealSelectorDate={meals.setMealSelectorDate}
        isAddingToMeal={meals.isAddingToMeal}
        handleBulkAddToMeal={meals.handleBulkAddToMeal}
      />

      <AiFoodModal
        isOpen={ai.isAiModalOpen}
        onClose={() => ai.setIsAiModalOpen(false)}
        aiQuery={ai.aiQuery}
        setAiQuery={ai.setAiQuery}
        isListening={ai.isListening}
        toggleListening={ai.toggleListening}
        stopListening={ai.stopListening}
        handleAiSubmit={ai.handleAiSubmit}
        pendingAiCount={ai.pendingAiCount}
      />

      <button
        type="button"
        aria-label="Crear alimento"
        aria-haspopup="dialog"
        aria-expanded={isActionMenuOpen}
        className="fixed z-50 right-5 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] flex size-14 items-center justify-center rounded-full border border-white/15 bg-[var(--accent-primary,#0085FF)] text-white shadow-[0_8px_28px_rgba(0,133,255,0.35)] transition-transform duration-150 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary,#0085FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setIsActionMenuOpen(true)}
      >
        <Plus className="size-7" strokeWidth={2.25} />
      </button>

      {isActionMenuOpen && (
        <div
          className="fixed inset-0 z-[1050] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setIsActionMenuOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-food-sheet-title"
            className="w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-white/10 bg-[var(--bg-glass-strong,rgba(17,24,39,0.98))] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-12px_48px_rgba(0,0,0,0.4)] sm:rounded-2xl sm:pb-5"
            style={{ maxHeight: 'min(82dvh, 640px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id="create-food-sheet-title" className="m-0 text-lg font-semibold text-[var(--text-primary,#fff)]">
                  Crear alimento
                </h3>
                <p className="mb-0 mt-1 text-sm text-[var(--text-secondary,#a1a1aa)]">
                  Elige cómo quieres añadirlo a tu biblioteca.
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar menú de creación"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary,#0085FF)]"
                onClick={() => setIsActionMenuOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="group flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left transition-colors hover:border-[var(--accent-primary,#0085FF)]/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary,#0085FF)]"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  ai.setIsAiModalOpen(true);
                }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-primary,#0085FF)]/25 bg-[var(--accent-primary,#0085FF)]/10 text-[var(--accent-primary,#0085FF)]">
                  <Sparkles className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[var(--text-primary,#fff)]">Crear con IA</span>
                  <span className="mt-0.5 block text-sm text-[var(--text-secondary,#a1a1aa)]">Describe el alimento por texto o voz</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                className="group flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left transition-colors hover:border-[var(--accent-primary,#0085FF)]/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary,#0085FF)]"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  scanner.setIsScannerOpen(true);
                }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80">
                  <ScanLine className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[var(--text-primary,#fff)]">Escanear código</span>
                  <span className="mt-0.5 block text-sm text-[var(--text-secondary,#a1a1aa)]">Código de barras o QR</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                className="group flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left transition-colors hover:border-[var(--accent-primary,#0085FF)]/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary,#0085FF)]"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  scanner.ocrFileRef.current?.click();
                }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80">
                  <ScanLine className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[var(--text-primary,#fff)]">Leer etiqueta nutricional</span>
                  <span className="mt-0.5 block text-sm text-[var(--text-secondary,#a1a1aa)]">Extrae los valores de una foto</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                className="group flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left transition-colors hover:border-[var(--accent-primary,#0085FF)]/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary,#0085FF)]"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  forms.openNewFoodForm();
                }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80">
                  <Pencil className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[var(--text-primary,#fff)]">Crear manualmente</span>
                  <span className="mt-0.5 block text-sm text-[var(--text-secondary,#a1a1aa)]">Introduce los macros tú mismo</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <button
              type="button"
              className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 font-medium text-[var(--text-secondary,#a1a1aa)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text-primary,#fff)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary,#0085FF)]"
              onClick={() => setIsActionMenuOpen(false)}
            >
              Cancelar
            </button>
          </section>
        </div>
      )}

      {scanner.isScannerOpen && (
        <div className="fixed inset-0 bg-black/75 z-[1050] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-white">Escanear</h3>
              <button
                className="text-zinc-400 hover:text-white"
                onClick={() => scanner.setIsScannerOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {scanner.lookupError && (
              <div className="p-3 mb-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">
                {scanner.lookupError}
              </div>
            )}

            {scanner.isLookingUpCode ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-zinc-300 text-sm m-0">Buscando producto...</p>
              </div>
            ) : scanner.scannedProduct ? (
              <div className="flex flex-col gap-4 p-4 bg-zinc-800/80 rounded-xl border border-zinc-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-white font-semibold text-lg m-0">
                      {scanner.scannedProduct.name}
                    </h4>
                    {scanner.scannedProduct.brand && (
                      <p className="text-zinc-400 text-sm m-0">{scanner.scannedProduct.brand}</p>
                    )}
                  </div>
                  {scanner.scannedProduct.imageUrl && (
                    <img
                      src={scanner.scannedProduct.imageUrl}
                      alt={scanner.scannedProduct.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center py-2 bg-zinc-900/60 rounded-lg">
                  <div>
                    <span className="block text-xs text-zinc-400">Kcal</span>
                    <span className="text-sm font-semibold text-white">
                      {scanner.scannedProduct.kcal}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400">Prot</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {scanner.scannedProduct.protein}g
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400">Carbs</span>
                    <span className="text-sm font-semibold text-amber-400">
                      {scanner.scannedProduct.carbs}g
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400">Grasa</span>
                    <span className="text-sm font-semibold text-rose-400">
                      {scanner.scannedProduct.fat}g
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    className="btn btn-primary flex-1 py-2 text-sm font-medium"
                    onClick={scanner.handleSaveScannedProduct}
                  >
                    Guardar
                  </button>
                  <button
                    className="btn btn-secondary flex-1 py-2 text-sm font-medium"
                    onClick={scanner.handleEditScannedProduct}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex justify-center p-8">
                    <Skeleton className="w-12 h-12 rounded-full" />
                  </div>
                }
              >
                <BarcodeScanner
                  onScanSuccess={scanner.handleScanBarcode}
                  onScanError={console.error}
                />
              </Suspense>
            )}
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={scanner.ocrFileRef}
        className="hidden"
        onChange={scanner.handleOcrUpload}
      />
    </div>
  );
}
