import { EstimativaResponse } from '../../types';
import { rotuloCategoria, rotuloTipo, rotulosAmenidadesMarcadas } from '../../constants/imovel';
import { formatCurrencyBRL, formatPercent } from '../../utils/format';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface EstimateCardProps {
  result: EstimativaResponse;
  onSave: () => void;
  onSaveAndCreate: () => void;
  onReset: () => void;
  saveLoading?: boolean;
  saved?: boolean;
}

export const EstimateCard = ({ result, onSave, onSaveAndCreate, onReset, saveLoading, saved }: EstimateCardProps) => {
  const p = result.parametros;
  const comodidades = rotulosAmenidadesMarcadas(p.amenidades);

  return (
    <Card className='space-y-5 p-0'>
      <div className='rounded-2xl bg-brand-900 p-6 text-white'>
        <p className='text-xs font-semibold uppercase tracking-wide2 text-amber-100'>Valor estimado</p>
        <p className='mt-2 text-4xl font-semibold text-accent-500'>{formatCurrencyBRL(result.valorEstimado)}</p>
        <div className='mt-4 rounded-xl bg-white/10 p-4'>
          <p className='text-xs text-gray-200'>Faixa provável de mercado</p>
          <p className='font-semibold'>{formatCurrencyBRL(result.faixaMinima)} — {formatCurrencyBRL(result.faixaMaxima)}</p>
        </div>
        <p className='mt-4 font-semibold text-accent-500'>Confiança da estimativa: {formatPercent(result.confianca)}</p>
      </div>

      <div className='grid gap-5 px-6 pb-6 md:grid-cols-2'>
        <div>
          <h3 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Parâmetros analisados</h3>
          <dl className='mt-3 grid grid-cols-2 gap-2 text-sm'>
            <dt className='text-gray-500'>Localização</dt><dd>{p.localizacao}</dd>
            <dt className='text-gray-500'>Imóvel</dt><dd>{rotuloCategoria(p.categoria)} · {rotuloTipo(p.tipo)}</dd>
            <dt className='text-gray-500'>Área</dt><dd>{p.areaM2} m²</dd>
            <dt className='text-gray-500'>Condomínio</dt><dd>{p.condominio > 0 ? formatCurrencyBRL(p.condominio) : 'Não tem'}</dd>
            <dt className='text-gray-500'>Quartos</dt><dd>{p.quartos}</dd>
            <dt className='text-gray-500'>Banheiros</dt><dd>{p.banheiros}</dd>
            <dt className='text-gray-500'>Vagas</dt><dd>{p.vagasGaragem}</dd>
            <dt className='text-gray-500'>Comodidades</dt><dd>{comodidades.length ? comodidades.join(', ') : 'Nenhuma'}</dd>
          </dl>
        </div>
        <div>
          <h3 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Insights de mercado</h3>
          {result.insightsMercado.length ? (
            <ul className='mt-3 space-y-2'>
              {result.insightsMercado.map((insight) => (
                <li key={insight} className='rounded-xl border border-accent-500/40 bg-accent-100 p-3 text-sm text-brand-900'>
                  {insight}
                </li>
              ))}
            </ul>
          ) : (
            <p className='mt-3 text-sm text-gray-500'>Sem insights para este imóvel.</p>
          )}
        </div>
        <div className='md:col-span-2 grid gap-3 sm:grid-cols-3'>
          <Button variant='secondary' fullWidth onClick={onSave} loading={saveLoading} disabled={saved}>
            {saved ? 'Salva' : 'Salvar'}
          </Button>
          <Button fullWidth onClick={onSaveAndCreate} loading={saveLoading}>
            {saved ? 'Criar anúncio' : 'Salvar e criar anúncio'}
          </Button>
          <Button variant='ghost' fullWidth onClick={onReset}>Novo cálculo</Button>
        </div>
      </div>
    </Card>
  );
};
