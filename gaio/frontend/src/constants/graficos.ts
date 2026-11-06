import { AmenidadeKey, Zona } from '../types';
import { AMENIDADES } from './imovel';

// Par categorico derivado da marca e validado (luminosidade, croma, daltonismo e contraste >= 3:1 no branco).
export const COR_PRINCIPAL = '#4F46A5';
export const COR_SECUNDARIA = '#A0761A';
// Grade e eixos recessivos; texto sempre em tons de tinta, nunca na cor da serie.
export const COR_GRADE = '#E5E7EB';
export const COR_EIXO = '#6B7280';
export const COR_REFERENCIA = '#9CA3AF';

export const NOME_ZONA: Record<Zona, string> = {
  NORTE: 'Zona Norte',
  SUL: 'Zona Sul',
  LESTE: 'Zona Leste',
  OESTE: 'Zona Oeste',
  CENTRO: 'Centro'
};

export const NOME_CENARIO: Record<string, string> = {
  completo: 'Bairro reconhecido',
  sem_bairro: 'Só a zona',
  sem_localizacao: 'Sem localização'
};

export const NOME_VARIAVEL: Record<string, string> = {
  areaM2: 'Área',
  condominio: 'Condomínio',
  zona: 'Zona',
  bairro: 'Bairro',
  vagasGaragem: 'Vagas',
  banheiros: 'Banheiros',
  quartos: 'Quartos',
  tipo: 'Tipo',
  categoria: 'Categoria',
  ...Object.fromEntries(AMENIDADES.map((a) => [a.key, a.label]))
};

export const nomeAmenidade = (chave: AmenidadeKey) => AMENIDADES.find((a) => a.key === chave)?.label ?? chave;

export const formatarPercentual = (valor: number, casas = 0) => {
  const arredondado = Number((valor * 100).toFixed(casas));
  if (arredondado === 0) return '0%';
  return `${arredondado > 0 ? '+' : ''}${arredondado.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas })}%`;
};

// Folga dos dois lados do zero para os rotulos das barras divergentes nao baterem nos nomes do eixo.
export const DOMINIO_DIVERGENTE: [(min: number) => number, (max: number) => number] = [
  (min) => Math.floor((Math.min(0, min) - 0.05) * 10) / 10,
  (max) => Math.ceil((Math.max(0, max) + 0.05) * 10) / 10
];

export const formatarMilhar = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
