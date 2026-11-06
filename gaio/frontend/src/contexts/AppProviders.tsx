import { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { ToastContainer } from '../components/common/Toast';

export const AppProviders = ({ children }: PropsWithChildren) => (
  <ToastProvider>
    <AuthProvider>
      {children}
      <ToastContainer />
    </AuthProvider>
  </ToastProvider>
);
