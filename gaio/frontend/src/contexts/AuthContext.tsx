import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { AuthResponse, AuthStatus, LoginRequest, RegisterRequest, User } from '../types';
import { authService } from '../services/authService';
import { authStorage } from '../utils/storage';
import { setUnauthorizedHandler } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextValue {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  registrar: (payload: RegisterRequest) => Promise<void>;
  logout: (showMessage?: boolean) => void;
  atualizarSessao: (data: AuthResponse) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseAuth = (data: AuthResponse) => ({
  token: data.token,
  user: data.usuario
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [status, setStatus] = useState<AuthStatus>('carregando');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { showToast } = useToast();

  const applyAuth = useCallback((data: AuthResponse) => {
    authStorage.save(data);
    const parsed = parseAuth(data);
    setToken(parsed.token);
    setUser(parsed.user);
    setStatus('autenticado');
  }, []);

  const logout = useCallback((showMessage = false) => {
    authStorage.clear();
    setToken(null);
    setUser(null);
    setStatus('nao_autenticado');
    if (showMessage) {
      showToast({ type: 'info', title: 'Sessão encerrada', description: 'Faça login para continuar.' });
    }
  }, [showToast]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    applyAuth(response);
  }, [applyAuth]);

  const registrar = useCallback(async (payload: RegisterRequest) => {
    const response = await authService.register(payload);
    applyAuth(response);
  }, [applyAuth]);

  useEffect(() => {
    const auth = authStorage.get();
    if (auth?.token) {
      const parsed = parseAuth(auth);
      setToken(parsed.token);
      setUser(parsed.user);
      setStatus('autenticado');
    } else {
      setStatus('nao_autenticado');
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      showToast({
        type: 'error',
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Faça login novamente.'
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, showToast]);

  const value = useMemo(
    () => ({
      status,
      token,
      user,
      isAuthenticated: status === 'autenticado' && Boolean(token),
      login,
      registrar,
      logout,
      atualizarSessao: applyAuth
    }),
    [status, token, user, login, registrar, logout, applyAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
