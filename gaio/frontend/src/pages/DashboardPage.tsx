import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, Printer } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import { CarteiraSection } from '../components/dashboard/CarteiraSection';
import { MercadoSection } from '../components/dashboard/MercadoSection';
import { ModeloSection } from '../components/dashboard/ModeloSection';
import { NOME_ZONA } from '../constants/graficos';
import { rotuloCategoria, rotuloTipo, rotulosAmenidadesMarcadas } from '../constants/imovel';
import { useAuth } from '../contexts/AuthContext';
import { useAnuncios } from '../hooks/useAnuncios';
import { useEstimativasSalvas } from '../hooks/useEstimativasSalvas';
import { mercadoService } from '../services/mercadoService';
import { Anuncio, EstimativaSalva, MercadoResumo } from '../types';
import { preferenciasDoUsuario } from '../utils/analise';
import { getErrorMessage } from '../utils/error';
import { baixarCsv, dataDoArquivo, imprimirComoPdf } from '../utils/exportacao';
import { formatDateTime } from '../utils/format';

const exportarEstimativas = (estimativas: EstimativaSalva[]) =>
  baixarCsv(
    `gaio-estimativas-${dataDoArquivo()}.csv`,
    ['ID', 'Criada em', 'Bairro', 'Zona', 'Categoria', 'Tipo', 'Área (m²)', 'Quartos', 'Banheiros', 'Vagas', 'Condomínio (R$)',
      'Amenidades', 'Valor estimado (R$)', 'Faixa mínima (R$)', 'Faixa máxima (R$)', 'm² estimado (R$)', 'Confiança',
      'Referência (local)', 'm² mediano da referência (R$)', 'm² 25% (R$)', 'm² 75% (R$)', 'Anúncios na referência', 'Insights'],
    estimativas.map((e) => [
      e.id, formatDateTime(e.criadoEm), e.bairroOuCep, e.zona ? NOME_ZONA[e.zona] : '', rotuloCategoria(e.categoria), rotuloTipo(e.tipo),
      e.areaM2, e.quartos, e.banheiros, e.vagasGaragem, e.condominio, rotulosAmenidadesMarcadas(e.amenidades).join(', '),
      e.valorEstimado, e.faixaMinima, e.faixaMaxima, Math.round(e.valorEstimado / e.areaM2), e.confianca,
      e.referenciaMercado?.local, e.referenciaMercado ? Math.round(e.referenciaMercado.precoM2Mediano) : null,
      e.referenciaMercado ? Math.round(e.referenciaMercado.precoM2P25) : null, e.referenciaMercado ? Math.round(e.referenciaMercado.precoM2P75) : null,
      e.referenciaMercado?.anuncios, e.insightsMercado.join(' | ')
    ])
  );

const exportarAnuncios = (anuncios: Anuncio[]) =>
  baixarCsv(
    `gaio-anuncios-${dataDoArquivo()}.csv`,
    ['ID', 'Estimativa', 'Criado em', 'Atualizado em', 'Título', 'Bairro', 'Endereço', 'Status', 'Publicado',
      'Valor estimado (R$)', 'Faixa mínima (R$)', 'Faixa máxima (R$)', 'Confiança'],
    anuncios.map((a) => [
      a.id, a.estimativaId, formatDateTime(a.criadoEm), formatDateTime(a.atualizadoEm), a.titulo, a.bairro, a.enderecoCompleto,
      a.status === 'COMPLETO' ? 'Completo' : 'Rascunho', a.publicado ? 'Sim' : 'Não', a.valorEstimado, a.faixaMinima, a.faixaMaxima, a.confianca
    ])
  );

const botaoExportar = 'focus-ring inline-flex items-center gap-2 rounded-xl border border-brand-900 px-3 py-2 text-sm font-semibold text-brand-900 hover:bg-surface-100 disabled:border-gray-300 disabled:text-gray-400';

export const DashboardPage = () => {
  const { user } = useAuth();
  const anuncios = useAnuncios();
  const estimativas = useEstimativasSalvas(true);

  const [geradoEm] = useState(() => new Date().toISOString());
  const [resumo, setResumo] = useState<MercadoResumo | null>(null);
  const [erroResumo, setErroResumo] = useState<string | null>(null);
  useEffect(() => {
    mercadoService.resumo().then(setResumo).catch((err) => setErroResumo(getErrorMessage(err, 'Os dados de mercado estão indisponíveis no momento.')));
  }, []);

  const carregandoCarteira = anuncios.loading || estimativas.loading;
  const preferencias = preferenciasDoUsuario(estimativas.items);
  const erroCarteira = anuncios.error ?? estimativas.error;

  return (
    <div className='space-y-8'>
      <PageHeader title={`Bem-vindo, ${user?.nome ?? 'usuário'}!`} subtitle='Sua carteira, o mercado de São Paulo e a qualidade do modelo em um só lugar.' />

      <Card className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
        <div className='flex flex-wrap gap-2'>
          <Link to='/estimativas/nova' className='focus-ring rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white'>Nova estimativa</Link>
          <Link to='/mapa' className='focus-ring rounded-xl border border-brand-900 px-4 py-2 text-sm font-semibold text-brand-900'>Explorar o mapa do mercado</Link>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button type='button' className={botaoExportar} disabled={!estimativas.items.length} onClick={() => exportarEstimativas(estimativas.items)}>
            <FileDown size={16} /> Estimativas (CSV)
          </button>
          <button type='button' className={botaoExportar} disabled={!anuncios.items.length} onClick={() => exportarAnuncios(anuncios.items)}>
            <FileDown size={16} /> Anúncios (CSV)
          </button>
          <button type='button' className={botaoExportar} onClick={imprimirComoPdf}>
            <Printer size={16} /> Relatório (PDF)
          </button>
        </div>
      </Card>

      {carregandoCarteira ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className='h-28' />)}
        </div>
      ) : erroCarteira ? (
        <EmptyState title='Não foi possível carregar sua carteira' description={erroCarteira} />
      ) : estimativas.items.length === 0 && anuncios.items.length === 0 ? (
        <EmptyState
          title='Sua carteira ainda está vazia'
          description='Salve uma estimativa para acompanhar seus números aqui e compará-los com o mercado.'
          action={<Link to='/estimativas/nova' className='text-sm font-semibold text-brand-900 hover:underline'>Criar estimativa agora</Link>}
        />
      ) : (
        <CarteiraSection estimativas={estimativas.items} anuncios={anuncios.items} />
      )}

      {resumo && !carregandoCarteira ? (
        <>
          <MercadoSection resumo={resumo} categoriaInicial={preferencias.categoria} zonaInicial={preferencias.zona} />
          <ModeloSection modelo={resumo.modelo} />
        </>
      ) : erroResumo ? (
        <EmptyState title='Panorama do mercado indisponível' description={erroResumo} />
      ) : (
        <Skeleton className='h-64' />
      )}

      <p className='hidden text-xs text-gray-500 print:block'>Relatório gerado pelo GAIÒ em {formatDateTime(geradoEm)}.</p>
    </div>
  );
};
