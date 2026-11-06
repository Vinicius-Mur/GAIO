import { Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className='print:hidden sticky top-0 z-20 flex h-16 items-center justify-between border-b border-surface-100 bg-white px-4 md:px-6'>
      <button className='focus-ring rounded-lg p-2 md:hidden' onClick={onToggleSidebar} aria-label='Abrir menu'>
        <Menu size={20} />
      </button>
      <div className='hidden items-baseline gap-2 md:flex'>
        <p className='font-serifBrand text-3xl font-bold tracking-wide text-brand-900'>GAIÒ</p>
        <span className='text-sm text-gray-500'>Estimativa inteligente de imóveis</span>
      </div>
      <div className='flex items-center gap-3'>
        {isAuthenticated ? (
          <>
            <Link to='/perfil' className='focus-ring rounded-lg px-1 text-sm text-brand-900 hover:underline'>Olá, {user?.nome ?? 'usuário'}!</Link>
            <button className='focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-brand-900 hover:bg-surface-100' onClick={() => logout(true)}>
              <LogOut size={16} />
              Sair
            </button>
          </>
        ) : (
          <Link className='focus-ring rounded-lg px-3 py-2 text-sm font-medium text-brand-900 hover:bg-surface-100' to='/login'>Entrar</Link>
        )}
      </div>
    </header>
  );
};
