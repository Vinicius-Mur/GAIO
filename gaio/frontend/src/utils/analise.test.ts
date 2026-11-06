import { describe, expect, it } from 'vitest';
import { anuncio, estimativa, resumoMercado } from '../test/fabricas';
import {
  atividadeSemanal, distribuicaoFiltrada, funil, mediana, meiaLarguraRelativa, posicoesNoBairro, preferenciasDoUsuario,
  premiosFiltrados, rankingBairros, resumoCarteira, truncar
} from './analise';

describe('mediana', () => {
  it('trata lista vazia, ímpar e par', () => {
    expect(mediana([])).toBeNull();
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
  });
});

describe('resumoCarteira', () => {
  it('usa m² mediano e meia largura da faixa no lugar de somar valores', () => {
    const resumo = resumoCarteira(
      [estimativa({ valorEstimado: 1_000_000, areaM2: 100 }), estimativa({ id: 2, valorEstimado: 600_000, areaM2: 50, faixaMinima: 540_000, faixaMaxima: 660_000 })],
      [anuncio({ publicado: true }), anuncio({ id: 2 })]
    );
    expect(resumo.m2Mediano).toBe(11_000);
    expect(resumo.faixaMedia).toBeCloseTo((0.2 + 0.1) / 2);
    expect(resumo).toMatchObject({ estimativas: 2, anuncios: 2, publicados: 1 });
  });

  it('ignora estimativas sem faixa', () => {
    expect(meiaLarguraRelativa(estimativa({ faixaMinima: null }))).toBeNull();
    expect(resumoCarteira([estimativa({ faixaMinima: null })], []).faixaMedia).toBeNull();
  });
});

describe('funil', () => {
  it('calcula a conversão sobre a etapa anterior', () => {
    const etapas = funil(
      [estimativa(), estimativa({ id: 2 }), estimativa({ id: 3 }), estimativa({ id: 4 })],
      [anuncio({ status: 'COMPLETO', publicado: true }), anuncio({ id: 2, status: 'COMPLETO' })]
    );
    expect(etapas.map((e) => e.total)).toEqual([4, 2, 2, 1]);
    expect(etapas.map((e) => e.conversao)).toEqual([null, 0.5, 1, 0.5]);
  });

  it('não divide por zero', () => {
    expect(funil([], []).every((e) => e.conversao === null)).toBe(true);
  });
});

describe('atividadeSemanal', () => {
  it('agrupa por semana (segunda a domingo) e ignora o que está fora do período', () => {
    const hoje = new Date(2026, 9, 22); // quinta, 22/10/2026
    const semanas = atividadeSemanal(
      [
        estimativa({ criadoEm: new Date(2026, 9, 19, 10).toISOString() }), // segunda da semana atual
        estimativa({ id: 2, criadoEm: new Date(2026, 9, 18, 10).toISOString() }), // domingo anterior
        estimativa({ id: 3, criadoEm: new Date(2026, 0, 5).toISOString() }) // fora das 8 semanas
      ],
      [anuncio({ criadoEm: new Date(2026, 9, 21).toISOString() })],
      hoje
    );
    expect(semanas).toHaveLength(8);
    expect(semanas[7]).toMatchObject({ semana: '19/10', estimativas: 1, anuncios: 1 });
    expect(semanas[6]).toMatchObject({ semana: '12/10', estimativas: 1, anuncios: 0 });
    expect(semanas.reduce((s, x) => s + x.estimativas, 0)).toBe(2);
  });
});

describe('posicoesNoBairro', () => {
  it('classifica pela metade central dos anúncios e calcula a diferença para a mediana', () => {
    const [acima, central, abaixo] = posicoesNoBairro([
      estimativa({ valorEstimado: 1_300_000 }),
      estimativa({ id: 2, valorEstimado: 1_000_000 }),
      estimativa({ id: 3, valorEstimado: 700_000, categoria: 'CASAS', areaM2: 100 })
    ]);
    expect(acima).toMatchObject({ posicao: 'acima', m2: 13_000 });
    expect(acima.diferenca).toBeCloseTo(0.3);
    expect(central.posicao).toBe('central');
    expect(abaixo).toMatchObject({ posicao: 'abaixo', rotulo: 'Pinheiros · Casa 100 m²' });
  });

  it('deixa de fora estimativas sem referência e descreve a zona quando a referência é dela', () => {
    const posicoes = posicoesNoBairro([
      estimativa({ referenciaMercado: null }),
      estimativa({ id: 2, referenciaMercado: { ...estimativa().referenciaMercado!, fonte: 'zona', local: 'OESTE' } })
    ]);
    expect(posicoes).toHaveLength(1);
    expect(posicoes[0].local).toBe('zona oeste');
  });
});

describe('preferenciasDoUsuario', () => {
  it('escolhe a categoria e a zona mais frequentes', () => {
    expect(preferenciasDoUsuario([
      estimativa({ categoria: 'CASAS', zona: 'SUL' }),
      estimativa({ id: 2, categoria: 'CASAS', zona: 'SUL' }),
      estimativa({ id: 3 })
    ])).toEqual({ categoria: 'Casas', zona: 'SUL' });
  });

  it('sem estimativas, começa em apartamentos na cidade toda', () => {
    expect(preferenciasDoUsuario([])).toEqual({ categoria: 'Apartamentos', zona: null });
  });
});

describe('panorama filtrado', () => {
  const resumo = resumoMercado();

  it('ranking respeita categoria e zona e ordena pelo m²', () => {
    expect(rankingBairros(resumo.bairros, 'Apartamentos', null).caros.map((b) => b.bairro)).toEqual(['Pinheiros', 'Lapa', 'Tatuapé']);
    expect(rankingBairros(resumo.bairros, 'Apartamentos', 'LESTE').caros.map((b) => b.bairro)).toEqual(['Tatuapé']);
    const ranking = rankingBairros(resumo.bairros, 'Apartamentos', null, 2);
    expect(ranking.baratos.map((b) => b.bairro)).toEqual(['Tatuapé', 'Lapa']);
    expect(ranking.total).toBe(3);
  });

  it('distribuições somam as zonas quando o filtro é a cidade toda', () => {
    expect(distribuicaoFiltrada(resumo, 'Apartamentos', null)).toEqual({
      anuncios: 230,
      tipos: { Padrão: 215, Cobertura: 10, Kitnet: 5 },
      quartos: { '1': 80, '2': 150 }
    });
    expect(distribuicaoFiltrada(resumo, 'Casas', 'LESTE').anuncios).toBe(0);
  });

  it('amenidades da cidade toda usam o recorte sem zona', () => {
    expect(premiosFiltrados(resumo, 'Apartamentos', null).map((p) => p.amenidade)).toEqual(['academia']);
    expect(premiosFiltrados(resumo, 'Apartamentos', 'OESTE').map((p) => p.amenidade)).toEqual(['piscina', 'elevador']);
  });
});

describe('truncar', () => {
  it('abrevia só o que passa do limite', () => {
    expect(truncar('Pinheiros', 15)).toBe('Pinheiros');
    expect(truncar('Conjunto Residencial José Bonifácio', 15)).toBe('Conjunto Resid…');
  });
});
