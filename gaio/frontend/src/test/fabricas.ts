import { AMENIDADES } from '../constants/imovel';
import { Amenidades, Anuncio, EstimativaSalva, MercadoResumo } from '../types';

const semAmenidades = Object.fromEntries(AMENIDADES.map((a) => [a.key, false])) as unknown as Amenidades;

export const estimativa = (dados: Partial<EstimativaSalva> = {}): EstimativaSalva => ({
  id: 1,
  bairroOuCep: 'Pinheiros',
  areaM2: 100,
  quartos: 2,
  banheiros: 2,
  vagasGaragem: 1,
  categoria: 'APARTAMENTOS',
  tipo: 'PADRAO',
  zona: 'OESTE',
  condominio: 900,
  amenidades: semAmenidades,
  valorEstimado: 1_000_000,
  faixaMinima: 800_000,
  faixaMaxima: 1_200_000,
  confianca: 0.8,
  dicasFotos: [],
  insightsMercado: [],
  referenciaMercado: {
    local: 'Pinheiros',
    fonte: 'bairro',
    categoria: 'Apartamentos',
    anuncios: 600,
    precoM2Mediano: 10_000,
    precoM2P25: 8_000,
    precoM2P75: 12_000
  },
  criadoEm: '2026-10-20T12:00:00Z',
  ...dados
});

export const anuncio = (dados: Partial<Anuncio> = {}): Anuncio => ({
  id: 1,
  estimativaId: 1,
  bairro: 'Pinheiros',
  enderecoCompleto: 'Rua Teste, 10',
  titulo: 'Apartamento com 2 quartos no bairro Pinheiros',
  descricao: 'Descrição',
  status: 'RASCUNHO',
  publicado: false,
  valorEstimado: 1_000_000,
  faixaMinima: 800_000,
  faixaMaxima: 1_200_000,
  confianca: 0.8,
  dicasFotos: [],
  criadoEm: '2026-10-20T12:00:00Z',
  atualizadoEm: '2026-10-20T12:00:00Z',
  ...dados
});

export const resumoMercado = (): MercadoResumo => ({
  totalAnuncios: 300,
  minimoAnunciosRanking: 30,
  zonas: [
    { zona: 'OESTE', anuncios: 200, precoM2Mediano: 11_000, precoM2PorCategoria: { Apartamentos: 12_000, Casas: 6_000 } },
    { zona: 'LESTE', anuncios: 100, precoM2Mediano: 8_000, precoM2PorCategoria: { Apartamentos: 8_500, Casas: 5_000 } }
  ],
  bairros: [
    { bairro: 'Pinheiros', zona: 'OESTE', categoria: 'Apartamentos', precoM2: 17_000, precoM2P25: 14_000, precoM2P75: 20_000, anuncios: 600 },
    { bairro: 'Lapa', zona: 'OESTE', categoria: 'Apartamentos', precoM2: 11_000, precoM2P25: 9_000, precoM2P75: 13_000, anuncios: 90 },
    { bairro: 'Tatuapé', zona: 'LESTE', categoria: 'Apartamentos', precoM2: 9_000, precoM2P25: 7_500, precoM2P75: 10_500, anuncios: 80 },
    { bairro: 'Pinheiros', zona: 'OESTE', categoria: 'Casas', precoM2: 9_500, precoM2P25: 8_000, precoM2P75: 11_000, anuncios: 40 }
  ],
  premiosAmenidades: [
    { zona: 'OESTE', categoria: 'Apartamentos', amenidade: 'piscina', premio: 0.2 },
    { zona: 'OESTE', categoria: 'Apartamentos', amenidade: 'elevador', premio: -0.03 },
    { zona: null, categoria: 'Apartamentos', amenidade: 'academia', premio: 0.15 }
  ],
  distribuicoes: [
    { zona: 'OESTE', categoria: 'Apartamentos', anuncios: 150, tipos: { Padrão: 140, Cobertura: 10 }, quartos: { '1': 50, '2': 100 } },
    { zona: 'LESTE', categoria: 'Apartamentos', anuncios: 80, tipos: { Padrão: 75, Kitnet: 5 }, quartos: { '1': 30, '2': 50 } },
    { zona: 'OESTE', categoria: 'Casas', anuncios: 70, tipos: { Padrão: 60, 'Casa de vila': 10 }, quartos: { '3': 70 } }
  ],
  modelo: {
    cenarios: [
      { cenario: 'completo', erroMediano: 0.16, mape: 0.22, cobertura: 0.8, meiaLargura: 0.36 },
      { cenario: 'sem_bairro', erroMediano: 0.19, mape: 0.27, cobertura: 0.8, meiaLargura: 0.42 },
      { cenario: 'sem_localizacao', erroMediano: 0.21, mape: 0.29, cobertura: 0.8, meiaLargura: 0.47 }
    ],
    importancias: [{ variavel: 'areaM2', peso: 34 }, { variavel: 'condominio', peso: 16 }]
  }
});
