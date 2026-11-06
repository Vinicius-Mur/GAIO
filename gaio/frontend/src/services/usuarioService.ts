import { api } from './api';
import { AlterarSenhaRequest, AtualizarPerfilRequest, AuthResponse, User } from '../types';

export const usuarioService = {
  async perfil(): Promise<User> {
    const { data } = await api.get<User>('/api/usuarios/me');
    return data;
  },

  // Devolve uma sessao nova: o token muda quando o e-mail muda.
  async atualizarPerfil(payload: AtualizarPerfilRequest): Promise<AuthResponse> {
    const { data } = await api.put<AuthResponse>('/api/usuarios/me', payload);
    return data;
  },

  async alterarSenha(payload: AlterarSenhaRequest): Promise<void> {
    await api.put('/api/usuarios/me/senha', payload);
  }
};
