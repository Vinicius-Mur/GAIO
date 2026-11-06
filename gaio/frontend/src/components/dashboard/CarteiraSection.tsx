import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../common/Card';
import { ChartCard } from './ChartCard';
import { RotuloEixo } from './RotuloEixo';
import { StatTile } from './StatTile';
import { COR_EIXO, COR_GRADE, COR_PRINCIPAL, COR_SECUNDARIA, formatarPercentual } from '../../constants/graficos';
import { useTelaPequena } from '../../hooks/useTelaPequena';
import { Anuncio, EstimativaSalva } from '../../types';
import {
  PosicaoNoBairro, Posicao, ROTULO_POSICAO, atividadeSemanal, funil, posicoesNoBairro, precoM2, resumoCarteira
} from '../../utils/analise';
import { formatCurrencyBRL } from '../../utils/format';

const MAX_POSICOES = 10;
const COR_FAIXA = '#D6D3EE';
const COR_TINTA = '#374151';
// Divergente: acima e abaixo da faixa central com as duas cores; dentro dela, neutro.
const COR_POSICAO: Record<Posicao, string> = { acima: COR_PRINCIPAL, abaixo: COR_SECUNDARIA, central: COR_EIXO };

const eixo = { stroke: COR_GRADE, tick: { fill: COR_EIXO, fontSize: 12 }, tickLine: false };
const tooltipEstilo = { contentStyle: { borderRadius: 12, borderColor: COR_GRADE, fontSize: 12 } };
const milReais = (v: number) => `R$ ${Math.round(v / 1000).toLocaleString('pt-BR')} mil`;
const pct = (v: number) => `${Math.round(v * 100)}%`;

interface FormaPosicao {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: PosicaoNoBairro;
}

// Desenha a linha inteira: faixa central (25%-75%), mediana e o ponto da estimativa. A escala e linear,
// entao a posicao de qualquer valor sai da propria faixa desenhada pelo Recharts.
const FormaPosicao = ({ x = 0, y = 0, width = 0, height = 0, payload }: FormaPosicao) => {
  if (!payload) return null;
  const escala = (valor: number) => x + ((valor - payload.p25) / (payload.p75 - payload.p25)) * width;
  const meio = y + height / 2;
  const xPonto = escala(payload.m2);
  const xMediana = escala(payload.mediana);
  const fimDaLinha = Math.max(x + width, xPonto + 6);
  return (
    <g style={{ cursor: 'pointer' }}>
      <rect x={x} y={meio - 7} width={width} height={14} rx={4} fill={COR_FAIXA} />
      <line x1={xMediana} x2={xMediana} y1={meio - 10} y2={meio + 10} stroke={COR_TINTA} strokeWidth={2} />
      <circle cx={xPonto} cy={meio} r={6} fill={COR_POSICAO[payload.posicao]} stroke='#fff' strokeWidth={2} />
      <text x={fimDaLinha + 8} y={meio + 4} fill={COR_TINTA} fontSize={11}>{formatarPercentual(payload.diferenca)}</text>
    </g>
  );
};

const LegendaPosicao = () => (
  <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600'>
    <span className='inline-flex items-center gap-1'><span className='inline-block h-3 w-5 rounded' style={{ background: COR_FAIXA }} />Metade central dos anúncios (25% a 75%)</span>
    <span className='inline-flex items-center gap-1'><span className='inline-block h-3 w-0.5' style={{ background: COR_TINTA }} />Mediana</span>
    {(['acima', 'central', 'abaixo'] as Posicao[]).map((p) => (
      <span key={p} className='inline-flex items-center gap-1'>
        <span className='inline-block h-2.5 w-2.5 rounded-full' style={{ background: COR_POSICAO[p] }} />
        Sua estimativa {ROTULO_POSICAO[p]}
      </span>
    ))}
  </div>
);

interface Props {
  estimativas: EstimativaSalva[];
  anuncios: Anuncio[];
}

