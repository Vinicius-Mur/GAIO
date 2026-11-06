import { api } from './api';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
    return data;
  },
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/registrar', payload);
    return data;
  }
};
