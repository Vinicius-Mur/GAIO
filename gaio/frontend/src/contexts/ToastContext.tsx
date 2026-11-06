import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { ToastMessage } from '../types';

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);

  const value = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return context;
};