export const CarteiraSection = ({ estimativas, anuncios }: Props) => {
  const navigate = useNavigate();
  const telaPequena = useTelaPequena();
  const [hoje] = useState(() => new Date());

  const resumo = resumoCarteira(estimativas, anuncios);
  const etapas = funil(estimativas, anuncios);
  const atividade = useMemo(() => atividadeSemanal(estimativas, anuncios, hoje), [estimativas, anuncios, hoje]);
  const semAtividade = atividade.every((s) => s.estimativas + s.anuncios === 0);

  const todasPosicoes = useMemo(() => posicoesNoBairro(estimativas), [estimativas]);
  const posicoes = todasPosicoes.slice(0, MAX_POSICOES).map((p) => ({ ...p, faixa: [p.p25, p.p75] as [number, number] }));
  const semReferencia = estimativas.slice(0, MAX_POSICOES).length - posicoes.length;
  const dominio: [number, number] = posicoes.length
    ? [Math.min(...posicoes.map((p) => Math.min(p.p25, p.m2))) * 0.9, Math.max(...posicoes.map((p) => Math.max(p.p75, p.m2))) * 1.12]
    : [0, 1];

  const bairros = useMemo(() => {
    const grupos = new Map<string, EstimativaSalva[]>();
    estimativas.forEach((e) => grupos.set(e.bairroOuCep, [...(grupos.get(e.bairroOuCep) ?? []), e]));
    return [...grupos.entries()]
      .map(([bairro, lista]) => ({
        bairro,
        quantidade: lista.length,
        valorMedio: lista.reduce((s, e) => s + e.valorEstimado, 0) / lista.length,
        m2Medio: lista.reduce((s, e) => s + precoM2(e), 0) / lista.length
      }))
      .sort((a, b) => b.quantidade - a.quantidade || b.valorMedio - a.valorMedio)
      .slice(0, 5);
  }, [estimativas]);

  const larguraNomes = telaPequena ? 110 : 190;

  return (
    <section className='space-y-4'>
      <h2 className='text-lg font-semibold text-brand-900'>Sua carteira</h2>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatTile rotulo='Estimativas salvas' valor={String(resumo.estimativas)} />
        <StatTile
          rotulo='m² mediano estimado'
          valor={resumo.m2Mediano !== null ? formatCurrencyBRL(resumo.m2Mediano) : '—'}
          detalhe='Mediana do valor por m² das suas estimativas'
        />
        <StatTile
          rotulo='Faixa de preço média'
          valor={resumo.faixaMedia !== null ? `±${pct(resumo.faixaMedia)}` : '—'}
          detalhe='Quanto a faixa provável varia em torno do valor estimado'
        />
        <StatTile rotulo='Anúncios publicados' valor={`${resumo.publicados} de ${resumo.anuncios}`} />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <ChartCard
          titulo='Funil'
          descricao='Da estimativa salva ao anúncio publicado, com a conversão de cada etapa'
          arquivo='funil'
          tabela={{
            colunas: ['Etapa', 'Quantidade', 'Conversão da etapa anterior'],
            linhas: etapas.map((f) => [f.etapa, f.total, f.conversao === null ? '—' : pct(f.conversao)])
          }}
        >
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={etapas} layout='vertical' margin={{ left: 8, right: 64 }} barCategoryGap={8}>
              <CartesianGrid horizontal={false} stroke={COR_GRADE} />
              <XAxis type='number' allowDecimals={false} {...eixo} />
              <YAxis type='category' dataKey='etapa' width={telaPequena ? 110 : 130} {...eixo} axisLine={false} tick={<RotuloEixo maximo={20} />} />
              <Tooltip {...tooltipEstilo} formatter={(v) => [v, 'Quantidade']} cursor={{ fill: '#F3F4F6' }} />
              <Bar isAnimationActive={false} dataKey='total' fill={COR_PRINCIPAL} radius={[0, 4, 4, 0]} maxBarSize={28}>
                <LabelList
                  dataKey='total'
                  position='right'
                  fill={COR_TINTA}
                  fontSize={12}
                  content={(props) => {
                    const i = Number(props.index ?? 0);
                    const etapa = etapas[i];
                    const x = Number(props.x ?? 0) + Number(props.width ?? 0) + 6;
                    const y = Number(props.y ?? 0) + Number(props.height ?? 0) / 2 + 4;
                    return (
                      <text x={x} y={y} fill={COR_TINTA} fontSize={12}>
                        {etapa.total}
                        {etapa.conversao !== null ? <tspan fill={COR_EIXO}>{` · ${pct(etapa.conversao)}`}</tspan> : null}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titulo='Atividade nas últimas 8 semanas'
          descricao='Estimativas salvas e anúncios criados por semana'
          arquivo='atividade-semanal'
          tabela={{ colunas: ['Semana de', 'Estimativas', 'Anúncios'], linhas: atividade.map((s) => [s.semana, s.estimativas, s.anuncios]) }}
        >
          {semAtividade ? (
            <p className='py-8 text-center text-sm text-gray-500'>Nenhuma estimativa ou anúncio nas últimas 8 semanas.</p>
          ) : (
            <ResponsiveContainer width='100%' height={220}>
              <BarChart data={atividade} margin={{ left: -16, right: 8, top: 8 }} barGap={2} barCategoryGap='20%'>
                <CartesianGrid vertical={false} stroke={COR_GRADE} />
                <XAxis dataKey='semana' {...eixo} interval={telaPequena ? 1 : 0} />
                <YAxis allowDecimals={false} {...eixo} axisLine={false} />
                <Tooltip {...tooltipEstilo} cursor={{ fill: '#F3F4F6' }} labelFormatter={(s) => `Semana de ${s}`} />
                <Legend iconType='circle' wrapperStyle={{ fontSize: 12, color: COR_TINTA }} />
                <Bar isAnimationActive={false} dataKey='estimativas' name='Estimativas' fill={COR_PRINCIPAL} radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar isAnimationActive={false} dataKey='anuncios' name='Anúncios' fill={COR_SECUNDARIA} radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          titulo='Onde suas estimativas ficam no bairro'
          descricao='m² estimado frente aos anúncios da mesma categoria no local (últimas 10). Clique numa linha para abrir a estimativa.'
          arquivo='estimativas-no-bairro'
          className='lg:col-span-2'
          tabela={{
            colunas: ['Estimativa', 'Comparada com', 'm² estimado', '25%', 'Mediana', '75%', 'Diferença para a mediana', 'Posição'],
            linhas: posicoes.map((p) => [
              p.rotulo, p.local, formatCurrencyBRL(p.m2), formatCurrencyBRL(p.p25), formatCurrencyBRL(p.mediana),
              formatCurrencyBRL(p.p75), formatarPercentual(p.diferenca), ROTULO_POSICAO[p.posicao]
            ])
          }}
        >
          {posicoes.length ? (
            <div className='space-y-3'>
              <LegendaPosicao />
              <ResponsiveContainer width='100%' height={posicoes.length * 36 + 36}>
                <BarChart data={posicoes} layout='vertical' margin={{ left: 8, right: 56 }} barCategoryGap={4}>
                  <CartesianGrid horizontal={false} stroke={COR_GRADE} />
                  <XAxis type='number' domain={dominio} tickFormatter={milReais} {...eixo} />
                  <YAxis
                    type='category'
                    dataKey='rotulo'
                    width={larguraNomes}
                    {...eixo}
                    axisLine={false}
                    interval={0}
                    tick={<RotuloEixo maximo={telaPequena ? 15 : 32} formatar={telaPequena ? (r) => r.split(' · ')[0] : undefined} />}
                  />
                  <Tooltip
                    {...tooltipEstilo}
                    cursor={{ fill: '#F3F4F6' }}
                    content={({ active, payload }) => {
                      const p = active ? (payload?.[0]?.payload as PosicaoNoBairro | undefined) : undefined;
                      if (!p) return null;
                      return (
                        <div className='rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-soft'>
                          <p className='font-semibold text-brand-900'>{p.rotulo}</p>
                          <p>m² estimado: {formatCurrencyBRL(p.m2)} ({formatarPercentual(p.diferenca)} da mediana)</p>
                          <p>Anúncios em {p.local}: {formatCurrencyBRL(p.p25)} a {formatCurrencyBRL(p.p75)}, mediana {formatCurrencyBRL(p.mediana)}</p>
                          <p className='mt-1 font-medium'>Fica {ROTULO_POSICAO[p.posicao]}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    isAnimationActive={false}
                    dataKey='faixa'
                    fill={COR_FAIXA}
                    shape={(props: FormaPosicao) => <FormaPosicao {...props} />}
                    onClick={(_, indice) => navigate(`/estimativas/${posicoes[indice].id}`)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className='py-8 text-center text-sm text-gray-500'>
              {estimativas.length ? 'Suas estimativas ainda não têm referência de mercado. Salve uma nova para comparar com o bairro.' : 'Salve estimativas para comparar com o mercado.'}
            </p>
          )}
          {posicoes.length && semReferencia > 0 ? (
            <p className='mt-2 text-xs text-gray-500'>
              {semReferencia === 1 ? '1 estimativa antiga não tem' : `${semReferencia} estimativas antigas não têm`} referência gravada e fica de fora.
            </p>
          ) : null}
        </ChartCard>

        <Card className='break-inside-avoid lg:col-span-2'>
          <h3 className='text-sm font-semibold text-brand-900'>Bairros mais estimados</h3>
          {bairros.length ? (
            <div className='overflow-x-auto'>
              <table className='mt-3 w-full text-left text-sm'>
                <thead className='text-xs text-gray-500'>
                  <tr><th className='py-1 font-medium'>Bairro</th><th className='py-1 font-medium'>Estimativas</th><th className='py-1 font-medium'>Valor médio</th><th className='py-1 font-medium'>m² médio</th></tr>
                </thead>
                <tbody className='tabular-nums text-brand-900'>
                  {bairros.map((b) => (
                    <tr key={b.bairro} className='border-t border-surface-100'>
                      <td className='py-2'>
                        <Link to='/mapa' state={{ bairro: b.bairro }} className='hover:underline'>{b.bairro}</Link>
                      </td>
                      <td className='py-2'>{b.quantidade}</td>
                      <td className='py-2'>{formatCurrencyBRL(b.valorMedio)}</td>
                      <td className='py-2'>{formatCurrencyBRL(b.m2Medio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className='mt-3 text-sm text-gray-500'>Nenhuma estimativa salva ainda.</p>
          )}
        </Card>
      </div>
    </section>
  );
};
