import { useState, lazy, Suspense } from 'react';
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

import { ChevronDown, ChevronRight, ScanLine, Pencil, X } from 'lucide-react';
import { PageFoodItem } from '../types/myfoods';
import { Recipe, FoodLog } from '../types/api';
const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'));

export default function MyFoodsPage() {
  const { recentFoods, savedFoods, recipes, isLoading, fetchData, deleteFoodsBulk, deleteRecipe } =
    useMyFoodsData();

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
                        food={f}
                        isSelected={f.id !== undefined && meals.selectedFoods.has(Number(f.id))}
                        onToggleSelect={meals.toggleFoodSelection}
                        onEdit={forms.handleEditFood}
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
        className="fixed z-50 bottom-[calc(75px+env(safe-area-inset-bottom))] right-5 w-14 h-14 rounded-full flex items-center justify-center text-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none shadow-lg"
        onClick={() => setIsActionMenuOpen(true)}
      >
        +
      </button>

      {isActionMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end"
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
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
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
