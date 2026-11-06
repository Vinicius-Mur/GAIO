import { AmenidadeKey, Amenidades, CategoriaImovel, TipoImovel } from '../types';

export const CATEGORIAS: { value: CategoriaImovel; label: string }[] = [
  { value: 'APARTAMENTOS', label: 'Apartamento' },
  { value: 'CASAS', label: 'Casa' }
];

export const TIPOS_IMOVEL: { value: TipoImovel; label: string }[] = [
  { value: 'PADRAO', label: 'Padrão' },
  { value: 'COBERTURA', label: 'Cobertura' },
  { value: 'CASA_DE_CONDOMINIO', label: 'Casa de condomínio' },
  { value: 'CASA_DE_VILA', label: 'Casa de vila' },
  { value: 'DUPLEX_OU_TRIPLEX', label: 'Duplex ou triplex' },
  { value: 'KITNET', label: 'Kitnet' },
  { value: 'LOFT', label: 'Loft' }
];

export const AMENIDADES: { key: AmenidadeKey; label: string }[] = [
  { key: 'academia', label: 'Academia' },
  { key: 'elevador', label: 'Elevador' },
  { key: 'permitidoAnimais', label: 'Permite animais' },
  { key: 'piscina', label: 'Piscina' },
  { key: 'portaria', label: 'Portaria' },
  { key: 'salaoFestas', label: 'Salão de festas' },
  { key: 'condominioFechado', label: 'Condomínio fechado' },
  { key: 'seguranca24h', label: 'Segurança 24h' },
  { key: 'portaoEletronico', label: 'Portão eletrônico' },
  { key: 'areaMurada', label: 'Área murada' },
  { key: 'areaServico', label: 'Área de serviço' },
  { key: 'armariosCozinha', label: 'Armários na cozinha' },
  { key: 'armariosQuarto', label: 'Armários no quarto' },
  { key: 'churrasqueira', label: 'Churrasqueira' },
  { key: 'mobiliado', label: 'Mobiliado' },
  { key: 'quartoServico', label: 'Quarto de serviço' },
  { key: 'arCondicionado', label: 'Ar-condicionado' },
  { key: 'porteiro24h', label: 'Porteiro 24h' },
  { key: 'varanda', label: 'Varanda' }
];

export const rotuloCategoria = (value?: CategoriaImovel): string =>
  CATEGORIAS.find((c) => c.value === value)?.label ?? '—';

export const rotuloTipo = (value?: TipoImovel): string =>
  TIPOS_IMOVEL.find((t) => t.value === value)?.label ?? '—';

export const montarAmenidades = (marcadas: AmenidadeKey[]): Amenidades =>
  Object.fromEntries(marcadas.map((key) => [key, true])) as Amenidades;

export const rotulosAmenidadesMarcadas = (amenidades?: Amenidades): string[] =>
  AMENIDADES.filter((a) => amenidades?.[a.key]).map((a) => a.label);
