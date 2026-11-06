import { ApiError } from '../types';

export const getErrorMessage = (error: unknown, fallback = 'Não foi possível concluir a operação.'): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as ApiError).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};
