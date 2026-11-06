import { useCallback, useEffect, useMemo, useState } from 'react';
import { anuncioService } from '../services/anuncioService';
import { Anuncio, AnuncioFilters } from '../types';
import { getErrorMessage } from '../utils/error';

export const useAnuncios = (initialFilters?: AnuncioFilters) => {
  const [filters, setFilters] = useState<AnuncioFilters>(initialFilters ?? {});
  const [items, setItems] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnuncios = useCallback(async (nextFilters?: AnuncioFilters) => {
    setLoading(true);
    setError(null);
    const appliedFilters = nextFilters ?? filters;
    try {
      const data = await anuncioService.list(appliedFilters);
      setItems(data);
      if (nextFilters) setFilters(nextFilters);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnuncios(filters);
  }, []);

  const summary = useMemo(() => {
    const total = items.length;
    const rascunho = items.filter((item) => item.status !== 'COMPLETO').length;
    const completo = items.filter((item) => item.status === 'COMPLETO').length;
    const publicados = items.filter((item) => Boolean(item.publicado)).length;
    return { total, rascunho, completo, publicados };
  }, [items]);

  return {
    filters,
    items,
    loading,
    error,
    summary,
    setFilters,
    fetchAnuncios,
    setItems
  };
};
