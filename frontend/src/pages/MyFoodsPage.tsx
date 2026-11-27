import BottomSheet from '../components/BottomSheet';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { useState, useEffect, useRef, Suspense } from 'react';
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

import {
  Barcode,
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { Recipe, FoodLog, SavedFood } from '../types/api';
import { isFoodRegistered } from '../utils/nutritionHelpers';
import '../styles/athlete-workout.css';
import '../styles/my-foods.css';
const BarcodeScanner = lazyWithRetry(() => import('../components/BarcodeScanner'));

function SectionHead({
  title,
  count,
  note,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  note?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <h2 className="mf-section-head">
      <button type="button" aria-expanded={open} onClick={onToggle}>
        <span className="wk-title">{title}</span>
        <span className="wk-note tabular-nums">
          {count}
          {note && ` · ${note}`}
        </span>
        <ChevronDown size={16} aria-hidden="true" className="mf-chevron" />
      </button>
    </h2>
  );
}

export default function MyFoodsPage() {
  const {
    recentFoods,
    savedFoods,
    recipes,
    isLoading,
    fetchData,
    isError,
    isFetching,
    deleteFoodsBulk,
    deleteRecipe,
    deleteSavedFood,
  } = useMyFoodsData();

  const [searchFilter, setSearchFilter] = useState('all');
  const addButtonRef = useRef<HTMLButtonElement>(null);
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

  const emptyText = (fallback: string) =>
    filters.searchQuery ? 'Nada coincide con la búsqueda.' : fallback;

  if (isLoading)
    return (
      <div className="fade-in">
        <Skeleton className="h-10 w-full mb-3" />
      </div>
    );

  return (
    <div className="fade-in mf-page">
      {isError && <QueryErrorNotice retry={fetchData} pending={isFetching} />}
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

      <div className="mf-layout" data-filter={searchFilter}>
        {['all', 'foods'].includes(searchFilter) && (
          <section
            className="card wk-panel mf-section mf-foods"
            data-drop={scanner.dragOverTarget === 'foods' || undefined}
            onDragOver={(e) => scanner.handleDragOver(e, 'foods')}
            onDragLeave={scanner.handleDragLeave}
            onDrop={scanner.handleDropOnFoods}
          >
            <SectionHead
              title="Mis alimentos"
              count={filters.filteredFoods.length}
              note="valores por 100 g"
              open={expandedSections.foods}
              onToggle={() => toggleSection('foods')}
            />
            {expandedSections.foods && (
              <>
                <BulkSelectionToolbar
                  selectedCount={meals.selectedFoods.size}
                  onBulkDelete={async () => {
                    if (await deleteFoodsBulk(meals.selectedFoods)) meals.clearSelection();
                  }}
                  onClearSelection={meals.clearSelection}
                  onOpenMealSelector={meals.openMealSelector}
                />
                {filters.filteredFoods.length === 0 ? (
                  <p className="wk-empty">{emptyText('Aún no has guardado ningún alimento.')}</p>
                ) : (
                  <ul className="mf-list" data-view={filters.viewMode}>
                    {filters.filteredFoods.map((f: SavedFood) => (
                      <FoodCard
                        key={f.id}
                        food={f}
                        isSelected={f.id !== undefined && meals.selectedFoods.has(Number(f.id))}
                        onToggleSelect={meals.toggleFoodSelection}
                        onEdit={(food) => forms.handleEditFood(food)}
                        onDelete={deleteSavedFood}
                        onDragStart={(e, d) => scanner.handleDragStart(e, d)}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        )}

        {['all', 'recipes'].includes(searchFilter) && (
          <section
            className="card wk-panel mf-section mf-recipes"
            data-drop={scanner.dragOverTarget === 'recipes' || undefined}
            onDragOver={(e) => scanner.handleDragOver(e, 'recipes')}
            onDragLeave={scanner.handleDragLeave}
            onDrop={scanner.handleDropOnRecipes}
          >
            <SectionHead
              title="Mis recetas"
              count={filters.filteredRecipes.length}
              open={expandedSections.recipes}
              onToggle={() => toggleSection('recipes')}
            />
            {expandedSections.recipes &&
              (filters.filteredRecipes.length === 0 ? (
                <p className="wk-empty">{emptyText('Aún no has guardado ninguna receta.')}</p>
              ) : (
                <ul className="mf-list">
                  {filters.filteredRecipes.map((r: Recipe) => (
                    <RecipeCard key={r.id} recipe={r} onEdit={forms.handleEditRecipe} />
                  ))}
                </ul>
              ))}
          </section>
        )}

        {['all', 'recent'].includes(searchFilter) && (
          <section className="card wk-panel mf-section mf-recent">
            <SectionHead
              title="Recientes"
              count={filters.filteredRecent.length}
              open={expandedSections.recent}
              onToggle={() => toggleSection('recent')}
            />
            {expandedSections.recent &&
              (filters.filteredRecent.length === 0 ? (
                <p className="wk-empty">
                  {emptyText('Lo que registres en el diario aparecerá aquí.')}
                </p>
              ) : (
                <ul className="mf-list">
                  {filters.filteredRecent.map((f: FoodLog) => {
                    const registered = isFoodRegistered(f.product, savedFoods, recipes);
                    return (
                      <li key={f.id} className="mf-item">
                        <div className="mf-item-main">
                          <span className="mf-item-text">
                            <span className="mf-item-name">{f.product}</span>
                            <span className="mf-item-meta tabular-nums">
                              {Math.round(f.quantity)} g · {Math.round(f.kcal)} kcal
                            </span>
                          </span>
                        </div>
                        {registered ? (
                          <span className="mf-saved">
                            <Check size={14} aria-hidden="true" /> Guardado
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="wk-link"
                            aria-label={`Guardar ${f.product} en mis alimentos`}
                            onClick={() => scanner.saveRecentAsFood(f)}
                          >
                            Guardar
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ))}
          </section>
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
        saving={forms.saving}
        editingFoodId={forms.editingFoodId}
        handleDeleteFood={deleteSavedFood}
      />
      <RecipeFormModal
        isOpen={forms.isRecipeFormOpen}
        onToggle={() => forms.setIsRecipeFormOpen(!forms.isRecipeFormOpen)}
        recipeForm={forms.recipeForm}
        updateRecipeForm={forms.updateRecipeForm}
        handleAddRecipe={forms.handleAddRecipe}
        saving={forms.saving}
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
        ref={addButtonRef}
        type="button"
        aria-label="Crear alimento"
        className="mf-fab"
        onClick={() => setIsActionMenuOpen(true)}
      >
        <Plus size={26} aria-hidden="true" />
      </button>

      <BottomSheet
        isOpen={isActionMenuOpen}
        onClose={() => setIsActionMenuOpen(false)}
        title="Crear alimento"
      >
        <div className="mf-create">
          <button
            type="button"
            className="mf-create-option"
            onClick={() => {
              setIsActionMenuOpen(false);
              ai.setIsAiModalOpen(true);
            }}
          >
            <Sparkles size={20} aria-hidden="true" />
            <span>
              <strong>Describirlo</strong>
              <small>Escribe o dicta lo que has comido y la IA calcula los macros</small>
            </span>
          </button>
          <button
            type="button"
            className="mf-create-option"
            onClick={() => {
              setIsActionMenuOpen(false);
              scanner.setIsScannerOpen(true);
            }}
          >
            <Barcode size={20} aria-hidden="true" />
            <span>
              <strong>Escanear el código de barras</strong>
              <small>Busca el producto y rellena sus datos</small>
            </span>
          </button>
          <button
            type="button"
            className="mf-create-option"
            onClick={() => {
              if (scanner.ocrFileRef.current) scanner.ocrFileRef.current.click();
            }}
          >
            <ScanLine size={20} aria-hidden="true" />
            <span>
              <strong>Fotografiar la etiqueta</strong>
              <small>Lee la tabla nutricional del envase</small>
            </span>
          </button>
          <button
            type="button"
            className="mf-create-option"
            onClick={() => {
              setIsActionMenuOpen(false);
              forms.openNewFoodForm();
            }}
          >
            <Pencil size={20} aria-hidden="true" />
            <span>
              <strong>Rellenarlo a mano</strong>
              <small>Nombre, kcal y macros por 100 g</small>
            </span>
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary w-full mt-4"
          onClick={() => setIsActionMenuOpen(false)}
        >
          Cancelar
        </button>
      </BottomSheet>

      <Dialog open={scanner.isScannerOpen} onOpenChange={scanner.setIsScannerOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            addButtonRef.current?.focus();
          }}
        >
          <DialogTitle>Escanear</DialogTitle>
          {scanner.lookupError && (
            <div className="mf-scan-error" role="alert">
              {scanner.lookupError}
            </div>
          )}

          {scanner.isLookingUpCode ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
              <p className="mf-scan-wait">Buscando el producto…</p>
            </div>
          ) : scanner.scannedProduct ? (
            <div className="mf-scan">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="mf-scan-name">{scanner.scannedProduct.name}</h4>
                  {scanner.scannedProduct.brand && (
                    <p className="mf-scan-brand">{scanner.scannedProduct.brand}</p>
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

              <dl className="wk-stats mf-scan-facts" data-cols="4">
                <div>
                  <dt>Kcal</dt>
                  <dd className="tabular-nums">{scanner.scannedProduct.kcal}</dd>
                </div>
                <div>
                  <dt>Proteína</dt>
                  <dd className="tabular-nums">{scanner.scannedProduct.protein} g</dd>
                </div>
                <div>
                  <dt>Hidratos</dt>
                  <dd className="tabular-nums">{scanner.scannedProduct.carbs} g</dd>
                </div>
                <div>
                  <dt>Grasa</dt>
                  <dd className="tabular-nums">{scanner.scannedProduct.fat} g</dd>
                </div>
              </dl>

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
        </DialogContent>
      </Dialog>

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
