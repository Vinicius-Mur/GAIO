import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { PageHeader } from '../components/layout/PageHeader';
import { rotuloCategoria, rotuloTipo, rotulosAmenidadesMarcadas } from '../constants/imovel';
import { useAuth } from '../contexts/AuthContext';
import { anuncioService } from '../services/anuncioService';
import { estimativaService } from '../services/estimativaService';
import { useToast } from '../contexts/ToastContext';
import { EstimativaSalva } from '../types';
import { getErrorMessage } from '../utils/error';
import { formatCurrencyBRL, formatDateTime, formatPercent } from '../utils/format';
import { imprimirComoPdf } from '../utils/exportacao';
import { localEstimateStorage } from '../utils/storage';

const voltar = <Link to='/estimativas'><Button variant='secondary'>Voltar</Button></Link>;

const DetalheSalvo = ({ id }: { id: number }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [estimativa, setEstimativa] = useState<EstimativaSalva | null>(null);
  const [anuncioId, setAnuncioId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    Promise.all([estimativaService.buscarPorId(id), anuncioService.list()])
      .then(([dados, anuncios]) => {
        setEstimativa(dados);
        setAnuncioId(anuncios.find((a) => a.estimativaId === id)?.id ?? null);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  const handleExcluir = async () => {
    setExcluindo(true);
    try {
      await estimativaService.excluir(id);
      showToast({ type: 'success', title: 'Estimativa excluída', description: `A estimativa #${id} foi apagada.` });
      navigate('/estimativas');
    } catch (err) {
      showToast({ type: 'error', title: 'Não foi possível excluir', description: getErrorMessage(err) });
      setExcluindo(false);
      setConfirmarExclusao(false);
    }
  };

  if (error) return <EmptyState title='Estimativa não encontrada' description={error} action={voltar} />;
  if (!estimativa) return <Skeleton className='h-64' />;

  const comodidades = rotulosAmenidadesMarcadas(estimativa.amenidades);
  const linhas: [string, string][] = [
    ['Localização', estimativa.bairroOuCep],
    ['Imóvel', `${rotuloCategoria(estimativa.categoria)} · ${rotuloTipo(estimativa.tipo)}`],
    ['Área', `${estimativa.areaM2} m²`],
    ['Condomínio', estimativa.condominio > 0 ? formatCurrencyBRL(estimativa.condominio) : 'Não tem'],
    ['Quartos', String(estimativa.quartos)],
    ['Banheiros', String(estimativa.banheiros)],
    ['Vagas', String(estimativa.vagasGaragem)],
    ['Comodidades', comodidades.length ? comodidades.join(', ') : 'Nenhuma']
  ];

  return (
    <Card className='space-y-5'>
      <div>
        <p className='text-xs uppercase tracking-wide2 text-gray-500'>Valor estimado</p>
        <p className='text-3xl font-semibold text-brand-900'>{formatCurrencyBRL(estimativa.valorEstimado)}</p>
        {estimativa.faixaMinima !== null && estimativa.faixaMaxima !== null ? (
          <p className='mt-1 text-sm text-gray-600'>
            Faixa provável: {formatCurrencyBRL(estimativa.faixaMinima)} — {formatCurrencyBRL(estimativa.faixaMaxima)}
            {estimativa.confianca !== null ? ` · Confiança ${formatPercent(estimativa.confianca)}` : ''}
          </p>
        ) : null}
        <p className='mt-1 text-sm text-gray-500'>Salva em {formatDateTime(estimativa.criadoEm)}</p>
      </div>
      <dl className='grid grid-cols-2 gap-2 text-sm md:max-w-xl'>
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className='contents'>
            <dt className='text-gray-500'>{rotulo}</dt>
            <dd className='text-brand-900'>{valor}</dd>
          </div>
        ))}
      </dl>
      {estimativa.insightsMercado.length ? (
        <div>
          <h3 className='text-sm font-semibold uppercase tracking-wide2 text-brand-800'>Leitura do mercado</h3>
          <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700'>
            {estimativa.insightsMercado.map((insight) => <li key={insight}>{insight}</li>)}
          </ul>
          <p className='mt-1 text-xs text-gray-500'>Gerada no momento do cálculo, com os dados de mercado daquele dia.</p>
        </div>
      ) : null}
      <div className='flex flex-wrap gap-3 print:hidden'>
        {anuncioId !== null ? (
          <Link to={`/anuncios/${anuncioId}`}>
            <Button>Ver anúncio</Button>
          </Link>
        ) : (
          <Link to='/anuncios/novo' state={{ estimativaId: estimativa.id, bairro: estimativa.bairroOuCep }}>
            <Button>Criar anúncio</Button>
          </Link>
        )}
        <Button variant='ghost' onClick={() => setConfirmarExclusao(true)} disabled={anuncioId !== null}>
          Excluir
        </Button>
        <Button variant='secondary' onClick={imprimirComoPdf}>Exportar PDF</Button>
        {voltar}
      </div>
      {anuncioId !== null ? (
        <p className='text-xs text-gray-500 print:hidden'>Esta estimativa tem um anúncio. Para excluí-la, exclua o anúncio antes.</p>
      ) : null}
      <Modal
        open={confirmarExclusao}
        title='Excluir estimativa?'
        description='A estimativa será apagada de vez da sua conta.'
        confirmLabel='Excluir'
        loading={excluindo}
        onConfirm={() => void handleExcluir()}
        onClose={() => setConfirmarExclusao(false)}
      />
    </Card>
  );
};

const DetalheLocal = ({ id }: { id: string }) => {
  const estimate = localEstimateStorage.list().find((item) => item.id === id);
  if (!estimate) {
    return <EmptyState title='Estimativa não encontrada' description='Essa estimativa pode ter sido removida do navegador.' action={voltar} />;
  }
  return (
    <Card>
      <p className='text-xs uppercase tracking-wide2 text-gray-500'>Localização</p>
      <p className='text-lg font-semibold text-brand-900'>{estimate.bairroOuCep}</p>
      <p className='mt-4 text-xs uppercase tracking-wide2 text-gray-500'>Valor estimado</p>
      <p className='text-3xl font-semibold text-brand-900'>{formatCurrencyBRL(estimate.valorEstimado)}</p>
      <p className='mt-2 text-sm text-gray-500'>Calculado em {new Date(estimate.createdAt).toLocaleString('pt-BR')}</p>
      <div className='mt-5'>
        <Link to='/estimativas/nova'>
          <Button>Novo cálculo</Button>
        </Link>
      </div>
    </Card>
  );
};

export const EstimativaDetalhePage = () => {
  const { id = '' } = useParams();
  const { isAuthenticated } = useAuth();
  // Estimativas salvas na conta tem id numerico; as calculadas no navegador usam UUID.
  const idSalvo = /^\d+$/.test(id) ? Number(id) : null;

  return (
    <div>
      <PageHeader title='Detalhes da estimativa' />
      {idSalvo !== null && isAuthenticated ? <DetalheSalvo id={idSalvo} /> : <DetalheLocal id={id} />}
    </div>
  );
};
