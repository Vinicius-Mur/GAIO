import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnnouncementCard } from '../components/domain/AnnouncementCard';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';
import { useAnuncios } from '../hooks/useAnuncios';
import { anuncioService } from '../services/anuncioService';
import { Anuncio, StatusAnuncio } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/error';
import { formatCurrencyBRL } from '../utils/format';
import { StatusBadge } from '../components/domain/StatusBadge';

export const AnunciosPage = () => {
  const { items, loading, error, filters, setFilters, fetchAnuncios } = useAnuncios();
  const { showToast } = useToast();
  const [idFilter, setIdFilter] = useState(filters.id ? String(filters.id) : '');
  const [bairroFilter, setBairroFilter] = useState(filters.bairro ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusAnuncio | ''>(filters.status ?? '');

  const [selectedPublish, setSelectedPublish] = useState<Anuncio | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);

  const handleFilter = async (event: FormEvent) => {
    event.preventDefault();
    const nextFilters = {
      id: idFilter ? Number(idFilter) : undefined,
      bairro: bairroFilter || undefined,
      status: statusFilter || undefined
    };
    setFilters(nextFilters);
    await fetchAnuncios(nextFilters);
  };

  const handlePublish = async () => {
    if (!selectedPublish) return;
    setPublishLoading(true);
    try {
      await anuncioService.update(selectedPublish.id, { publicado: true });
      showToast({ type: 'success', title: 'Anúncio publicado', description: 'Status atualizado com sucesso.' });
      setSelectedPublish(null);
      await fetchAnuncios();
    } catch (error) {
      showToast({ type: 'error', title: 'Falha ao publicar', description: getErrorMessage(error) });
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title='Meus anúncios'
        subtitle='Filtre, edite e publique seus anúncios gerados por IA.'
        action={<Link to='/anuncios/novo'><Button>Nova publicação</Button></Link>}
      />

      <form onSubmit={handleFilter} className='mb-5 grid gap-3 rounded-2xl bg-white p-4 shadow-soft md:grid-cols-4'>
        <Input label='ID do anúncio' value={idFilter} onChange={(e) => setIdFilter(e.target.value)} placeholder='Ex: 12' inputMode='numeric' />
        <Input label='Bairro' value={bairroFilter} onChange={(e) => setBairroFilter(e.target.value)} placeholder='Ex: Vila Mariana' />
        <Select label='Status' value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusAnuncio | '')}>
          <option value=''>Todos</option>
          <option value='RASCUNHO'>Rascunho</option>
          <option value='COMPLETO'>Completo</option>
        </Select>
        <div className='flex items-end'>
          <Button type='submit' fullWidth>Filtrar</Button>
        </div>
      </form>

      {loading ? (
        <div className='grid gap-3'>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className='h-48' />)}</div>
      ) : error ? (
        <EmptyState title='Não foi possível carregar os anúncios' description={error} />
      ) : items.length === 0 ? (
        <EmptyState title='Nenhum anúncio encontrado' description='Ajuste os filtros ou crie uma nova publicação.' action={<Link className='text-sm font-semibold text-brand-900 hover:underline' to='/anuncios/novo'>Criar anúncio</Link>} />
      ) : (
        <>
          <div className='hidden overflow-hidden rounded-2xl bg-white shadow-soft lg:block'>
            <table className='min-w-full text-sm'>
              <thead className='bg-surface-100 text-left text-xs uppercase tracking-wide2 text-gray-500'>
                <tr>
                  <th className='px-4 py-3'>Título</th><th className='px-4 py-3'>Bairro</th><th className='px-4 py-3'>Status</th><th className='px-4 py-3'>Publicado</th><th className='px-4 py-3'>Valor</th><th className='px-4 py-3'>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((anuncio) => (
                  <tr key={anuncio.id} className='border-t border-surface-100'>
                    <td className='px-4 py-3 font-medium text-brand-900'>{anuncio.titulo || 'Sem título'}</td>
                    <td className='px-4 py-3'>{anuncio.bairro || '—'}</td>
                    <td className='px-4 py-3'><StatusBadge status={anuncio.status} /></td>
                    <td className='px-4 py-3'>{anuncio.publicado ? 'Sim' : 'Não'}</td>
                    <td className='px-4 py-3'>{formatCurrencyBRL(anuncio.valorEstimado)}</td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap gap-2'>
                        <Link to={`/anuncios/${anuncio.id}`} className='text-brand-900 underline'>Visualizar</Link>
                        <Link to={`/anuncios/${anuncio.id}/editar`} className='text-brand-900 underline'>Editar</Link>
                        <button className='text-brand-900 underline disabled:text-gray-400' disabled={anuncio.status !== 'COMPLETO'} onClick={() => setSelectedPublish(anuncio)}>Publicar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='grid gap-3 lg:hidden'>
            {items.map((anuncio) => (
              <AnnouncementCard key={anuncio.id} anuncio={anuncio} onPublish={(item) => setSelectedPublish(item)} />
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(selectedPublish)}
        title='Confirmar publicação'
        description='Deseja marcar este anúncio como publicado?'
        confirmLabel='Publicar'
        onClose={() => setSelectedPublish(null)}
        onConfirm={() => void handlePublish()}
        loading={publishLoading}
      />
    </div>
  );
};
