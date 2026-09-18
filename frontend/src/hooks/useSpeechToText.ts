import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Robust Speech-to-Text hook using Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * Solves common browser issues:
 * - Premature cutoff on silence (uses continuous=true + seamless auto-restart on silence timeouts)
 * - Freezing / InvalidStateError when starting or stopping
 * - Text duplication across restarts
 * - Clean teardown on unmount / modal close
 */
interface SpeechToTextOptions {
  onTranscript?: (text: string) => void;
  lang?: string;
}

export function useSpeechToText({ onTranscript, lang = 'es-ES' }: SpeechToTextOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const baseTextRef = useRef('');
  const latestTranscriptRef = useRef('');
  const retryCountRef = useRef(0);
  const isStartingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    isStartingRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      recognitionRef.current = null;
    }
  }, []);

  const startSession = useCallback((currentText = '') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (isStartingRef.current) return;
    isStartingRef.current = true;

    // Clean up any stale recognition instance first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    baseTextRef.current = currentText ? currentText.trim() : '';
    latestTranscriptRef.current = baseTextRef.current;
    shouldListenRef.current = true;
    retryCountRef.current = 0;

    const createAndStart = () => {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isStartingRef.current = false;
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let sessionSpeech = '';
          for (let i = 0; i < event.results.length; i++) {
            sessionSpeech += event.results[i][0].transcript;
          }
          sessionSpeech = sessionSpeech.trim();

          const combined = baseTextRef.current
            ? `${baseTextRef.current} ${sessionSpeech}`
            : sessionSpeech;

          latestTranscriptRef.current = combined;

          if (onTranscript) {
            onTranscript(combined);
          }
        };

        recognition.onerror = (event) => {
          // 'no-speech' happens when user pauses while thinking; do not stop or show error
          if (event.error === 'no-speech') {
            return;
          }

          if (event.error === 'aborted') {
            return;
          }

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast.error('Permiso de micrófono no concedido en el navegador');
            shouldListenRef.current = false;
            setIsListening(false);
            isStartingRef.current = false;
            return;
          }

          if (event.error === 'audio-capture') {
            toast.error('No se detecta micrófono disponible');
            shouldListenRef.current = false;
            setIsListening(false);
            isStartingRef.current = false;
            return;
          }

          if (event.error === 'network') {
            toast.error('Error de red al transcribir voz');
            shouldListenRef.current = false;
            setIsListening(false);
            isStartingRef.current = false;
            return;
          }

          console.warn('SpeechRecognition warning:', event.error);
        };

        recognition.onend = () => {
          isStartingRef.current = false;

          // If the user did not click stop, the browser stopped due to silence timeout
          // We seamlessly restart so the user can continue talking without losing anything
          if (shouldListenRef.current) {
            baseTextRef.current = latestTranscriptRef.current ? latestTranscriptRef.current.trim() : '';

            if (retryCountRef.current < 8) {
              retryCountRef.current += 1;
              setTimeout(() => {
                if (shouldListenRef.current) {
                  createAndStart();
                }
              }, 150);
              return;
            }
          }

          setIsListening(false);
          shouldListenRef.current = false;
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('SpeechRecognition start error:', err);
        isStartingRef.current = false;
        setIsListening(false);
        shouldListenRef.current = false;
      }
    };

    createAndStart();
  }, [lang, onTranscript]);

  const toggleListening = useCallback((currentText = '') => {
    if (isListening || shouldListenRef.current) {
      stopListening();
    } else {
      startSession(currentText);
    }
  }, [isListening, startSession, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      isStartingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening: startSession,
    stopListening,
    toggleListening
  };
}
