import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/layout/PageHeader';
import { anuncioService } from '../services/anuncioService';
import { Anuncio, AnuncioUpdate, StatusAnuncio } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/error';

export const EditarAnuncioPage = () => {
  const { id } = useParams();
  const anuncioId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<StatusAnuncio>('RASCUNHO');
  const [publicado, setPublicado] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const item = await anuncioService.getById(anuncioId);
        setAnuncio(item);
        setTitulo(item?.titulo ?? '');
        setDescricao(item?.descricao ?? '');
        setStatus(item?.status ?? 'RASCUNHO');
        setPublicado(Boolean(item?.publicado));
      } catch (error) {
        showToast({ type: 'error', title: 'Falha ao carregar anúncio', description: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(anuncioId)) {
      void run();
    }
  }, [anuncioId]);

  const payload = useMemo<AnuncioUpdate>(() => {
    const changed: AnuncioUpdate = {};
    if (!anuncio) return changed;
    if ((anuncio.titulo ?? '') !== titulo) changed.titulo = titulo;
    if ((anuncio.descricao ?? '') !== descricao) changed.descricao = descricao;
    if ((anuncio.status ?? 'RASCUNHO') !== status) changed.status = status;
    if (Boolean(anuncio.publicado) !== publicado) changed.publicado = publicado;
    return changed;
  }, [anuncio, titulo, descricao, status, publicado]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!anuncio) return;

    if (publicado && status !== 'COMPLETO') {
      showToast({ type: 'error', title: 'Regra de publicação', description: 'Um anúncio só pode ser publicado quando estiver COMPLETO.' });
      return;
    }

    if (Object.keys(payload).length === 0) {
      showToast({ type: 'info', title: 'Sem alterações', description: 'Nenhum campo foi alterado.' });
      return;
    }

    setSaving(true);
    try {
      await anuncioService.update(anuncio.id, payload);
      showToast({ type: 'success', title: 'Anúncio atualizado', description: 'As alterações foram salvas.' });
      navigate(`/anuncios/${anuncio.id}`);
    } catch (error) {
      showToast({ type: 'error', title: 'Falha ao atualizar', description: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text='Carregando anúncio...' />;
  if (!anuncio) return <EmptyState title='Anúncio não encontrado' description='Verifique o ID informado.' action={<Button onClick={() => navigate('/anuncios')}>Voltar</Button>} />;

  return (
    <div className='space-y-6'>
      <PageHeader title={`Editar anúncio #${anuncio.id}`} subtitle='Envio parcial (PATCH): apenas campos alterados serão enviados.' />

      <Card>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <Input label='Título' value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <div className='space-y-1'>
            <label htmlFor='descricao' className='block text-xs font-semibold uppercase tracking-wide text-brand-800'>Descrição</label>
            <textarea id='descricao' className='focus-ring min-h-36 w-full rounded-xl border border-surface-100 bg-surface-100 px-3 py-3 text-sm' value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <Select
              label='Status do anúncio'
              value={status}
              onChange={(e) => {
                const novoStatus = e.target.value as StatusAnuncio;
                setStatus(novoStatus);
                // Regra do backend: so anuncio COMPLETO pode ficar publicado.
                if (novoStatus !== 'COMPLETO') setPublicado(false);
              }}
            >
              <option value='RASCUNHO'>RASCUNHO</option>
              <option value='COMPLETO'>COMPLETO</option>
            </Select>
            <label className='flex items-center gap-2 rounded-xl border border-surface-100 bg-surface-100 px-3 py-3 text-sm text-brand-900'>
              <input
                type='checkbox'
                checked={publicado}
                onChange={(e) => setPublicado(e.target.checked)}
                disabled={status !== 'COMPLETO'}
                aria-label='Marcar anúncio como publicado'
              />
              Marcar como publicado
            </label>
          </div>
          {status !== 'COMPLETO' ? <p className='text-xs text-amber-700'>Para publicar, altere o status para COMPLETO.</p> : null}
          <div className='flex flex-wrap gap-2'>
            <Button type='submit' loading={saving}>Salvar alterações</Button>
            <Button type='button' variant='secondary' onClick={() => navigate(`/anuncios/${anuncio.id}`)}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
