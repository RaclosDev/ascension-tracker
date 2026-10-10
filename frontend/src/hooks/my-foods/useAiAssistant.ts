import { useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { useSpeechToText } from '../useSpeechToText';

export function useAiAssistant(fetchData: () => void) {
  const [aiQuery, setAiQuery] = useState('');
  const { isListening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: setAiQuery,
    lang: 'es-ES',
  });
  const [pendingAiCount, setPendingAiCount] = useState(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    const queryText = aiQuery.trim();
    stopListening();
    setAiQuery('');
    setPendingAiCount((p) => p + 1);
    toast(`Buscando "${queryText}"...`, { duration: 2000 });
    try {
      await api.post('/nutrition/ai/food', { text: queryText });
      toast.success(`"${queryText}" añadido`);
      fetchData();
    } catch {
      toast.error('Error IA');
    } finally {
      setPendingAiCount((p) => Math.max(0, p - 1));
    }
  };

  return {
    aiQuery,
    setAiQuery,
    isListening,
    toggleListening,
    stopListening,
    pendingAiCount,
    isAiModalOpen,
    setIsAiModalOpen,
    handleAiSubmit,
  };
}
