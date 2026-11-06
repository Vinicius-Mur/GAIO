import { api } from './api';
import { MercadoBairro, MercadoResumo } from '../types';

export const mercadoService = {
  async resumo(): Promise<MercadoResumo> {
    const { data } = await api.get<MercadoResumo>('/api/mercado/resumo');
    return data;
  },

  async bairro(nome: string): Promise<MercadoBairro> {
    const { data } = await api.get<MercadoBairro>('/api/mercado/bairro', { params: { nome } });
    return data;
  }
};
