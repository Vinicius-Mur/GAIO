import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/common/Loading';

export const ProtectedRoute = () => {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'carregando') {
    return <Loading text='Verificando sessão...' />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
