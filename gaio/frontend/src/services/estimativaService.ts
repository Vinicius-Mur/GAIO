import { api } from './api';
import {
  EstimativaRequest,
  EstimativaResponse,
  EstimativaSalva,
  SaveEstimativaRequest
} from '../types';

export const estimativaService = {
  async calcular(payload: EstimativaRequest): Promise<EstimativaResponse> {
    const { data } = await api.post<EstimativaResponse>('/api/estimativas/calcular', payload);
    return data;
  },

  async salvar(payload: SaveEstimativaRequest): Promise<EstimativaSalva> {
    const { data } = await api.post<EstimativaSalva>('/api/estimativas', payload);
    return data;
  },

  async listar(): Promise<EstimativaSalva[]> {
    const { data } = await api.get<EstimativaSalva[]>('/api/estimativas');
    return data;
  },

  async buscarPorId(id: number): Promise<EstimativaSalva> {
    const { data } = await api.get<EstimativaSalva>(`/api/estimativas/${id}`);
    return data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/api/estimativas/${id}`);
  }
};
