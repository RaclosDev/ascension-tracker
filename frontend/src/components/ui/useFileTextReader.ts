import { useCallback, useLayoutEffect, useRef } from 'react';

export function useFileTextReader(open: boolean) {
  const activeReader = useRef<FileReader | null>(null);
  const cancel = useCallback(() => {
    const previous = activeReader.current;
    activeReader.current = null;
    if (previous?.readyState === 1) previous.abort();
  }, []);
  useLayoutEffect(() => cancel, [open, cancel]);

  const read = (file: File, onRead: (text: string) => void, onError: (error: Error) => void) => {
    cancel();
    const reader = new FileReader();
    activeReader.current = reader;
    reader.onload = () => {
      if (activeReader.current !== reader) return;
      activeReader.current = null;
      try {
        if (typeof reader.result !== 'string') throw new Error('No se pudo leer el archivo.');
        onRead(reader.result);
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Error al procesar el archivo.'));
      }
    };
    reader.onerror = () => {
      if (activeReader.current !== reader) return;
      activeReader.current = null;
      onError(new Error('Error al leer el archivo en el navegador.'));
    };
    reader.readAsText(file);
  };
  return { read, cancel };
}
