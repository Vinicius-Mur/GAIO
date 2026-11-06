import { Card } from '../common/Card';

interface StatTileProps {
  rotulo: string;
  valor: string;
  detalhe?: string;
}

// Numero de destaque: figuras proporcionais (sem tabular-nums) e a mesma fonte do resto da interface.
export const StatTile = ({ rotulo, valor, detalhe }: StatTileProps) => (
  <Card className='break-inside-avoid'>
    <p className='text-xs uppercase tracking-wide2 text-gray-500'>{rotulo}</p>
    <p className='mt-2 text-3xl font-semibold text-brand-900'>{valor}</p>
    {detalhe ? <p className='mt-1 text-xs text-gray-500'>{detalhe}</p> : null}
  </Card>
);
