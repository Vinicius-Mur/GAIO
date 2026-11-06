import { COR_EIXO } from '../../constants/graficos';
import { truncar } from '../../utils/analise';

interface RotuloEixoProps {
  x?: number | string;
  y?: number | string;
  payload?: { value: string | number };
  maximo: number;
  formatar?: (valor: string) => string;
}

// Rotulo do eixo de categorias em uma linha so: o padrao do Recharts quebra nomes longos em varias linhas
// que se sobrepoem as barras vizinhas. O nome completo continua no tooltip e na tabela.
export const RotuloEixo = ({ x = 0, y = 0, payload, maximo, formatar }: RotuloEixoProps) => {
  const texto = String(payload?.value ?? '');
  const exibido = truncar(formatar ? formatar(texto) : texto, maximo);
  return (
    <text x={Number(x)} y={Number(y)} dy={4} dx={-4} textAnchor='end' fill={COR_EIXO} fontSize={12}>
      {exibido !== texto ? <title>{texto}</title> : null}
      {exibido}
    </text>
  );
};
