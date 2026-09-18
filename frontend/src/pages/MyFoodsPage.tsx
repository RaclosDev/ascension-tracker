import { LayoutGrid, List, Utensils, ChefHat, Clock, Search, Plus, Trash2, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';
import BarcodeScanner from '../components/BarcodeScanner';
import { getSanitizedKcal, extractPortions } from '../utils/portionHelper';
import { useSpeechToText } from '../hooks/useSpeechToText';

import AiFoodModal from '../components/my-foods/AiFoodModal';
import FoodFormModal from '../components/my-foods/FoodFormModal';
import RecipeFormModal from '../components/my-foods/RecipeFormModal';
import MealSelectorModal from '../components/my-foods/MealSelectorModal';
import FoodCard from '../components/my-foods/FoodCard';
import RecipeCard from '../components/my-foods/RecipeCard';



const getLocalISODate = () =><Trash2 className="w-4 h-4 mr-1 inline-block" /> Borrar</button>
                      <button onClick={() => setSelectedFoods(new Set())} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.5rem' }}></button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                  {filteredFoods.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                      {q || macroFilter !== 'all' ? `No hay alimentos que coincidan con los filtros` : 'No tienes alimentos guardados'}
                    </p>
                  )}
                  
                  {viewMode === 'grid' ? (
                    /* GRID VIEW */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                      {filteredFoods.map((f: any) => (
                        <FoodCard 
                          key={f.id} 
                          food={f} 
                          isSelected={selectedFoods.has(f.id)} 
                          onToggleSelect={toggleFoodSelection} 
                          onEdit={handleEditFood} 
                          viewMode='grid' 
                          onDragStart={handleDragStart} 
                        />
                      ))}
                    </div>
                  ) : (
                    /* LIST VIEW */
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        <div style={{ width: '30px' }}></div>
                        <div style={{ flex: 2, minWidth: '120px' }}>Nombre</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Kcal</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Pro</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Car</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Gra</div>
                        <div style={{ width: '30px' }}></div>
                      </div>
                      {filteredFoods.map((f: any) => (
                        <FoodCard 
                          key={f.id} 
                          food={f} 
                          isSelected={selectedFoods.has(f.id)} 
                          onToggleSelect={toggleFoodSelection} 
                          onEdit={handleEditFood} 
                          viewMode='list' 
                          onDragStart={handleDragStart} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT SIDEBAR: RECIENTES & RECETAS */}
        {['all', 'recent', 'recipes'].includes(searchFilter) && (
          <div className={`flex flex-col gap-5 ${searchFilter === 'all' ? 'w-full lg:w-1/3' : 'w-full'}`}>
            {/* RECIENTES */}
        {['all', 'recent'].includes(searchFilter) && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div onClick={(e) => toggleSection('recent', e)} style={{ cursor: 'pointer', padding: '0.5rem 0.8rem', background: 'var(--bg-glass)', borderRadius: '10px', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <ChefHat className="w-4 h-4 inline-block mr-2" /> Mis Recetas
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="show-on-mobile" style={{ display: 'none' }}>{(expandedSections.recipes || q) ? '▼' : '▶'}</span>
                </span>
              </h2>
            </div>

            <div style={{ display: (expandedSections.recipes || q) ? 'flex' : 'none', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>

            <RecipeFormModal 
              isOpen={isRecipeFormOpen} 
              onToggle={() => { if (isRecipeFormOpen && editingRecipeId) { setEditingRecipeId(null); setRecipeForm({ name:'', description:'', protein:'', carbs:'', fat:'', kcal:'' }); } setIsRecipeFormOpen(!isRecipeFormOpen); }} 
              recipeForm={recipeForm as any} 
              updateRecipeForm={updateRecipeForm} 
              handleAddRecipe={handleAddRecipe} 
              editingRecipeId={editingRecipeId} 
              onCancelEdit={() => { setEditingRecipeId(null); setRecipeForm({ name:'', description:'', protein:'', carbs:'', fat:'', kcal:'' }); setIsRecipeFormOpen(false); }} 
              handleDeleteRecipe={handleDeleteRecipe} 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              {filteredRecipes.map((r: any) => (
                <RecipeCard key={r.id} recipe={r} onEdit={handleEditRecipe} />
              ))}
              {filteredRecipes.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: q ? 'center' : 'left', padding: q ? '1rem 0' : '0' }}>
                  {q ? `No hay recetas que coincidan con "${searchQuery}"` : 'Arrastra desde Recientes o añade manualmente'}
                </p>
              )}
            </div>
            </div>
          </div>
        )}
          </div>
        )}
      </div>

      {/* FOOD FORM MODAL */}
      <FoodFormModal 
        isOpen={isFoodFormOpen} 
        onClose={() => { setIsFoodFormOpen(false); setEditingFoodId(null); }} 
        foodForm={foodForm as any} 
        updateFoodForm={updateFoodForm} 
        handleAddSavedFood={handleAddSavedFood} 
        editingFoodId={editingFoodId} 
      />

      {/* SCANNER MODAL */}

      {isScannerOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info className="w-5 h-5" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Escanear Código / QR</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Escanea el código de un envase para guardarlo en Mis Alimentos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsScannerOpen(false); setScannedProduct(null); setLookupError(null); }}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}
              >
                
              </button>
            </div>

            {/* Modal Body */}
            {isLookingUpCode ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Consultando producto...</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Buscando en Open Food Facts</span>
              </div>
            ) : scannedProduct ? (
              /* Product Found Preview */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'center'
                }}>
                  {scannedProduct.imageUrl && (
                    <img
                      src={scannedProduct.imageUrl}
                      alt={scannedProduct.name}
                      style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', background: 'white', padding: '2px', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {scannedProduct.name}
                    </div>
                    {scannedProduct.brand && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Marca: <strong style={{ color: 'var(--text-primary)' }}>{scannedProduct.brand}</strong>
                      </div>
                    )}
                    <div>{macroLine(scannedProduct.kcal, scannedProduct.protein, scannedProduct.carbs, scannedProduct.fat)}</div>
                    {scannedProduct.servingSize && (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                        Ración detectada: {scannedProduct.servingSize}g {scannedProduct.servingLabel ? `(${scannedProduct.servingLabel})` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveScannedProduct}
                    style={{ padding: '0.6rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <span></span> Guardar en Mis Alimentos
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleEditScannedProduct}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}
                    >
                      ️ Editar antes de guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setScannedProduct(null); setLookupError(null); }}
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}
                    >
                       Escanear otro
                    </button>
                  </div>
                </div>
              </div>
            ) : lookupError ? (
              /* Product Not Found */
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.2rem' }}></span>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-fat)', fontWeight: 600 }}>Producto no encontrado</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lookupError}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setLookupError(null); setScannedProduct(null); }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                     Reintentar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsScannerOpen(false);
                      setLookupError(null);
                      setIsFoodFormOpen(true);
                    }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    ＋ Crear manual
                  </button>
                </div>
              </div>
            ) : (
              /* Scanner Active */
              <div>
                <BarcodeScanner onScanSuccess={handleScanBarcode} onScanError={(err: any) => console.error(err)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEAL SELECTOR MODAL */}
      <MealSelectorModal 
        isOpen={isMealSelectorOpen} 
        onClose={() => setIsMealSelectorOpen(false)} 
        selectedFoods={selectedFoods} 
        savedFoods={savedFoods} 
        bulkQuantities={bulkQuantities} 
        setBulkQuantities={setBulkQuantities} 
        mealSelectorDate={mealSelectorDate} 
        setMealSelectorDate={setMealSelectorDate} 
        isAddingToMeal={isAddingToMeal} 
        handleBulkAddToMeal={handleBulkAddToMeal} 
      />
      {/* CUSTOM FAB FOR CREATION ACTIONS */}
      <button
        className="btn btn-primary shadow-glow"
        onClick={() => setIsActionMenuOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(75px + env(safe-area-inset-bottom))',
          right: '20px',
          zIndex: 90,
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' // Blueish shadow
        }}
        title="Crear o Añadir Alimento"
      >
        ＋
      </button>

      {/* ACTION MENU MODAL */}
      {isActionMenuOpen && (
        <div className="modal-backdrop" onClick={() => setIsActionMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div className="card slide-up-anim" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '0 auto', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '1.5rem', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.1rem' }}> Crear Alimento</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setIsActionMenuOpen(false); setIsAiModalOpen(true); }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                 Crear con IA (Texto / Voz)
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => { setIsActionMenuOpen(false); setIsScannerOpen(true); setScannedProduct(null); setLookupError(null); }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                 Escanear Código (Barras/QR)
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => { 
                  if (ocrFileRef.current) ocrFileRef.current.click();
                }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                ️ Escanear Etiqueta Nutricional
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => { 
                  setIsActionMenuOpen(false); 
                  setEditingFoodId(null); 
                  setFoodForm({ name:'', brand:'', protein:'', carbs:'', fat:'', kcal:'', servingSize:'', servingLabel:'' }); 
                  setIsFoodFormOpen(true); 
                }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                ️ Crear Manualmente
              </button>
            </div>

            <button className="btn btn-secondary" onClick={() => setIsActionMenuOpen(false)} style={{ width: '100%', marginTop: '1.5rem', background: 'transparent', border: '1px solid var(--border-subtle)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* AI CREATION MODAL */}
      <AiFoodModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        aiQuery={aiQuery} 
        setAiQuery={setAiQuery} 
        isListening={isListening} 
        toggleListening={toggleListening} 
        stopListening={stopListening} 
        handleAiSubmit={handleAiSubmit} 
        pendingAiCount={pendingAiCount} 
      />

      {/* Hidden File Input for OCR */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={ocrFileRef} 
        style={{ display: 'none' }} 
        onChange={handleOcrUpload} 
      />
    </div>
  );
}

