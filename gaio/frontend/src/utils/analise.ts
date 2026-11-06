import { Anuncio, BairroPreco, CategoriaImovel, CategoriaMercado, EstimativaSalva, MercadoResumo, Zona } from '../types';

export const CATEGORIA_MERCADO: Record<CategoriaImovel, CategoriaMercado> = { APARTAMENTOS: 'Apartamentos', CASAS: 'Casas' };

export const mediana = (valores: number[]): number | null => {
  if (!valores.length) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
};

export const precoM2 = (e: Pick<EstimativaSalva, 'valorEstimado' | 'areaM2'>) => e.valorEstimado / e.areaM2;

// Meia largura da faixa em relacao ao valor: "±18%" e mais facil de ler que um indice de confianca.
export const meiaLarguraRelativa = (e: Pick<EstimativaSalva, 'valorEstimado' | 'faixaMinima' | 'faixaMaxima'>) =>
  e.faixaMinima !== null && e.faixaMaxima !== null && e.valorEstimado > 0
    ? (e.faixaMaxima - e.faixaMinima) / 2 / e.valorEstimado
    : null;

export const resumoCarteira = (estimativas: EstimativaSalva[], anuncios: Anuncio[]) => {
  const larguras = estimativas.map(meiaLarguraRelativa).filter((v): v is number => v !== null);
  return {
    estimativas: estimativas.length,
    m2Mediano: mediana(estimativas.map(precoM2)),
    faixaMedia: larguras.length ? larguras.reduce((s, v) => s + v, 0) / larguras.length : null,
    anuncios: anuncios.length,
    publicados: anuncios.filter((a) => a.publicado).length
  };
};

export interface EtapaFunil {
  etapa: string;
  total: number;
  conversao: number | null; // em relacao a etapa anterior
}

export const funil = (estimativas: EstimativaSalva[], anuncios: Anuncio[]): EtapaFunil[] => {
  const totais: [string, number][] = [
    ['Estimativas salvas', estimativas.length],
    ['Viraram anúncio', anuncios.length],
    ['Anúncio completo', anuncios.filter((a) => a.status === 'COMPLETO').length],
    ['Publicados', anuncios.filter((a) => a.publicado).length]
  ];
  return totais.map(([etapa, total], i) => {
    const anterior = i === 0 ? null : totais[i - 1][1];
    return { etapa, total, conversao: anterior ? total / anterior : null };
  });
};

export const inicioDaSemana = (data: Date) => {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export interface Semana {
  inicio: Date;
  semana: string;
  estimativas: number;
  anuncios: number;
}

export const atividadeSemanal = (estimativas: EstimativaSalva[], anuncios: Anuncio[], hoje: Date, quantidade = 8): Semana[] => {
  const atual = inicioDaSemana(hoje);
  const semanas: Semana[] = Array.from({ length: quantidade }, (_, i) => {
    const inicio = new Date(atual);
    inicio.setDate(atual.getDate() - 7 * (quantidade - 1 - i));
    return { inicio, semana: inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), estimativas: 0, anuncios: 0 };
  });
  const somar = (data: string, campo: 'estimativas' | 'anuncios') => {
    const chave = inicioDaSemana(new Date(data)).getTime();
    const semana = semanas.find((s) => s.inicio.getTime() === chave);
    if (semana) semana[campo] += 1;
  };
  estimativas.forEach((e) => somar(e.criadoEm, 'estimativas'));
  anuncios.forEach((a) => somar(a.criadoEm, 'anuncios'));
  return semanas;
};

export type Posicao = 'abaixo' | 'central' | 'acima';

export const ROTULO_POSICAO: Record<Posicao, string> = {
  abaixo: 'entre os 25% mais baratos',
  central: 'na faixa central',
  acima: 'entre os 25% mais caros'
};

export interface PosicaoNoBairro {
  id: number;
  rotulo: string;
  local: string;
  m2: number;
  p25: number;
  mediana: number;
  p75: number;
  diferenca: number;
  posicao: Posicao;
}

const ROTULO_CATEGORIA: Record<CategoriaImovel, string> = { APARTAMENTOS: 'Apto', CASAS: 'Casa' };

// So entram estimativas salvas com a referencia gravada (as anteriores a essa versao nao tem).
export const posicoesNoBairro = (estimativas: EstimativaSalva[]): PosicaoNoBairro[] =>
  estimativas.flatMap((e) => {
    const ref = e.referenciaMercado;
    if (!ref) return [];
    const m2 = precoM2(e);
    const posicao: Posicao = m2 < ref.precoM2P25 ? 'abaixo' : m2 > ref.precoM2P75 ? 'acima' : 'central';
    return [{
      id: e.id,
      rotulo: `${e.bairroOuCep} · ${ROTULO_CATEGORIA[e.categoria]} ${Math.round(e.areaM2)} m²`,
      local: ref.fonte === 'zona' ? `zona ${ref.local.toLowerCase()}` : ref.local,
      m2,
      p25: ref.precoM2P25,
      mediana: ref.precoM2Mediano,
      p75: ref.precoM2P75,
      diferenca: m2 / ref.precoM2Mediano - 1,
      posicao
    }];
  });

const maisFrequente = <T extends string>(valores: (T | null)[]): T | null => {
  const contagem = new Map<T, number>();
  valores.forEach((v) => v && contagem.set(v, (contagem.get(v) ?? 0) + 1));
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

// Filtro inicial do panorama: o que o usuario mais estima.
export const preferenciasDoUsuario = (estimativas: EstimativaSalva[]): { categoria: CategoriaMercado; zona: Zona | null } => {
  const categoria = maisFrequente(estimativas.map((e) => e.categoria));
  return { categoria: categoria ? CATEGORIA_MERCADO[categoria] : 'Apartamentos', zona: maisFrequente(estimativas.map((e) => e.zona)) };
};

export const rankingBairros = (bairros: BairroPreco[], categoria: CategoriaMercado, zona: Zona | null, tamanho = 10) => {
  const filtrados = bairros
    .filter((b) => b.categoria === categoria && (zona === null || b.zona === zona))
    .sort((a, b) => b.precoM2 - a.precoM2);
  return {
    total: filtrados.length,
    caros: filtrados.slice(0, tamanho),
    baratos: filtrados.slice(-tamanho).reverse()
  };
};

export const somarContagens = (contagens: Record<string, number>[]) => {
  const total: Record<string, number> = {};
  contagens.forEach((c) => Object.entries(c).forEach(([k, n]) => { total[k] = (total[k] ?? 0) + n; }));
  return total;
};

export const distribuicaoFiltrada = (resumo: MercadoResumo, categoria: CategoriaMercado, zona: Zona | null) => {
  const recortes = resumo.distribuicoes.filter((d) => d.categoria === categoria && (zona === null || d.zona === zona));
  return {
    anuncios: recortes.reduce((s, d) => s + d.anuncios, 0),
    tipos: somarContagens(recortes.map((d) => d.tipos)),
    quartos: somarContagens(recortes.map((d) => d.quartos))
  };
};

export const premiosFiltrados = (resumo: MercadoResumo, categoria: CategoriaMercado, zona: Zona | null) =>
  resumo.premiosAmenidades
    .filter((p) => p.categoria === categoria && p.zona === zona)
    .sort((a, b) => b.premio - a.premio);

export const truncar = (texto: string, maximo: number) => (texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto);
