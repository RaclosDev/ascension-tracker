import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { getLocalDateString } from '../../utils/dateHelper';
import { useSpeechToText } from '../useSpeechToText';

export interface SuggestedFood {
  foodId?: string;
  foodName?: string;
  product?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealOption {
  id?: string;
  mealIndex?: number;
  title?: string;
  mealName?: string;
  description?: string;
  summaryText?: string;
  estimatedKcal?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalMacros?: {
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  tags?: string[];
  suggestedFoods?: SuggestedFood[];
}

export interface ChatMessage {
  id: string;
  role: string;
  text: string;
  mealOptions?: MealOption[];
}

export interface NutritionSummary {
  remaining?: {
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export function useAiNutritionChef() {
  const todayStr = getLocalDateString();
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [applyingOptionKey, setApplyingOptionKey] = useState<string | null>(null);
  const [appliedOptionKeys, setAppliedOptionKeys] = useState<Set<string>>(new Set());
  const [activeOptionIndices, setActiveOptionIndices] = useState<Record<string, number>>({});
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Speech-to-text
  const { isListening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: (text) => setUserInput(text),
    lang: 'es-ES',
  });

  // Fetch Assistant Summary (Remaining Macros)
  const fetchSummary = useCallback(
    async (date?: string | React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
      setLoadingSummary(true);
      try {
        const queryDate = typeof date === 'string' ? date : todayStr;
        const res = await api.get(`/nutrition/ai/assistant-summary?date=${queryDate}`);
        setSummary(res.data);
      } catch (err: unknown) {
        console.error(
          'Error fetching assistant summary:',
          err instanceof Error ? err.message : String(err),
        );
      } finally {
        setLoadingSummary(false);
      }
    },
    [todayStr],
  );

  useEffect(() => {
    fetchSummary(todayStr);
  }, [todayStr, fetchSummary]);

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
          text: `Hola. Para hoy te quedan aprox. **${kcalText}** (${macroDetails}).\n¿Qué te apetece comer? Puedo diseñarte una cena rápida, usar lo que tengas en la nevera o darte ideas saludables.`,
          mealOptions: [],
        },
      ]);
    }
  }, [summary, chatMessages.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages, sending]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (customPrompt?: string | React.MouseEvent | React.FormEvent) => {
    const promptToSend = (typeof customPrompt === 'string' ? customPrompt : userInput).trim();
    if (!promptToSend && !selectedImage) return;

    stopListening();
    setUserInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: promptToSend,
      mealOptions: [],
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const payload: Record<string, unknown> = {
        message: promptToSend,
        date: todayStr,
        chatHistory: history,
      };

      if (selectedImage) {
        const cleanBase64 = selectedImage.includes(',')
          ? selectedImage.split(',')[1]
          : selectedImage;
        payload.base64Image = cleanBase64;
      }

      const res = await api.post('/nutrition/ai/assistant-chat', payload);
      const data = res.data;

      const options =
        Array.isArray(data.mealOptions) && data.mealOptions.length > 0
          ? data.mealOptions
          : data.suggestedFoods && data.suggestedFoods.length > 0
            ? [
                {
                  id: 'opt-1',
                  title: 'Opción Recomendada',
                  description: 'Diseñada para cuadrar tus macros.',
                  mealIndex: data.mealIndex,
                  mealName: data.mealName,
                  suggestedFoods: data.suggestedFoods,
                  totalMacros: data.totalMacros,
                },
              ]
            : [];

      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        text: data.reply || 'Aquí tienes las opciones calculadas para tus macros restantes:',
        mealOptions: options,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      setActiveOptionIndices((prev) => ({ ...prev, [aiMsgId]: 0 }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      console.error(
        'AI Assistant Error:',
        e?.response?.data?.error || (err instanceof Error ? err.message : String(err)),
      );
      const errorMsg = 'Error conectando con el Asistente IA';
      toast.error(errorMsg);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `Ocurrió un error: ${errorMsg}. Por favor, inténtalo de nuevo.`,
          mealOptions: [],
        },
      ]);
    } finally {
      setSending(false);
      setSelectedImage(null);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleApplyOption = async (option: MealOption, optionKey: string) => {
    if (!option || !option.suggestedFoods || option.suggestedFoods.length === 0) return;
    if (appliedOptionKeys.has(optionKey)) return;

    setApplyingOptionKey(optionKey);

    try {
      await api.post('/nutrition/ai/assistant-apply', {
        date: todayStr,
        mealIndex: option.mealIndex,
        foods: option.suggestedFoods,
      });

      toast.success(`${option.title || 'Opción'} añadida a tu diario de hoy.`);
      setAppliedOptionKeys((prev) => new Set([...prev, optionKey]));
      fetchSummary(todayStr);
    } catch (err: unknown) {
      toast.error('Error al añadir la comida al diario');
      console.error(
        'Error al añadir la comida al diario:',
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setApplyingOptionKey(null);
    }
  };

  return {
    todayStr,
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
    fetchSummary,
  };
}
