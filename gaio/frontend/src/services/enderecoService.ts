import { api } from './api';
import { EnderecoDetalhes, EnderecoSuggestion } from '../types';

const toSuggestion = (item: unknown): EnderecoSuggestion | null => {
  if (!item || typeof item !== 'object') return null;
  const candidate = item as Record<string, unknown>;
  const placeId = String(candidate.placeId ?? candidate.place_id ?? candidate.id ?? '');
  const descricao = String(candidate.descricao ?? candidate.description ?? candidate.endereco ?? '');
  if (!placeId || !descricao) return null;
  return { placeId, descricao };
};

export const enderecoService = {
  async autocomplete(input: string): Promise<EnderecoSuggestion[]> {
    const { data } = await api.get<unknown>('/api/enderecos/autocomplete', { params: { input } });
    if (Array.isArray(data)) {
      return data.map(toSuggestion).filter((item): item is EnderecoSuggestion => Boolean(item));
    }
    return [];
  },

  async detalhes(placeId: string): Promise<EnderecoDetalhes> {
    const { data } = await api.get<EnderecoDetalhes>('/api/enderecos/detalhes', { params: { placeId } });
    return data;
  },

  async reverso(lat: number, lon: number): Promise<EnderecoDetalhes> {
    const { data } = await api.get<EnderecoDetalhes>('/api/enderecos/reverso', { params: { lat, lon } });
    return data;
  }
};
