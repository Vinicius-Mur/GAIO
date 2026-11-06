import { StatusAnuncio } from '../../types';

interface StatusBadgeProps {
  status?: StatusAnuncio;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const finalStatus = status ?? 'RASCUNHO';
  const className = finalStatus === 'COMPLETO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800';
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{finalStatus}</span>;
};
