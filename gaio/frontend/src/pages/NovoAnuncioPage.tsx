import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { Loading } from '../components/common/Loading';
import { Select } from '../components/common/Select';
import { PageHeader } from '../components/layout/PageHeader';
import { rotuloCategoria, rotuloTipo } from '../constants/imovel';
import { anuncioService } from '../services/anuncioService';
import { estimativaService } from '../services/estimativaService';
import { Anuncio, EstimativaSalva } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/error';
import { formatCurrencyBRL } from '../utils/format';

interface LocationState {
  estimativaId?: number;
  bairro?: string;
  logradouro?: string;
}

const montarEndereco = (rua: string, numero: string, complemento: string) =>
  [rua.trim(), numero.trim(), complemento.trim()].filter(Boolean).join(', ');

const rotuloEstimativa = (e: EstimativaSalva) =>
  `#${e.id} · ${e.bairroOuCep} · ${rotuloCategoria(e.categoria)} ${rotuloTipo(e.tipo).toLowerCase()}, ${e.areaM2} m² · ${formatCurrencyBRL(e.valorEstimado)}`;

export const NovoAnuncioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const state = (location.state as LocationState | null) ?? null;

  const [estimativas, setEstimativas] = useState<EstimativaSalva[]>([]);
  const [comAnuncio, setComAnuncio] = useState<Set<number>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [estimativaId, setEstimativaId] = useState(state?.estimativaId ? String(state.estimativaId) : '');
  const [bairro, setBairro] = useState(state?.bairro ?? '');
  const [rua, setRua] = useState(state?.logradouro ?? '');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Anuncio | null>(null);

  useEffect(() => {
    Promise.all([estimativaService.listar(), anuncioService.list()])
      .then(([listaEstimativas, anuncios]) => {
        setEstimativas(listaEstimativas);
        setComAnuncio(new Set(anuncios.map((a) => a.estimativaId)));
      })
      .catch((error) => showToast({ type: 'error', title: 'Falha ao carregar estimativas', description: getErrorMessage(error) }))
      .finally(() => setCarregando(false));
  }, [showToast]);

  const disponiveis = useMemo(() => estimativas.filter((e) => !comAnuncio.has(e.id)), [estimativas, comAnuncio]);
  const escolhida = estimativas.find((e) => String(e.id) === estimativaId) ?? null;

  const selecionarEstimativa = (id: string) => {
    setEstimativaId(id);
    const escolhida = estimativas.find((e) => String(e.id) === id);
    if (escolhida && !bairro) setBairro(escolhida.bairroOuCep);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!estimativaId || !bairro.trim() || !rua.trim() || !numero.trim()) {
      showToast({ type: 'error', title: 'Campos obrigatórios', description: 'Escolha a estimativa e preencha bairro, rua e número.' });
      return;
    }
    const enderecoCompleto = montarEndereco(rua, numero, complemento);

    setLoading(true);
    try {
      const anuncio = await anuncioService.create({ estimativaId: Number(estimativaId), bairro: bairro.trim(), enderecoCompleto });
      setCreated(anuncio);
      setComAnuncio((prev) => new Set(prev).add(anuncio.estimativaId));
      showToast({ type: 'success', title: 'Anúncio criado', description: 'Revise e edite antes de publicar.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Falha ao criar anúncio', description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  if (carregando) return <Loading text='Carregando suas estimativas...' />;

  return (
    <div className='space-y-6'>
      <PageHeader title='Nova publicação' subtitle='Crie um anúncio a partir de uma estimativa salva. O título e a descrição são gerados a partir dos dados do imóvel.' />

      {estimativas.length === 0 ? (
        <EmptyState
          title='Nenhuma estimativa salva'
          description='Para criar um anúncio, calcule uma estimativa e salve na sua conta.'
          action={<Link className='text-sm font-semibold text-brand-900 hover:underline' to='/estimativas/nova'>Calcular estimativa</Link>}
        />
      ) : disponiveis.length === 0 && !created ? (
        <EmptyState
          title='Todas as estimativas já têm anúncio'
          description='Cada estimativa gera um único anúncio. Calcule e salve uma nova estimativa para criar outro.'
          action={<Link className='text-sm font-semibold text-brand-900 hover:underline' to='/estimativas/nova'>Calcular estimativa</Link>}
        />
      ) : (
        <Card>
          <form onSubmit={handleCreate} className='grid gap-3 md:grid-cols-2'>
            <div className='md:col-span-2'>
              <Select label='Estimativa salva' value={estimativaId} onChange={(e) => selecionarEstimativa(e.target.value)} required>
                <option value=''>Escolha uma estimativa</option>
                {estimativas.map((e) => (
                  <option key={e.id} value={e.id} disabled={comAnuncio.has(e.id)}>
                    {rotuloEstimativa(e)}{comAnuncio.has(e.id) ? ' (já tem anúncio)' : ''}
                  </option>
                ))}
              </Select>
            </div>
            <Input label='Bairro' value={bairro} onChange={(e) => setBairro(e.target.value)} required />
            <Input label='Rua' value={rua} onChange={(e) => setRua(e.target.value)} placeholder='Ex: Rua Augusta' autoComplete='address-line1' required />
            <Input label='Número' value={numero} onChange={(e) => setNumero(e.target.value)} placeholder='Ex: 1200' inputMode='numeric' required />
            <Input label='Complemento (opcional)' value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder='Ex: apto 42' autoComplete='address-line2' />
            {rua.trim() && numero.trim() ? (
              <p className='md:col-span-2 text-xs text-gray-500'>Endereço no anúncio: {montarEndereco(rua, numero, complemento)}</p>
            ) : null}
            {escolhida && escolhida.dicasFotos.length ? (
              <div className='md:col-span-2 rounded-xl border border-surface-100 bg-surface-50 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Dicas para as fotos do anúncio</p>
                <ul className='mt-2 grid gap-2 md:grid-cols-2'>
                  {escolhida.dicasFotos.map((dica) => (
                    <li key={dica} className='rounded-lg bg-white p-3 text-sm text-brand-900'>{dica}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className='md:col-span-2'>
              <Button type='submit' loading={loading}>Criar anúncio</Button>
            </div>
          </form>
        </Card>
      )}

      {created ? (
        <Card className='space-y-3'>
          <h3 className='text-lg font-semibold text-brand-900'>Anúncio #{created.id} criado como rascunho</h3>
          <div>
            <p className='text-xs uppercase tracking-wide2 text-gray-500'>Título gerado</p>
            <p className='font-semibold text-brand-900'>{created.titulo}</p>
          </div>
          <div>
            <p className='text-xs uppercase tracking-wide2 text-gray-500'>Descrição gerada</p>
            <p className='text-sm text-gray-700'>{created.descricao}</p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button onClick={() => navigate(`/anuncios/${created.id}/editar`)}>Editar anúncio</Button>
            <Button variant='secondary' onClick={() => navigate(`/anuncios/${created.id}`)}>Visualizar detalhes</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};
