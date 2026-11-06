import { useCallback, useEffect, useState } from 'react';
import { estimativaService } from '../services/estimativaService';
import { EstimativaSalva } from '../types';
import { getErrorMessage } from '../utils/error';

// Estimativas salvas na conta (backend). So busca quando ha usuario logado.
export const useEstimativasSalvas = (enabled: boolean) => {
  const [items, setItems] = useState<EstimativaSalva[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimativas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await estimativaService.listar());
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchEstimativas();
  }, [enabled, fetchEstimativas]);

  return {
    items: enabled ? items : [],
    loading: enabled && loading,
    error: enabled ? error : null,
    fetchEstimativas
  };
};
