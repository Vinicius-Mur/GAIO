import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../common/Card';
import { ChartCard } from './ChartCard';
import { RotuloEixo } from './RotuloEixo';
import { COR_EIXO, COR_GRADE, COR_PRINCIPAL, NOME_CENARIO, NOME_VARIAVEL } from '../../constants/graficos';
import { MercadoResumo } from '../../types';

const MAX_VARIAVEIS = 12;
const pct = (v: number, casas = 0) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: casas })}%`;

export const ModeloSection = ({ modelo }: { modelo: MercadoResumo['modelo'] }) => {
  const total = modelo.importancias.reduce((s, i) => s + i.peso, 0) || 1;
  const importancias = modelo.importancias
    .slice(0, MAX_VARIAVEIS)
    .map((i) => ({ variavel: NOME_VARIAVEL[i.variavel] ?? i.variavel, peso: i.peso / total }));

  return (
    <section className='space-y-4'>
      <div>
        <h2 className='text-lg font-semibold text-brand-900'>Como o modelo se sai</h2>
        <p className='text-sm text-gray-600'>
          Validação cruzada em anúncios que o modelo não viu no treino. O cenário depende de quanto da localização foi reconhecido.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        {modelo.cenarios.map((c) => (
          <Card key={c.cenario} className='break-inside-avoid'>
            <p className='text-xs uppercase tracking-wide2 text-gray-500'>{NOME_CENARIO[c.cenario] ?? c.cenario}</p>
            <p className='mt-2 text-3xl font-semibold text-brand-900'>{pct(c.erroMediano)}</p>
            <p className='text-xs text-gray-500'>erro mediano do preço</p>
            <dl className='mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600'>
              <div><dt className='text-gray-500'>Erro médio (MAPE)</dt><dd className='font-semibold text-brand-900'>{pct(c.mape)}</dd></div>
              <div><dt className='text-gray-500'>Preço real na faixa</dt><dd className='font-semibold text-brand-900'>{pct(c.cobertura)}</dd></div>
              <div className='col-span-2'><dt className='text-gray-500'>Largura média da faixa</dt><dd className='font-semibold text-brand-900'>±{pct(c.meiaLargura)} do valor</dd></div>
            </dl>
          </Card>
        ))}
      </div>
      <p className='text-xs text-gray-500'>
        Os 80% de preços reais dentro da faixa se repetem nos três cenários de propósito: a faixa é calibrada para cobrir 80% dos casos.
        O que muda entre os cenários é a largura dela, que cresce quando o modelo sabe menos sobre a localização.
      </p>

      <ChartCard
        titulo='O que mais pesa no preço'
        descricao={`Importância relativa das ${importancias.length} variáveis mais usadas pelo modelo`}
        arquivo='importancia-variaveis'
        tabela={{ colunas: ['Variável', 'Peso'], linhas: importancias.map((i) => [i.variavel, pct(i.peso, 1)]) }}
      >
        <ResponsiveContainer width='100%' height={importancias.length * 28 + 30}>
          <BarChart data={importancias} layout='vertical' margin={{ left: 8, right: 48 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke={COR_GRADE} />
            <XAxis type='number' tickFormatter={(v: number) => pct(v)} stroke={COR_GRADE} tick={{ fill: COR_EIXO, fontSize: 12 }} tickLine={false} />
            <YAxis type='category' dataKey='variavel' width={130} stroke={COR_GRADE} tickLine={false} axisLine={false} interval={0} tick={<RotuloEixo maximo={20} />} />
            <Tooltip contentStyle={{ borderRadius: 12, borderColor: COR_GRADE, fontSize: 12 }} formatter={(v) => [pct(Number(v), 1), 'Peso']} cursor={{ fill: '#F3F4F6' }} />
            <Bar isAnimationActive={false} dataKey='peso' fill={COR_PRINCIPAL} radius={[0, 4, 4, 0]} maxBarSize={18}>
              <LabelList dataKey='peso' position='right' formatter={(v) => pct(Number(v), 1)} fill='#374151' fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
};
