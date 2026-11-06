export type AuthStatus = 'carregando' | 'autenticado' | 'nao_autenticado';

export interface User {
  id: number;
  nome: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  tipo: 'Bearer';
  expiraEmMs: number;
  usuario: User;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest extends LoginRequest {
  nome: string;
}

export interface AtualizarPerfilRequest {
  nome: string;
  email: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

export type CategoriaImovel = 'APARTAMENTOS' | 'CASAS';

export type TipoImovel =
  | 'PADRAO'
  | 'COBERTURA'
  | 'CASA_DE_CONDOMINIO'
  | 'CASA_DE_VILA'
  | 'DUPLEX_OU_TRIPLEX'
  | 'KITNET'
  | 'LOFT';

export type Zona = 'NORTE' | 'SUL' | 'LESTE' | 'OESTE' | 'CENTRO';

export type AmenidadeKey =
  | 'academia'
  | 'elevador'
  | 'permitidoAnimais'
  | 'piscina'
  | 'portaria'
  | 'salaoFestas'
  | 'condominioFechado'
  | 'seguranca24h'
  | 'portaoEletronico'
  | 'areaMurada'
  | 'areaServico'
  | 'armariosCozinha'
  | 'armariosQuarto'
  | 'churrasqueira'
  | 'mobiliado'
  | 'quartoServico'
  | 'arCondicionado'
  | 'porteiro24h'
  | 'varanda';

// A API aceita só as amenidades marcadas; as ausentes contam como false.
export type Amenidades = Partial<Record<AmenidadeKey, boolean>>;

export interface EstimativaRequest {
  bairroOuCep: string;
  areaM2: number;
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  categoria: CategoriaImovel;
  tipo: TipoImovel;
  zona?: Zona | null;
  condominio: number;
  amenidades: Amenidades;
}

export interface ParametrosUtilizados {
  localizacao: string;
  areaM2: number;
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  categoria: CategoriaImovel;
  tipo: TipoImovel;
  zona: Zona | null;
  condominio: number;
  amenidades: Amenidades;
}

export interface EstimativaResponse {
  valorEstimado: number;
  faixaMinima: number;
  faixaMaxima: number;
  confianca: number;
  parametros: ParametrosUtilizados;
  insightsMercado: string[];
  dicasFotos: string[];
  referenciaMercado: ReferenciaMercado | null;
}

export type CategoriaMercado = 'Apartamentos' | 'Casas';

// m² dos anúncios da mesma categoria no local da estimativa (bairro ou, com pouca amostra, zona).
export interface ReferenciaMercado {
  local: string;
  fonte: 'bairro' | 'zona';
  categoria: CategoriaMercado | null;
  anuncios: number;
  precoM2Mediano: number;
  precoM2P25: number;
  precoM2P75: number;
}

export interface EstimativaSalva {
  id: number;
  bairroOuCep: string;
  areaM2: number;
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  categoria: CategoriaImovel;
  tipo: TipoImovel;
  zona: Zona | null;
  condominio: number;
  amenidades: Amenidades;
  valorEstimado: number;
  faixaMinima: number | null;
  faixaMaxima: number | null;
  confianca: number | null;
  dicasFotos: string[];
  insightsMercado: string[];
  referenciaMercado: ReferenciaMercado | null;
  criadoEm: string;
}

// Panorama da base de anuncios usada no treino e qualidade do modelo (GET /api/mercado/resumo).
export interface MercadoResumo {
  totalAnuncios: number;
  minimoAnunciosRanking: number;
  zonas: { zona: Zona; anuncios: number; precoM2Mediano: number; precoM2PorCategoria: Partial<Record<CategoriaMercado, number>> }[];
  bairros: BairroPreco[];
  // zona null = cidade toda
  premiosAmenidades: { zona: Zona | null; categoria: CategoriaMercado; amenidade: AmenidadeKey; premio: number }[];
  distribuicoes: { zona: Zona; categoria: CategoriaMercado; anuncios: number; tipos: Record<string, number>; quartos: Record<string, number> }[];
  modelo: {
    cenarios: { cenario: 'completo' | 'sem_bairro' | 'sem_localizacao'; erroMediano: number; mape: number; cobertura: number; meiaLargura: number }[];
    importancias: { variavel: string; peso: number }[];
  };
}

// anuncios = anúncios da categoria no bairro (não do bairro inteiro)
export interface BairroPreco {
  bairro: string;
  zona: Zona;
  categoria: CategoriaMercado;
  precoM2: number;
  precoM2P25: number;
  precoM2P75: number;
  anuncios: number;
}

// Estatisticas dos anuncios da base de treino para o bairro (ou para a zona, quando fonte = 'zona').
export interface MercadoBairro {
  bairro: string;
  zona: Zona;
  fonte: 'bairro' | 'zona';
  anuncios: number;
  precoM2Mediano: number;
  precoM2PorCategoria: Partial<Record<CategoriaMercado, number>>;
  precoM2QuartisPorCategoria: Partial<Record<CategoriaMercado, [number, number, number]>>;
  anunciosPorCategoria: Partial<Record<CategoriaMercado, number>>;
  quartos: Record<string, number>;
  tipos: Record<string, number>;
  condominioMedianoApartamentos: number | null;
}

// Endereco escolhido em uma tela e levado para outra (mapa -> estimativa -> anuncio).
export interface EnderecoEscolhido {
  endereco?: string;
  bairro?: string;
  logradouro?: string;
}

export interface SaveEstimativaRequest {
  parametros: EstimativaRequest;
  valorEstimado: number;
  faixaMinima: number;
  faixaMaxima: number;
  confianca: number;
  insightsMercado: string[];
  referenciaMercado: ReferenciaMercado | null;
}

export interface EnderecoSuggestion {
  placeId: string;
  descricao: string;
}

export interface EnderecoDetalhes {
  enderecoFormatado: string;
  logradouro: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type StatusAnuncio = 'RASCUNHO' | 'COMPLETO';

// Formato de AnuncioResponse do backend. Valor, faixa e confianca vem da estimativa vinculada.
export interface Anuncio {
  id: number;
  estimativaId: number;
  bairro: string;
  enderecoCompleto: string;
  titulo: string;
  descricao: string;
  status: StatusAnuncio;
  publicado: boolean;
  valorEstimado: number;
  faixaMinima: number | null;
  faixaMaxima: number | null;
  confianca: number | null;
  dicasFotos: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface AnuncioRequest {
  estimativaId: number;
  bairro: string;
  enderecoCompleto: string;
}

export interface AnuncioUpdate {
  titulo?: string;
  descricao?: string;
  status?: StatusAnuncio;
  publicado?: boolean;
}

export interface AnuncioFilters {
  id?: number;
  bairro?: string;
  status?: StatusAnuncio;
}

export interface ApiError {
  status?: number;
  message: string;
  details?: unknown;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

export interface LocalEstimateUiState {
  categoria: CategoriaImovel;
  tipo: TipoImovel;
  condominioMensal: string;
  comodidades: AmenidadeKey[];
}
