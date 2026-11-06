import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Skeleton } from '../components/common/Skeleton';
import { PageHeader } from '../components/layout/PageHeader';
import { rotuloCategoria, rotuloTipo } from '../constants/imovel';
import { useAuth } from '../contexts/AuthContext';
import { useEstimativasSalvas } from '../hooks/useEstimativasSalvas';
import { formatCurrencyBRL } from '../utils/format';
import { localEstimateStorage } from '../utils/storage';

const novaEstimativa = (
  <Link to='/estimativas/nova'>
    <Button>Nova estimativa</Button>
  </Link>
);

const SalvasNaConta = () => {
  const { items, loading, error } = useEstimativasSalvas(true);

  if (loading) {
    return (
      <div className='grid gap-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className='h-20' />
        ))}
      </div>
    );
  }
  if (error) return <EmptyState title='Não foi possível carregar suas estimativas' description={error} />;
  if (items.length === 0) {
    return (
      <EmptyState
        title='Nenhuma estimativa salva'
        description='Calcule uma estimativa e clique em "Salvar" para guardá-la na sua conta.'
        action={<Link className='text-sm font-semibold text-brand-900 hover:underline' to='/estimativas/nova'>Começar agora</Link>}
      />
    );
  }

  return (
    <div className='grid gap-3'>
      {items.map((estimativa) => (
        <Card key={estimativa.id} className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='font-semibold text-brand-900'>{estimativa.bairroOuCep}</p>
            <p className='text-sm text-gray-500'>
              {rotuloCategoria(estimativa.categoria)} · {rotuloTipo(estimativa.tipo)} · {estimativa.areaM2} m² ·{' '}
              {new Date(estimativa.criadoEm).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-lg font-semibold text-brand-900'>{formatCurrencyBRL(estimativa.valorEstimado)}</p>
            <Link className='text-sm font-medium text-brand-900 hover:underline' to={`/estimativas/${estimativa.id}`}>Ver detalhes</Link>
          </div>
        </Card>
      ))}
    </div>
  );
};

const CalculadasNoNavegador = () => {
  const estimates = localEstimateStorage.list();

  return (
    <div className='space-y-3'>
      <div className='rounded-xl border border-surface-100 bg-white p-4 text-sm text-brand-900'>
        Estas estimativas ficam só neste navegador.{' '}
        <Link className='font-semibold hover:underline' to='/login' state={{ from: '/estimativas' }}>Entre na sua conta</Link>{' '}
        para salvar e acessar de qualquer lugar.
      </div>
      {estimates.length === 0 ? (
        <EmptyState
          title='Nenhuma estimativa calculada'
          description='Faça um novo cálculo para visualizar o histórico aqui.'
          action={<Link className='text-sm font-semibold text-brand-900 hover:underline' to='/estimativas/nova'>Começar agora</Link>}
        />
      ) : (
        <div className='grid gap-3'>
          {estimates.map((estimate) => (
            <Card key={estimate.id} className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <p className='font-semibold text-brand-900'>{estimate.bairroOuCep}</p>
                <p className='text-sm text-gray-500'>{new Date(estimate.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className='text-right'>
                <p className='text-lg font-semibold text-brand-900'>{formatCurrencyBRL(estimate.valorEstimado)}</p>
                <Link className='text-sm font-medium text-brand-900 hover:underline' to={`/estimativas/${estimate.id}`}>Ver detalhes</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export const EstimativasPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <PageHeader
        title='Minhas estimativas'
        subtitle={isAuthenticated ? 'Estimativas salvas na sua conta.' : 'Estimativas calculadas neste navegador.'}
        action={novaEstimativa}
      />
      {isAuthenticated ? <SalvasNaConta /> : <CalculadasNoNavegador />}
    </div>
  );
};
