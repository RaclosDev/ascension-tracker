import { ChefComposer } from './ChefComposer';
import React from 'react';
import DOMPurify from 'dompurify';
import { ChefHat, User, Utensils, Check, Plus } from 'lucide-react';
import {
  useAiNutritionChef,
  ChatMessage,
  MealOption,
  SuggestedFood,
} from '../../hooks/utilities/useAiNutritionChef';

export default function AiNutritionChef() {
  const {
    summary,
    loadingSummary,
    chatMessages,
    userInput,
    setUserInput,
    sending,
    selectedImage,
    setSelectedImage,
    fileInputRef,
    applyingOptionKey,
    appliedOptionKeys,
    activeOptionIndices,
    setActiveOptionIndices,
    chatBottomRef,
    isListening,
    toggleListening,
    stopListening,
    handleImageChange,
    handleSendMessage,
    handleQuickPrompt,
    handleApplyOption,
  } = useAiNutritionChef();

  const remaining = summary?.remaining || { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line: string, idx: number) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: '0.4rem' }} />;

      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = formatted.replace(/^[-*]\s+/, '');
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.45rem',
              marginLeft: '0.6rem',
              marginBottom: '0.25rem',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: 'var(--accent-primary, #0085FF)', fontWeight: 700 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bulletText) }} />
          </div>
        );
      }

      return (
        <p
          key={idx}
          style={{ margin: '0 0 0.45rem 0', lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }}
        />
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '0.75rem 0.85rem',
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#D1D5DB',
            }}
          >
            Tus macros restantes de hoy
          </span>
          {loadingSummary && (
            <span className="text-[11px] text-gray-400">Actualizando diario...</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <div className="text-base sm:text-lg font-black text-white">{remaining.kcal}</div>
            <div className="text-[11px] text-gray-400 font-semibold">Kcal</div>
          </div>
          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <div className="text-base sm:text-lg font-black text-[var(--accent-primary-light,#339cff)]">
              {remaining.protein}g
            </div>
            <div className="text-[11px] text-gray-400 font-semibold">Prot</div>
          </div>
          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <div className="text-base sm:text-lg font-black text-gray-200">{remaining.carbs}g</div>
            <div className="text-[11px] text-gray-400 font-semibold">Carbs</div>
          </div>
          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <div className="text-base sm:text-lg font-black text-gray-300">{remaining.fat}g</div>
            <div className="text-[11px] text-gray-400 font-semibold">Grasa</div>
          </div>
        </div>
      </div>

      {chatMessages.length === 0 ? (
        <div
          className="text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '14px',
            padding: '1.25rem 1rem',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--accent-glow,#0085FF1A)] border border-[var(--accent-primary,#0085FF)]/30 flex items-center justify-center mx-auto mb-2 text-[var(--accent-primary,#0085FF)]">
            <ChefHat size={20} />
          </div>
          <div className="text-sm font-semibold text-white mb-1">Chef Nutricional</div>
          <p className="text-xs text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
            Pídeme que diseñe un plato o sugerencias adaptadas a tus macros restantes de hoy.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
            <button
              type="button"
              className="btn btn-secondary btn-sm min-h-11 rounded-xl text-xs py-1.5 px-3 text-gray-300 hover:text-white border border-white/10"
              onClick={() =>
                handleQuickPrompt(
                  'Diseña varias opciones de cena equilibradas para mis macros restantes.',
                )
              }
            >
              Diseñar cena para mis macros
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm min-h-11 rounded-xl text-xs py-1.5 px-3 text-gray-300 hover:text-white border border-white/10"
              onClick={() => handleQuickPrompt('Sugiéreme snacks o meriendas altas en proteína.')}
            >
              Snacks altos en proteína
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-history-scroll max-h-[500px] overflow-y-auto space-y-4 pr-1">
          {chatMessages.map((msg: ChatMessage) => {
            const isUser = msg.role === 'user';
            const hasOptions = Array.isArray(msg.mealOptions) && (msg.mealOptions?.length || 0) > 0;
            const currentOptionIndex = activeOptionIndices[msg.id] || 0;
            const activeOption = hasOptions
              ? (msg.mealOptions || [])[currentOptionIndex] || (msg.mealOptions || [])[0]
              : null;
            const activeOptionKey = activeOption
              ? `${msg.id}-${activeOption.id || currentOptionIndex}`
              : null;
            const isOptionApplied = activeOptionKey
              ? appliedOptionKeys.has(activeOptionKey)
              : false;

            return (
              <div key={msg.id} className={`chat-msg-row ${isUser ? 'user-row' : ''}`}>
                <div className="chat-avatar">
                  {isUser ? (
                    <User size={18} />
                  ) : (
                    <ChefHat size={18} color="var(--accent-primary, #0085FF)" />
                  )}
                </div>
                <div className={`chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
                  {renderMarkdown(msg.text)}

                  {hasOptions && (
                    <div style={{ marginTop: '1rem' }}>
                      {(msg.mealOptions?.length || 0) > 1 && (
                        <div className="options-tabs-bar">
                          {(msg.mealOptions || []).map((opt: MealOption, optIdx: number) => {
                            const optKey = `${msg.id}-${opt.id || optIdx}`;
                            const isApplied = appliedOptionKeys.has(optKey);
                            const isActive = currentOptionIndex === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                className={`opt-tab-btn ${isActive ? 'active' : ''}`}
                                onClick={() =>
                                  setActiveOptionIndices((prev) => ({
                                    ...prev,
                                    [msg.id]: optIdx,
                                  }))
                                }
                              >
                                <span>{opt.title || `Opción ${optIdx + 1}`}</span>
                                {isApplied && (
                                  <span
                                    style={{ color: 'var(--color-success)', fontSize: '0.75rem' }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {activeOption && (
                        <div className="suggested-meal-box">
                          <div>
                            <div className="meal-box-header">
                              <span>
                                <Utensils
                                  size={14}
                                  className="inline mr-1 text-[var(--accent-primary-light)]"
                                />
                                {activeOption.title ||
                                  `Propuesta (${activeOption.mealName || 'Cena'})`}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-secondary)',
                                  fontWeight: 500,
                                }}
                              >
                                {activeOption.suggestedFoods?.length || 0} alimentos
                              </span>
                            </div>
                            {activeOption.description && (
                              <div className="meal-box-desc">{activeOption.description}</div>
                            )}
                          </div>

                          {/* Foods breakdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {(activeOption.suggestedFoods || []).map(
                              (food: SuggestedFood, idx: number) => (
                                <div key={idx} className="meal-food-item">
                                  <div className="food-info-header">
                                    <span className="food-name">{food.product}</span>
                                    <span className="food-quantity-badge">
                                      {Math.round(food.quantity || 0)}g
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '0.5rem',
                                      fontSize: '0.75rem',
                                      color: 'var(--text-secondary)',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <span>
                                      <strong style={{ color: '#FFFFFF' }}>
                                        {Math.round(food.kcal || 0)}
                                      </strong>{' '}
                                      kcal
                                    </span>
                                    <span>•</span>
                                    <span>{food.protein?.toFixed(1)}g P</span>
                                    <span>•</span>
                                    <span>{food.carbs?.toFixed(1)}g C</span>
                                    <span>•</span>
                                    <span>{food.fat?.toFixed(1)}g G</span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>

                          {activeOption.totalMacros && (
                            <div
                              style={{
                                padding: '0.75rem',
                                background: 'var(--bg-glass-strong)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-subtle)',
                                marginTop: '0.75rem',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: '#FFFFFF',
                                  marginBottom: '0.4rem',
                                }}
                              >
                                Resumen de Opción
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                <span>
                                  <strong style={{ color: '#FFFFFF' }}>
                                    {activeOption.totalMacros.kcal}
                                  </strong>{' '}
                                  kcal
                                </span>
                                <span>•</span>
                                <span>
                                  <strong style={{ color: '#FFFFFF' }}>
                                    {activeOption.totalMacros.protein}g
                                  </strong>{' '}
                                  P
                                </span>
                                <span>•</span>
                                <span>
                                  <strong style={{ color: '#FFFFFF' }}>
                                    {activeOption.totalMacros.carbs}g
                                  </strong>{' '}
                                  C
                                </span>
                                <span>•</span>
                                <span>
                                  <strong style={{ color: '#FFFFFF' }}>
                                    {activeOption.totalMacros.fat}g
                                  </strong>{' '}
                                  G
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="add-option-btn-container">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={isOptionApplied || applyingOptionKey === activeOptionKey}
                              onClick={() =>
                                handleApplyOption(activeOption, activeOptionKey as string)
                              }
                              style={{
                                width: '100%',
                                marginTop: '1rem',
                                background: isOptionApplied
                                  ? 'var(--bg-glass-strong)'
                                  : 'var(--bg-primary)',
                                border: '1px solid var(--border-subtle)',
                                color: isOptionApplied
                                  ? 'var(--color-success)'
                                  : 'var(--text-primary)',
                                cursor: isOptionApplied ? 'default' : 'pointer',
                              }}
                            >
                              {isOptionApplied ? (
                                <>
                                  <Check size={14} className="inline mr-1" />
                                  Añadido a tu diario
                                </>
                              ) : applyingOptionKey === activeOptionKey ? (
                                <>Añadiendo...</>
                              ) : (
                                <>
                                  <Plus size={14} className="inline mr-1" />
                                  Añadir opción al diario
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Quick prompts while only the welcome message is shown */}
          {chatMessages.length === 1 && !sending && (
            <div className="flex flex-col gap-2 ml-8 mt-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm min-h-11 rounded-xl text-xs py-1.5 px-3 w-fit text-left text-gray-300 hover:text-white"
                onClick={() =>
                  handleQuickPrompt(
                    'Diseña varias opciones de cena equilibradas para mis macros restantes.',
                  )
                }
              >
                Diseñar cena para mis macros
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm min-h-11 rounded-xl text-xs py-1.5 px-3 w-fit text-left text-gray-300 hover:text-white"
                onClick={() => handleQuickPrompt('Sugiéreme snacks o meriendas altas en proteína.')}
              >
                Snacks altos en proteína
              </button>
            </div>
          )}

          {sending && (
            <div className="chat-msg-row">
              <div className="chat-avatar">
                <ChefHat size={18} color="var(--accent-primary, #0085FF)" />
              </div>
              <div className="chat-bubble ai-bubble flex items-center gap-2 text-gray-400 text-xs">
                <span className="spinner w-4 h-4 border-2" />
                <span>Analizando macros y generando opciones estratégicas...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>
      )}

      <ChefComposer
        isListening={isListening}
        stopListening={stopListening}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        handleSendMessage={handleSendMessage}
        fileInputRef={fileInputRef}
        handleImageChange={handleImageChange}
        toggleListening={toggleListening}
        userInput={userInput}
        setUserInput={setUserInput}
        sending={sending}
      />
    </div>
  );
}
