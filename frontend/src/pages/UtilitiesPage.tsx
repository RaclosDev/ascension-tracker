import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { getLocalDateString, addDaysToDateString, formatFriendlyDate, isTodayLocal } from '../utils/dateHelper';

export default function UtilitiesPage() {
  // --- AI ASSISTANT STATE ---
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<any>(todayStr);
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const fileInputRef = useRef<any>(null);
  const [applyingOptionKey, setApplyingOptionKey] = useState<any>(null);
  const [appliedOptionKeys, setAppliedOptionKeys] = useState<any>(new Set());
  const [activeOptionIndices, setActiveOptionIndices] = useState<any>({});

  const chatBottomRef = useRef(null);

  // Speech-to-text hook
  const { isListening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: (text) => setUserInput(text),
    lang: 'es-ES'
  });

  // Fetch Assistant Summary (Remaining Macros)
  const fetchSummary = useCallback(async (date) => {
    setLoadingSummary(true);
    try {
      const res = await api.get(`/nutrition/ai/assistant-summary?date=${date}`);
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching assistant summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [selectedDate, fetchSummary]);

  // Initial welcome message once summary is loaded
  useEffect(() => {
    if (summary && chatMessages.length === 0) {
      const rem = summary.remaining || {};
      const kcalText = rem.kcal !== undefined ? `${rem.kcal} kcal` : 'tus calorías';
      const pText = rem.protein !== undefined ? `${rem.protein}g proteína` : '';
      const cText = rem.carbs !== undefined ? `${rem.carbs}g hidratos` : '';
      const fText = rem.fat !== undefined ? `${rem.fat}g grasas` : '';
      const macroDetails = [pText, cText, fText].filter(Boolean).join(', ');

      setChatMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: `Hola. Para hoy te quedan aprox. **${kcalText}** (${macroDetails}).\n¿Qué te apetece comer? Puedo diseñarte una cena rápida, usar lo que tengas en la nevera o darte ideas sueltas.`,
          mealOptions: []
        }
      ]);
    }
  }, [summary, chatMessages.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, sending]);

  // Send message to AI
  const handleSendMessage = async (customPrompt?: any) => {
    const promptToSend = (customPrompt || userInput).trim();
    if (!promptToSend && !selectedImage) return;

    stopListening();
    setUserInput('');

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: promptToSend,
      mealOptions: []
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      // Build brief history context
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text
      }));

      const payload: any = {
        message: promptToSend,
        date: selectedDate,
        chatHistory: history
      };

      if (selectedImage) {
        payload.base64Image = selectedImage;
      }

      const res = await api.post('/nutrition/ai/assistant-chat', payload);

      const data = res.data;
      const options = Array.isArray(data.mealOptions) && data.mealOptions.length > 0
        ? data.mealOptions
        : (data.suggestedFoods && data.suggestedFoods.length > 0
            ? [{
                id: 'opt-1',
                title: 'Opción Recomendada',
                description: 'Diseñada para cuadrar tus macros.',
                mealIndex: data.mealIndex,
                mealName: data.mealName,
                suggestedFoods: data.suggestedFoods,
                totalMacros: data.totalMacros
              }]
            : []);

      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        text: data.reply || 'Aquí tienes las opciones calculadas para tus macros restantes:',
        mealOptions: options
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      // Default to option 0
      setActiveOptionIndices((prev) => ({ ...prev, [aiMsgId]: 0 }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error conectando con el Asistente IA';
      toast.error(errorMsg);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: ` Lo siento, ocurrió un error: ${errorMsg}. Por favor prueba de nuevo.`,
          mealOptions: []
        }
      ]);
    } finally {
      setSending(false);
      setSelectedImage(null);
    }
  };

  // Quick Prompt click
  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  // Apply selected option to daily diary
  const handleApplyOption = async (msgId, option, optionKey) => {
    if (!option || !option.suggestedFoods || option.suggestedFoods.length === 0) return;
    if (appliedOptionKeys.has(optionKey)) return;

    setApplyingOptionKey(optionKey);

    try {
      await api.post('/nutrition/ai/assistant-apply', {
        date: selectedDate,
        mealIndex: option.mealIndex,
        foods: option.suggestedFoods
      });

      toast.success(`¡${option.title || 'Opción'} añadida a tu diario de hoy! `);

      setAppliedOptionKeys((prev) => new Set([...prev, optionKey]));
      // Refresh remaining macros
      fetchSummary(selectedDate);
    } catch (err) {
      toast.error('Error al añadir la comida al diario');
      console.error(err);
    } finally {
      setApplyingOptionKey(null);
    }
  };

  // Helper to format clean markdown (bold, bullet points)
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: '0.4rem' }} />;

      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = formatted.replace(/^[-*]\s+/, '');
        return (
          <div
            key={idx}
            style={{ display: 'flex', gap: '0.45rem', marginLeft: '0.6rem', marginBottom: '0.25rem', alignItems: 'flex-start' }}
          >
            <span style={{ color: 'var(--accent-primary, #e11d48)', fontWeight: 700 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: bulletText }} />
          </div>
        );
      }

      return (
        <p
          key={idx}
          style={{ margin: '0 0 0.45rem 0', lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  // --- CALCULATORS STATE ---
  const [weight1, setWeight1] = useState('');
  const [steps, setSteps] = useState('');

  const [weight2, setWeight2] = useState('');
  const [height, setHeight] = useState('1.73');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const [openSections, setOpenSections] = useState({
    calc1: false,
    calc2: false
  });

  const toggleSection = (key, e) => {
    if (!openSections[key] && e?.currentTarget) {
      const el = e.currentTarget;
      setTimeout(() => {
        const offset = 140;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }, 50);
    }
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data } = await api.get('/weights/dashboard');
      if (data && data.currentWeight) {
        setWeight1(data.currentWeight.toString());
        setWeight2(data.currentWeight.toString());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Calculations 1
  let calc1Result = 0;
  if (weight1 && steps) {
    const w = parseFloat(weight1);
    const s = parseInt(steps, 10);
    if (!isNaN(w) && !isNaN(s) && w > 0 && s > 0) {
      const energyJ = 2.74 * w * (s / 2);
      calc1Result = energyJ / 4184;
    }
  }

  // Calculations 2
  let calc2Result = 0;
  let vo2Result = 0;
  if (weight2 && height && distance && (minutes || seconds)) {
    const w = parseFloat(weight2);
    const h = parseFloat(height);
    const d = parseFloat(distance);
    const m = parseInt(minutes || '0', 10);
    const s = parseInt(seconds || '0', 10);

    const totalSeconds = m * 60 + s;

    if (!isNaN(w) && !isNaN(h) && !isNaN(d) && totalSeconds > 0 && w > 0 && h > 0 && d > 0) {
      const v = d / totalSeconds;
      const v2 = v * v;
      const vo2 = 7.35 + (5.97 * v2) / h;
      vo2Result = vo2;

      const o2PerMin = (vo2 * w) / 1000;
      const kcalPerMin = o2PerMin * 5;
      calc2Result = kcalPerMin * (totalSeconds / 60);
    }
  }

  const remaining = summary?.remaining || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const target = summary?.target || { kcal: 2000, protein: 150, carbs: 200, fat: 60 };
  const consumed = summary?.consumed || { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem' }}>

      {/* --- AI NUTRITION STRATEGIST & MULTI-OPTION CHEF --- */}
      <div className="ai-assistant-container" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                flexShrink: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  <path d="M5 3v4"/>
                  <path d="M19 17v4"/>
                  <path d="M3 5h4"/>
                  <path d="M17 19h4"/>
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Estratega IA
              </h2>
            </div>
          </div>

        </div>

        {/* REMAINING MACROS BAR (THEME-AWARE & CENTERED) */}
        <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}> Macros Restantes para hoy</span>
              {loadingSummary && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Actualizando...</span>}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span> <strong style={{ color: 'var(--text-primary)' }}>{remaining.kcal}</strong> kcal</span>
              <span>🥩 <strong style={{ color: 'var(--text-primary)' }}>{remaining.protein}</strong>g P</span>
              <span>🍞 <strong style={{ color: 'var(--text-primary)' }}>{remaining.carbs}</strong>g C</span>
              <span> <strong style={{ color: 'var(--text-primary)' }}>{remaining.fat}</strong>g G</span>
            </div>
          </div>
        </div>



        {/* CHAT MESSAGES SCROLL */}
        <div className="chat-history-scroll">
          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasOptions = Array.isArray(msg.mealOptions) && msg.mealOptions.length > 0;
            const currentOptionIndex = activeOptionIndices[msg.id] || 0;
            const activeOption = hasOptions ? msg.mealOptions[currentOptionIndex] || msg.mealOptions[0] : null;
            const activeOptionKey = activeOption ? `${msg.id}-${activeOption.id || currentOptionIndex}` : null;
            const isOptionApplied = activeOptionKey ? appliedOptionKeys.has(activeOptionKey) : false;

            return (
              <div key={msg.id} className={`chat-msg-row ${isUser ? 'user-row' : ''}`}>
                <div className="chat-avatar">
                  {isUser ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                  )}
                </div>
                <div className={`chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
                  {renderMarkdown(msg.text)}

                  {/* MULTI-OPTIONS DISPLAY */}
                  {hasOptions && (
                    <div style={{ marginTop: '1rem' }}>
                      {/* Segmented Option Selector Bar */}
                      {msg.mealOptions.length > 1 && (
                        <div className="options-tabs-bar">
                          {msg.mealOptions.map((opt, optIdx) => {
                            const optKey = `${msg.id}-${opt.id || optIdx}`;
                            const isApplied = appliedOptionKeys.has(optKey);
                            const isActive = currentOptionIndex === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                className={`opt-tab-btn ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveOptionIndices((prev) => ({ ...prev, [msg.id]: optIdx }))}
                              >
                                <span>{opt.title || `Opción ${optIdx + 1}`}</span>
                                {isApplied && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem' }}>✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Active Option Card */}
                      {activeOption && (
                        <div className="suggested-meal-box">
                          <div>
                            <div className="meal-box-header">
                              <span>🍽️ {activeOption.title || `Propuesta (${activeOption.mealName || 'Cena'})`}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {activeOption.suggestedFoods?.length || 0} alimentos
                              </span>
                            </div>
                            {activeOption.description && (
                              <div className="meal-box-desc">{activeOption.description}</div>
                            )}
                          </div>

                          {/* Foods breakdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {activeOption.suggestedFoods?.map((food, idx) => (
                              <div key={idx} className="meal-food-item">
                                <div className="food-info-header">
                                  <span className="food-name">{food.product}</span>
                                  <span className="food-quantity-badge">{Math.round(food.quantity)}g</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                  <span><strong style={{ color: 'var(--text-primary)' }}>{Math.round(food.kcal)}</strong> kcal</span>
                                  <span>·</span>
                                  <span>{food.protein?.toFixed(1)}g P</span>
                                  <span>·</span>
                                  <span>{food.carbs?.toFixed(1)}g C</span>
                                  <span>·</span>
                                  <span>{food.fat?.toFixed(1)}g G</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Total of the meal - Centered macro summary card */}
                          {activeOption.totalMacros && (
                            <div style={{ padding: '0.75rem', background: 'var(--bg-glass-strong)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '0.75rem' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                                 Resumen de Opción
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span><strong style={{ color: 'var(--text-primary)' }}>{activeOption.totalMacros.kcal}</strong> kcal</span>
                                <span>·</span>
                                <span><strong style={{ color: 'var(--text-primary)' }}>{activeOption.totalMacros.protein}g</strong> P</span>
                                <span>·</span>
                                <span><strong style={{ color: 'var(--text-primary)' }}>{activeOption.totalMacros.carbs}g</strong> C</span>
                                <span>·</span>
                                <span><strong style={{ color: 'var(--text-primary)' }}>{activeOption.totalMacros.fat}g</strong> G</span>
                              </div>
                            </div>
                          )}

                          {/* One-click Add to Diary Button for this Option */}
                          <div className="add-option-btn-container">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={isOptionApplied || applyingOptionKey === activeOptionKey}
                              onClick={() => handleApplyOption(msg.id, activeOption, activeOptionKey)}
                              style={{
                                width: '100%',
                                marginTop: '1rem',
                                background: isOptionApplied
                                  ? 'var(--bg-glass-strong)'
                                  : 'var(--bg-primary)',
                                border: '1px solid var(--border-subtle)',
                                color: isOptionApplied ? 'var(--color-success)' : 'var(--text-primary)',
                                cursor: isOptionApplied ? 'default' : 'pointer'
                              }}
                            >
                              {isOptionApplied ? (
                                <>✓ Añadido a tu diario</>
                              ) : applyingOptionKey === activeOptionKey ? (
                                <>Añadiendo...</>
                              ) : (
                                <> Añadir opción al diario</>
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

          {chatMessages.length === 1 && !sending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '34px', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '12px', fontSize: '0.75rem', padding: '0.4rem 0.75rem', textAlign: 'left', width: 'fit-content' }}
                onClick={() => handleQuickPrompt('Diseña varias opciones de cena equilibradas para mis macros.')}
              >
                🍽️ Diseñar cena para mis macros
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '12px', fontSize: '0.75rem', padding: '0.4rem 0.75rem', textAlign: 'left', width: 'fit-content' }}
                onClick={() => handleQuickPrompt('Sugiéreme snacks o meriendas altas en proteína.')}
              >
                 Snacks altos en proteína
              </button>
            </div>
          )}

          {sending && (
            <div className="chat-msg-row">
              <div className="chat-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <div className="chat-bubble ai-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                <span>Analizando macros y generando opciones estratégicas...</span>
              </div>
            </div>
          )}

          
        </div>

        {/* INPUT & VOICE BAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isListening && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.45rem 0.8rem',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="recording-dot" />
                <span><strong>Escuchando...</strong> Habla a tu ritmo con pausas. Pulsa ⏹️ cuando termines.</span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Listo
              </button>
            </div>
          )}

          {/* IMAGE PREVIEW */}
          {selectedImage && (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.5rem', alignSelf: 'flex-start' }}>
              <img src={selectedImage} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--border-subtle)', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute', top: '-5px', right: '-5px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)',
                  borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', zIndex: 10
                }}
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageChange} 
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                flexShrink: 0
              }}
              title="Adjuntar foto de comida"
            >
              
            </button>
            <button
              type="button"
              className={`btn btn-secondary ${isListening ? 'recording-pulse-btn' : ''}`}
              onClick={() => toggleListening(userInput)}
              style={{
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isListening ? 'rgba(239,68,68,0.2)' : 'var(--bg-primary)',
                color: isListening ? '#ef4444' : 'var(--text-primary)',
                border: isListening ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                flexShrink: 0
              }}
              title={isListening ? 'Detener dictado' : 'Dictar por voz'}
            >
              {isListening ? '⏹️' : ''}
            </button>

            <input
              type="text"
              className="form-input"
              style={{ flex: 1, height: '42px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              placeholder="Ej: Tengo huevos, atún y verduras en la nevera, ¿qué opciones me recomiendas?"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={sending}
            />

            <button
              type="submit"
              disabled={(!userInput.trim() && !selectedImage) || sending}
              style={{
                height: '42px',
                width: '42px',
                borderRadius: '50%',
                flexShrink: 0,
                background: (!userInput.trim() && !selectedImage || sending) ? 'var(--bg-secondary)' : 'var(--color-primary)',
                color: (!userInput.trim() && !selectedImage || sending) ? 'var(--text-secondary)' : '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!userInput.trim() || sending) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              title="Enviar"
            >
              {sending ? <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </form>
          </div>
          <div ref={chatBottomRef} />
        </div>

      {/* --- EXISTING PERFORMANCE CALCULATORS --- */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
          Calculadoras de Rendimiento Físico
        </h3>

        <div className="utilities-grid">
          {/* Calculator 1 */}
          <div className="card accordion-card" style={{ padding: openSections.calc1 ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease' }}>
            <div
              className="accordion-header"
              onClick={(e) => toggleSection('calc1', e)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>🔬 Gasto por Pasos</span>
              <span style={{ transform: openSections.calc1 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ▼
              </span>
            </div>

            {openSections.calc1 && (
              <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                  Estima la energía mecánica usada en cada impacto según la biomecánica de Weyand.
                </p>

                <div className="form-group">
                  <label className="form-label">Peso Corporal (kg)</label>
                  <input
                    type="number" inputMode="decimal"
                    className="form-input"
                    value={weight1}
                    onChange={(e) => setWeight1(e.target.value)}
                    placeholder="Ej: 80.5"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pasos Totales</label>
                  <input
                    type="number" inputMode="decimal"
                    className="form-input"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="Ej: 10000"
                  />
                </div>

                <div className="kpi-card accent" style={{ marginTop: '1.5rem' }}>
                  <div className="kpi-label"> Calorías Quemadas</div>
                  <div className="kpi-value accent">
                    {calc1Result > 0 ? calc1Result.toFixed(2) : '0.00'} <span style={{ fontSize: '1.25rem' }}>kcal</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calculator 2 */}
          <div className="card accordion-card" style={{ padding: openSections.calc2 ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease' }}>
            <div
              className="accordion-header"
              onClick={(e) => toggleSection('calc2', e)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>🫀 Gasto Metabólico por Tiempo</span>
              <span style={{ transform: openSections.calc2 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ▼
              </span>
            </div>

            {openSections.calc2 && (
              <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                  Calcula el VO₂ y gasto calórico avanzado de una sesión de carrera/caminata considerando tu biometría.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Peso (kg)</label>
                    <input
                      type="number" inputMode="decimal"
                      className="form-input"
                      value={weight2}
                      onChange={(e) => setWeight2(e.target.value)}
                      placeholder="Ej: 80.5"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Altura (m)</label>
                    <input
                      type="number" inputMode="decimal"
                      className="form-input"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Ej: 1.73"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Distancia (metros)</label>
                  <input
                    type="number" inputMode="decimal"
                    className="form-input"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="Ej: 400"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tiempo (min)</label>
                    <input
                      type="number" inputMode="decimal"
                      className="form-input"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tiempo (seg)</label>
                    <input
                      type="number" inputMode="decimal"
                      className="form-input"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="kpi-card success" style={{ marginTop: '1.5rem' }}>
                  <div className="kpi-label"> Gasto Metabólico Total</div>
                  <div className="kpi-value success">
                    {calc2Result > 0 ? calc2Result.toFixed(2) : '0.00'} <span style={{ fontSize: '1.25rem' }}>kcal</span>
                  </div>
                  {vo2Result > 0 && (
                    <div className="kpi-detail">VO₂ Consumido: {vo2Result.toFixed(2)} ml/kg/min</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



    </div>
  );
}




