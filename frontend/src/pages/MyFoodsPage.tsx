import { useState, useEffect, Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
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

import { ChevronDown, ChevronRight, ScanLine, Pencil, X, Loader2, Check } from 'lucide-react';
import { PageFoodItem } from '../types/myfoods';
import { Recipe, FoodLog, SavedFood } from '../types/api';
import { isFoodRegistered } from '../utils/nutritionHelpers';
const BarcodeScanner = lazyWithRetry(() => import('../components/BarcodeScanner'));

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
                    {filters.filteredRecent.map((f: FoodLog) => {
                      const registered = isFoodRegistered(f.product, savedFoods, recipes);
                      return (
                        <div
                          key={f.id}
                          className="p-2 bg-white/10 rounded-lg flex justify-between items-center"
                        >
                          <div className="text-sm font-medium">{f.product}</div>
                          {registered ? (
                            <span className="text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1 font-medium select-none">
                              <Check className="w-3.5 h-3.5" /> Guardado
                            </span>
                          ) : (
                            <button
                              onClick={() => scanner.saveRecentAsFood(f as unknown as PageFoodItem)}
                              className="text-xs bg-[var(--accent-glow)] text-[var(--accent-primary-light)] border border-[var(--accent-primary)]/30 px-2 py-1 rounded-lg hover:bg-[var(--accent-primary)]/30 transition-colors"
                            >
                              Añadir
                            </button>
                          )}
                        </div>
                      );
                    })}
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
        aria-label="Crear nuevo alimento"
        className="fixed z-50 bottom-[calc(75px+env(safe-area-inset-bottom))] right-5 w-14 h-14 rounded-full flex items-center justify-center bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 text-white text-2xl font-bold shadow-lg shadow-[var(--accent-shadow)] border-none transition-all cursor-pointer"
        onClick={() => setIsActionMenuOpen(true)}
      >
        +
      </button>

      {isActionMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[1050] flex flex-col justify-end"
          onClick={() => setIsActionMenuOpen(false)}
        >
          <div
            className="w-full max-w-lg mx-auto bg-zinc-900 rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mt-0 mb-4 text-center text-white">Crear Alimento</h3>
            <div className="flex flex-col gap-3">
              <button
                className="btn btn-secondary w-full text-left justify-start"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  ai.setIsAiModalOpen(true);
                }}
              >
                Crear con IA (Texto / Voz)
              </button>
              <button
                className="btn btn-secondary w-full text-left justify-start"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  scanner.setIsScannerOpen(true);
                }}
              >
                Escanear Código (Barras/QR)
              </button>
              <button
                className="btn btn-secondary w-full text-left justify-start"
                onClick={() => {
                  if (scanner.ocrFileRef.current) scanner.ocrFileRef.current.click();
                }}
              >
                <ScanLine className="w-5 h-5 mr-2" /> Escanear Etiqueta Nutricional
              </button>
              <button
                className="btn btn-secondary w-full text-left justify-start"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  forms.openNewFoodForm();
                }}
              >
                <Pencil className="w-5 h-5 mr-2" /> Crear Manualmente
              </button>
            </div>
            <button
              className="btn btn-secondary w-full mt-6 border-zinc-700"
              onClick={() => setIsActionMenuOpen(false)}
            >
              Cancelar
            </button>
          </div>
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
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
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
                    <span className="text-sm font-semibold text-[var(--color-protein)]">
                      {scanner.scannedProduct.protein}g
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400">Carbs</span>
                    <span className="text-sm font-semibold text-[var(--color-carbs)]">
                      {scanner.scannedProduct.carbs}g
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400">Grasa</span>
                    <span className="text-sm font-semibold text-[var(--color-fat)]">
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
                  onScanError={(err: string) => console.warn('Barcode scan:', err)}
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
