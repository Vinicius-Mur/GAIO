import { Link, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-surface-50 print:bg-white'>
        <header className='print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 bg-white px-6 py-4'>
          <div>
            <p className='font-serifBrand text-3xl font-bold text-brand-900'>GAIÒ</p>
            <p className='text-sm text-gray-500'>Estimativa inteligente de imóveis</p>
          </div>
          <nav className='flex items-center gap-2'>
            <Link className='focus-ring rounded-lg px-3 py-2 text-sm font-medium text-brand-900 hover:bg-surface-100' to='/login'>Entrar</Link>
            <Link className='focus-ring rounded-lg bg-brand-900 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800' to='/cadastro'>Criar conta</Link>
          </nav>
        </header>
        <main className='mx-auto max-w-5xl p-4 md:p-8'>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-surface-50 print:bg-white'>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className='md:pl-72 print:pl-0'>
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className='mx-auto max-w-7xl p-4 md:p-8 print:max-w-none print:p-0'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
