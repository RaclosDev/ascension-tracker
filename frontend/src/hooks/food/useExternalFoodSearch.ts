import { useRef, useEffect, type FormEvent, type Dispatch, type SetStateAction } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  normalizeText as normalizeString,
  getSmartFallbackQueries,
} from '../../utils/searchHelper';

export function useExternalFoodSearch(
  query: string,
  setOffResults: Dispatch<SetStateAction<Array<Record<string, unknown>>>>,
) {
  const searchRequestId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      searchRequestId.current++;
      controllerRef.current?.abort();
    },
    [],
  );
  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    searchRequestId.current += 1;
    const currentRequestId = searchRequestId.current;

    const queriesToTry = getSmartFallbackQueries(q);
    let allCleanProducts: Array<Record<string, unknown>> = [];

    let successfulResponses = 0;
    let lastError: unknown;
    try {
      for (const currentQ of queriesToTry) {
        if (currentRequestId !== searchRequestId.current) return;
        let data: Record<string, unknown>;
        try {
          const res = await api.get<Record<string, unknown>>(
            `/food-external/search?q=${encodeURIComponent(currentQ)}`,
            { signal: controller.signal },
          );
          data = res.data;
          successfulResponses++;
        } catch (error) {
          if (controller.signal.aborted) return;
          lastError = error;
          continue;
        }
        if (currentRequestId !== searchRequestId.current) return;

        let products: Array<Record<string, unknown>> = [];
        if (data.product) products = [data.product as Record<string, unknown>];
        else if (data.products) products = data.products as Array<Record<string, unknown>>;

        const qWords = normalizeString(currentQ).split(/\s+/).filter(Boolean);
        const cleanProducts = products
          .filter((p) => {
            const name = normalizeString((p.product_name || p.product_name_es || '') as string);
            if (!name) return false;
            return qWords.some((w: string) => name.includes(normalizeString(w)));
          })
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const nameA = normalizeString((a.product_name || a.product_name_es || '') as string);
            const nameB = normalizeString((b.product_name || b.product_name_es || '') as string);
            return nameA.length - nameB.length;
          });

        if (cleanProducts.length > 0) {
          allCleanProducts = cleanProducts;
          break;
        }
      }

      if (currentRequestId !== searchRequestId.current) return;

      if (!successfulResponses) throw lastError ?? new Error('Food search unavailable');
      setOffResults(allCleanProducts);

      if (allCleanProducts.length === 0) {
        toast('No se encontraron resultados exactos', { icon: 'ℹ️' });
      }
    } catch (err) {
      if (currentRequestId !== searchRequestId.current) return;
      console.error(
        'Error al consultar base de datos de alimentos:',
        err instanceof Error ? err.message : String(err),
      );
      toast.error('Error al consultar base de datos');
    }
  };

  return handleSearch;
}
