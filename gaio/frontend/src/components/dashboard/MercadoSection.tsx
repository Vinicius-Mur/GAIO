import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, LabelProps, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Card } from '../common/Card';
import { ChartCard } from './ChartCard';
import { RotuloEixo } from './RotuloEixo';
import {
  COR_EIXO, COR_GRADE, COR_PRINCIPAL, COR_REFERENCIA, COR_SECUNDARIA, DOMINIO_DIVERGENTE, NOME_ZONA, formatarMilhar, formatarPercentual, nomeAmenidade
} from '../../constants/graficos';
import { useTelaPequena } from '../../hooks/useTelaPequena';
import { BairroPreco, CategoriaMercado, MercadoResumo, Zona } from '../../types';
import { distribuicaoFiltrada, premiosFiltrados, rankingBairros } from '../../utils/analise';
import { formatCurrencyBRL } from '../../utils/format';

const COR_TINTA = '#374151';
const ZONAS: Zona[] = ['CENTRO', 'NORTE', 'SUL', 'LESTE', 'OESTE'];
const CATEGORIAS: CategoriaMercado[] = ['Apartamentos', 'Casas'];
const TIPO_PREDOMINANTE = 'Padrão';

const eixo = { stroke: COR_GRADE, tick: { fill: COR_EIXO, fontSize: 12 }, tickLine: false };
const tooltipEstilo = { contentStyle: { borderRadius: 12, borderColor: COR_GRADE, fontSize: 12 } };
const cursor = { fill: '#F3F4F6' };
const reais = (v: unknown) => formatCurrencyBRL(Number(v));
const milReais = (v: number) => `R$ ${formatarMilhar(v / 1000)} mil`;
const parcela = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

// Rotulo em uma linha so: o LabelList padrao quebra o texto na largura da barra.
const rotuloNoTopo = (props: LabelProps) => {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const largura = Number(props.width ?? 0);
  if (!props.value) return null;
  return (
    <text x={x + largura / 2} y={y - 6} textAnchor='middle' fill={COR_TINTA} fontSize={11}>
      {`${formatarMilhar(Number(props.value) / 1000)} mil`}
    </text>
  );
};

const nomeDoRecorte = (categoria: CategoriaMercado, zona: Zona | null) =>
  `${categoria === 'Casas' ? 'casas' : 'apartamentos'} ${zona ? (zona === 'CENTRO' ? 'no Centro' : `na ${NOME_ZONA[zona]}`) : 'na cidade toda'}`;

const Ranking = ({ titulo, descricao, arquivo, dados, telaPequena, onAbrir }: {
  titulo: string;
  descricao: string;
  arquivo: string;
  dados: BairroPreco[];
  telaPequena: boolean;
  onAbrir: (bairro: string) => void;
}) => (
  <ChartCard
    titulo={titulo}
    descricao={descricao}
    arquivo={arquivo}
    tabela={{
      colunas: ['Bairro', 'Zona', 'm² mediano', '25%', '75%', 'Anúncios da categoria'],
      linhas: dados.map((b) => [b.bairro, NOME_ZONA[b.zona], formatCurrencyBRL(b.precoM2), formatCurrencyBRL(b.precoM2P25), formatCurrencyBRL(b.precoM2P75), b.anuncios])
    }}
  >
    <ResponsiveContainer width='100%' height={dados.length * 30 + 30}>
      <BarChart data={dados} layout='vertical' margin={{ left: 8, right: 72 }} barCategoryGap={6}>
        <CartesianGrid horizontal={false} stroke={COR_GRADE} />
        <XAxis type='number' tickFormatter={milReais} {...eixo} />
        <YAxis
          type='category'
          dataKey='bairro'
          width={telaPequena ? 110 : 190}
          {...eixo}
          axisLine={false}
          interval={0}
          tick={<RotuloEixo maximo={telaPequena ? 14 : 30} />}
        />
        <Tooltip
          {...tooltipEstilo}
          cursor={cursor}
          content={({ active, payload }) => {
            const b = active ? (payload?.[0]?.payload as BairroPreco | undefined) : undefined;
            if (!b) return null;
            return (
              <div className='rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-soft'>
                <p className='font-semibold text-brand-900'>{b.bairro} · {NOME_ZONA[b.zona]}</p>
                <p>m² mediano: {formatCurrencyBRL(b.precoM2)}</p>
                <p>Metade central: {formatCurrencyBRL(b.precoM2P25)} a {formatCurrencyBRL(b.precoM2P75)}</p>
                <p>{b.anuncios} anúncios da categoria</p>
                <p className='mt-1 text-gray-500'>Clique para ver no mapa</p>
              </div>
            );
          }}
        />
        <Bar isAnimationActive={false} dataKey='precoM2' fill={COR_PRINCIPAL} radius={[0, 4, 4, 0]} maxBarSize={20} style={{ cursor: 'pointer' }} onClick={(_, i) => onAbrir(dados[i].bairro)}>
          <LabelList dataKey='precoM2' position='right' formatter={(v) => milReais(Number(v))} fill={COR_TINTA} fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
);

