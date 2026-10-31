import { useState, useRef, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

type Options = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  selectedMealIndex: number;
  selectedMealKey?: string;
  date?: string;
  stopListening: () => void;
  onLogAdded?: () => void;
  onClose?: () => void;
};

export function useFoodAiEntry({
  query,
  setQuery,
  selectedMealIndex,
  selectedMealKey,
  date,
  stopListening,
  onLogAdded,
  onClose,
}: Options) {
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const submitting = useRef(false);
  const [aiElapsedSeconds, setAiElapsedSeconds] = useState(0);
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAiStatusText = (seconds: number) => {
    if (seconds < 3) return 'Interpretando alimentos y raciones...';
    if (seconds < 8) return 'Calculando macronutrientes con IA...';
    if (seconds < 15) return 'Estructurando desglose nutricional...';
    return 'Finalizando registro de comidas...';
  };

  const submitAiPrompt = async () => {
    if (submitting.current) return;
    if (!query.trim() && !selectedImage)
      return toast.error('Escribe algo o adjunta una foto primero');
    submitting.current = true;
    stopListening();
    const queryText = query.trim();
    setAiSubmitting(true);
    setAiElapsedSeconds(0);
    const startTime = Date.now();
    const loadingToast = toast.loading('Procesando con IA...');
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setAiElapsedSeconds(elapsed);
      if (elapsed >= 3) {
        toast.loading(`Procesando con IA (${elapsed}s)...`, { id: loadingToast });
      }
    }, 1000);

    const payload: Record<string, unknown> = {
      text: queryText,
      mealIndex: selectedMealIndex,
      mealKey: selectedMealKey,
      date,
    };
    if (selectedImage) {
      const rawImage = typeof selectedImage === 'string' ? selectedImage : '';
      const cleanBase64 = rawImage.includes(',') ? rawImage.split(',')[1] : rawImage;
      payload.base64Image = cleanBase64;
    }

    try {
      const res = await api.post('/nutrition/ai/log', payload, { timeout: 45000 });
      const count = Array.isArray(res.data) ? res.data.length : 1;
      toast.dismiss(loadingToast);
      if (selectedMealIndex === -1) {
        toast.success(`¡${count} alimento(s) repartidos en tus comidas por IA!`);
      } else {
        toast.success(`¡${count} alimento(s) añadidos por IA!`);
      }
      setQuery('');
      setSelectedImage(null);
      if (onLogAdded) onLogAdded();
      if (onClose) onClose();
    } catch (e: unknown) {
      toast.dismiss(loadingToast);
      const axiosError = e as {
        code?: string;
        message?: string;
        response?: { data?: { error?: string; message?: string } };
      };
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        (axiosError.code === 'ECONNABORTED' || axiosError.message?.toLowerCase().includes('timeout')
          ? 'La IA tardó más de lo esperado en responder. Intenta de nuevo o divide los alimentos.'
          : 'Error procesando texto con IA');
      toast.error(msg);
      console.error('Error procesando texto con IA:', e instanceof Error ? e.message : String(e));
      // El texto y la imagen se conservan para que el usuario no pierda su entrada
    } finally {
      submitting.current = false;
      clearInterval(timer);
      setAiSubmitting(false);
      setAiElapsedSeconds(0);
    }
  };

  return {
    selectedImage,
    setSelectedImage,
    fileInputRef,
    handleImageChange,
    aiSubmitting,
    aiElapsedSeconds,
    getAiStatusText,
    submitAiPrompt,
  };
}
