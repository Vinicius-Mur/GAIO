import { Link } from 'react-router-dom';
import { Anuncio } from '../../types';
import { formatCurrencyBRL } from '../../utils/format';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge } from './StatusBadge';

interface AnnouncementCardProps {
  anuncio: Anuncio;
  onPublish: (anuncio: Anuncio) => void;
}

export const AnnouncementCard = ({ anuncio, onPublish }: AnnouncementCardProps) => {
  const canPublish = anuncio.status === 'COMPLETO';

  return (
    <Card className='space-y-3'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <p className='text-base font-semibold text-brand-900'>{anuncio.titulo || 'Sem título'}</p>
          <p className='text-sm text-gray-600'>{anuncio.bairro || 'Bairro não informado'}</p>
        </div>
        <StatusBadge status={anuncio.status} />
      </div>
      <p className='text-sm text-gray-600'>
        Publicado: <strong>{anuncio.publicado ? 'Sim' : 'Não'}</strong>
      </p>
      <p className='text-sm text-gray-600'>Valor estimado: {formatCurrencyBRL(anuncio.valorEstimado)}</p>
      <div className='flex flex-wrap gap-2'>
        <Link to={`/anuncios/${anuncio.id}`}>
          <Button variant='secondary'>Visualizar</Button>
        </Link>
        <Link to={`/anuncios/${anuncio.id}/editar`}>
          <Button variant='ghost'>Editar</Button>
        </Link>
        <Button onClick={() => onPublish(anuncio)} disabled={!canPublish} title={!canPublish ? 'Complete o anúncio antes de publicar.' : ''}>
          Publicar
        </Button>
      </div>
      {!canPublish ? <p className='text-xs text-amber-700'>Para publicar, altere o status para COMPLETO.</p> : null}
    </Card>
  );
};