interface Props {
  resumo: MercadoResumo;
  categoriaInicial: CategoriaMercado;
  zonaInicial: Zona | null;
}

export const MercadoSection = ({ resumo, categoriaInicial, zonaInicial }: Props) => {
  const navigate = useNavigate();
  const telaPequena = useTelaPequena();
  const [categoria, setCategoria] = useState<CategoriaMercado>(categoriaInicial);
  const [zona, setZona] = useState<Zona | null>(zonaInicial);
  const abrirNoMapa = (bairro: string) => navigate('/mapa', { state: { bairro } });

  const zonas = resumo.zonas.map((z) => ({
    zona: NOME_ZONA[z.zona],
    Apartamentos: z.precoM2PorCategoria.Apartamentos ?? null,
    Casas: z.precoM2PorCategoria.Casas ?? null,
    anuncios: z.anuncios
  }));

  const ranking = rankingBairros(resumo.bairros, categoria, zona);
  const recorte = nomeDoRecorte(categoria, zona);
  const notaRanking = `Só bairros com pelo menos ${resumo.minimoAnunciosRanking} anúncios de ${categoria.toLowerCase()}.`;

  const premios = premiosFiltrados(resumo, categoria, zona).map((p) => ({ amenidade: nomeAmenidade(p.amenidade), premio: p.premio }));

  const distribuicao = distribuicaoFiltrada(resumo, categoria, zona);
  const totalTipos = distribuicao.anuncios || 1;
  const predominante = distribuicao.tipos[TIPO_PREDOMINANTE] ?? 0;
  const outrosTipos = Object.entries(distribuicao.tipos)
    .filter(([tipo]) => tipo !== TIPO_PREDOMINANTE)
    .map(([tipo, total]) => ({ tipo, total, parcela: total / totalTipos }))
    .sort((a, b) => b.total - a.total);
  const quartos = Object.entries(distribuicao.quartos)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([q, total]) => ({ quartos: q === '0' ? 'Studio' : q === '5' ? '5+' : q, total, parcela: total / totalTipos }));

  const botaoFiltro = (ativo: boolean) =>
    `focus-ring rounded-lg px-3 py-1.5 text-sm font-medium ${ativo ? 'bg-brand-900 text-white' : 'text-brand-900 hover:bg-surface-100'}`;

  return (
    <section className='space-y-4'>
      <div>
        <h2 className='text-lg font-semibold text-brand-900'>Panorama do mercado de São Paulo</h2>
        <p className='text-sm text-gray-600'>
          Base de {formatarMilhar(resumo.totalAnuncios)} anúncios de imóveis à venda na capital, usada no treino do modelo. Valores de m² são medianas do preço pedido,
          não do preço de fechamento. A base não traz a data dos anúncios.
        </p>
      </div>

      <Card className='flex flex-wrap items-center gap-x-6 gap-y-3 break-inside-avoid'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold uppercase tracking-wide text-brand-800'>Categoria</span>
          <div className='flex rounded-xl bg-surface-100 p-1 print:hidden' role='group' aria-label='Categoria'>
            {CATEGORIAS.map((c) => (
              <button key={c} type='button' aria-pressed={categoria === c} className={botaoFiltro(categoria === c)} onClick={() => setCategoria(c)}>{c}</button>
            ))}
          </div>
          <span className='hidden text-sm text-brand-900 print:inline'>{categoria}</span>
        </div>
        <label className='flex items-center gap-2'>
          <span className='text-xs font-semibold uppercase tracking-wide text-brand-800'>Zona</span>
          <select
            value={zona ?? ''}
            onChange={(e) => setZona((e.target.value || null) as Zona | null)}
            className='focus-ring rounded-xl border border-surface-100 bg-surface-100 px-3 py-2 text-sm text-brand-900 print:hidden'
          >
            <option value=''>Cidade toda</option>
            {ZONAS.map((z) => <option key={z} value={z}>{NOME_ZONA[z]}</option>)}
          </select>
          <span className='hidden text-sm text-brand-900 print:inline'>{zona ? NOME_ZONA[zona] : 'Cidade toda'}</span>
        </label>
        <p className='text-xs text-gray-500'>O filtro vale para os rankings, as amenidades, os tipos e os quartos.</p>
      </Card>

      <div className='grid gap-4 lg:grid-cols-2'>
        <ChartCard
          titulo='m² mediano por zona'
          descricao='Apartamentos e casas, ordenado pela zona mais cara'
          arquivo='m2-por-zona'
          className='lg:col-span-2'
          tabela={{
            colunas: ['Zona', 'Apartamentos (m²)', 'Casas (m²)', 'Anúncios'],
            linhas: zonas.map((z) => [z.zona, z.Apartamentos ? formatCurrencyBRL(z.Apartamentos) : '—', z.Casas ? formatCurrencyBRL(z.Casas) : '—', z.anuncios])
          }}
        >
          <ResponsiveContainer width='100%' height={260}>
            <BarChart data={zonas} margin={{ left: 8, right: 8, top: 20 }} barGap={2} barCategoryGap='24%'>
              <CartesianGrid vertical={false} stroke={COR_GRADE} />
              <XAxis dataKey='zona' {...eixo} tickFormatter={(z: string) => (telaPequena ? z.replace('Zona ', '') : z)} />
              <YAxis tickFormatter={milReais} width={telaPequena ? 64 : 84} {...eixo} axisLine={false} />
              <Tooltip {...tooltipEstilo} formatter={(v, nome) => [reais(v), `${nome} (m²)`]} cursor={cursor} />
              <Legend iconType='circle' wrapperStyle={{ fontSize: 12, color: COR_TINTA }} />
              <Bar isAnimationActive={false} dataKey='Apartamentos' fill={COR_PRINCIPAL} radius={[4, 4, 0, 0]} maxBarSize={36}>
                <LabelList dataKey='Apartamentos' content={rotuloNoTopo} />
              </Bar>
              <Bar isAnimationActive={false} dataKey='Casas' fill={COR_SECUNDARIA} radius={[4, 4, 0, 0]} maxBarSize={36}>
                <LabelList dataKey='Casas' content={rotuloNoTopo} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {ranking.total === 0 ? (
          <Card className='lg:col-span-2'>
            <p className='text-sm text-gray-500'>Nenhum bairro com {resumo.minimoAnunciosRanking} anúncios ou mais de {recorte}.</p>
          </Card>
        ) : ranking.total <= ranking.caros.length ? (
          <div className='lg:col-span-2'>
            <Ranking
              titulo='Bairros por m²'
              descricao={`Os ${ranking.total} bairros com amostra suficiente de ${recorte}. ${notaRanking} Clique para ver no mapa.`}
              arquivo={`bairros-${categoria.toLowerCase()}-${(zona ?? 'cidade').toLowerCase()}`}
              dados={ranking.caros}
              telaPequena={telaPequena}
              onAbrir={abrirNoMapa}
            />
          </div>
        ) : (
          <>
            <Ranking
              titulo='Bairros mais caros'
              descricao={`Top ${ranking.caros.length} de ${recorte} por m² mediano. ${notaRanking}`}
              arquivo={`bairros-mais-caros-${categoria.toLowerCase()}-${(zona ?? 'cidade').toLowerCase()}`}
              dados={ranking.caros}
              telaPequena={telaPequena}
              onAbrir={abrirNoMapa}
            />
            <Ranking
              titulo='Bairros mais baratos'
              descricao={`Os ${ranking.baratos.length} de menor m² mediano entre ${ranking.total} bairros. ${notaRanking}`}
              arquivo={`bairros-mais-baratos-${categoria.toLowerCase()}-${(zona ?? 'cidade').toLowerCase()}`}
              dados={ranking.baratos}
              telaPequena={telaPequena}
              onAbrir={abrirNoMapa}
            />
          </>
        )}

        <ChartCard
          titulo='Amenidades e preço do m²'
          descricao={`Diferença no m² mediano entre ${recorte} com e sem cada item. Associação, não causa: itens costumam vir juntos em imóveis de padrão mais alto.`}
          arquivo={`amenidades-${categoria.toLowerCase()}-${(zona ?? 'cidade').toLowerCase()}`}
          className='lg:col-span-2'
          tabela={{ colunas: ['Amenidade', 'Diferença no m²'], linhas: premios.map((p) => [p.amenidade, formatarPercentual(p.premio, 1)]) }}
        >
          {premios.length ? (
            <ResponsiveContainer width='100%' height={premios.length * 30 + 30}>
              <BarChart data={premios} layout='vertical' margin={{ left: 8, right: 56 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={COR_GRADE} />
                <XAxis type='number' domain={DOMINIO_DIVERGENTE} tickFormatter={(v: number) => formatarPercentual(v)} {...eixo} />
                <YAxis type='category' dataKey='amenidade' width={telaPequena ? 100 : 140} {...eixo} axisLine={false} interval={0} tick={<RotuloEixo maximo={telaPequena ? 13 : 22} />} />
                <ReferenceLine x={0} stroke={COR_REFERENCIA} />
                <Tooltip {...tooltipEstilo} formatter={(v) => [formatarPercentual(Number(v), 1), 'Diferença no m²']} cursor={cursor} />
                <Bar isAnimationActive={false} dataKey='premio' radius={4} maxBarSize={20}>
                  {premios.map((p) => <Cell key={p.amenidade} fill={p.premio >= 0 ? COR_PRINCIPAL : COR_SECUNDARIA} />)}
                  <LabelList dataKey='premio' position='right' formatter={(v) => formatarPercentual(Number(v))} fill={COR_TINTA} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className='py-8 text-center text-sm text-gray-500'>Sem anúncios suficientes de {recorte} para comparar.</p>
          )}
        </ChartCard>

        <ChartCard
          titulo='Tipos de imóvel'
          descricao={`${parcela(predominante / totalTipos)} de ${recorte} são do tipo ${TIPO_PREDOMINANTE.toLowerCase()}. O gráfico mostra os demais tipos.`}
          arquivo={`tipos-${categoria.toLowerCase()}-${(zona ?? 'cidade').toLowerCase()}`}
          tabela={{
            colunas: ['Tipo', 'Anúncios', 'Parcela'],
            linhas: [[TIPO_PREDOMINANTE, predominante, parcela(predominante / totalTipos)], ...outrosTipos.map((t) => [t.tipo, t.total, parcela(t.parcela)])]
          }}
        >
          {outrosTipos.length ? (
            <ResponsiveContainer width='100%' height={outrosTipos.length * 30 + 30}>
              <BarChart data={outrosTipos} layout='vertical' margin={{ left: 8, right: 56 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={COR_GRADE} />
                <XAxis type='number' allowDecimals={false} tickFormatter={formatarMilhar} {...eixo} />
                <YAxis type='category' dataKey='tipo' width={telaPequena ? 100 : 130} {...eixo} axisLine={false} interval={0} tick={<RotuloEixo maximo={telaPequena ? 13 : 20} />} />
                <Tooltip {...tooltipEstilo} formatter={(v) => [formatarMilhar(Number(v)), 'Anúncios']} cursor={cursor} />
                <Bar isAnimationActive={false} dataKey='total' fill={COR_PRINCIPAL} radius={[0, 4, 4, 0]} maxBarSize={20}>
                  <LabelList dataKey='parcela' position='right' formatter={(v) => parcela(Number(v))} fill={COR_TINTA} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className='py-8 text-center text-sm text-gray-500'>Todos os anúncios de {recorte} são do tipo padrão.</p>
          )}
        </ChartCard>

        <ChartCard
          titulo='Quartos'
          descricao={`Distribuição de ${recorte} pelo número de quartos (${formatarMilhar(distribuicao.anuncios)} anúncios)`}
          arquivo={`quartos-${categoria.toLowerCase()}-${(zona ?? 'cidade').toLowerCase()}`}
          tabela={{ colunas: ['Quartos', 'Anúncios', 'Parcela'], linhas: quartos.map((q) => [q.quartos, q.total, parcela(q.parcela)]) }}
        >
          <ResponsiveContainer width='100%' height={240}>
            <BarChart data={quartos} margin={{ left: 0, right: 8, top: 20 }} barCategoryGap='20%'>
              <CartesianGrid vertical={false} stroke={COR_GRADE} />
              <XAxis dataKey='quartos' {...eixo} />
              <YAxis tickFormatter={formatarMilhar} width={56} {...eixo} axisLine={false} />
              <Tooltip {...tooltipEstilo} formatter={(v) => [formatarMilhar(Number(v)), 'Anúncios']} cursor={cursor} />
              <Bar isAnimationActive={false} dataKey='total' fill={COR_PRINCIPAL} radius={[4, 4, 0, 0]} maxBarSize={48}>
                <LabelList dataKey='parcela' position='top' formatter={(v) => `${Math.round(Number(v) * 100)}%`} fill={COR_TINTA} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
};
