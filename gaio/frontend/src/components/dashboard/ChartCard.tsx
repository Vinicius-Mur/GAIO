import { ReactNode, useRef, useState } from 'react';
import { Download, FileDown, Table2 } from 'lucide-react';
import { Card } from '../common/Card';
import { baixarCsv, baixarPng, dataDoArquivo } from '../../utils/exportacao';

interface ChartCardProps {
  titulo: string;
  descricao?: string;
  arquivo: string;
  tabela: { colunas: string[]; linhas: (string | number)[][] };
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Todo grafico traz a tabela com os mesmos dados: o tooltip ajuda, mas nunca e o unico jeito de ler um valor.
export const ChartCard = ({ titulo, descricao, arquivo, tabela, acoes, children, className }: ChartCardProps) => {
  const graficoRef = useRef<HTMLDivElement>(null);
  const [verTabela, setVerTabela] = useState(false);

  return (
    <Card className={`flex flex-col gap-3 break-inside-avoid ${className ?? ''}`}>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <h3 className='text-sm font-semibold text-brand-900'>{titulo}</h3>
          {descricao ? <p className='mt-0.5 text-xs text-gray-500'>{descricao}</p> : null}
        </div>
        <div className='flex flex-wrap items-center gap-1 print:hidden'>
          {acoes}
          <button
            type='button'
            onClick={() => setVerTabela((v) => !v)}
            aria-pressed={verTabela}
            className='focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-900 hover:bg-surface-100'
          >
            <Table2 size={14} />
            {verTabela ? 'Ver gráfico' : 'Ver dados'}
          </button>
          <button
            type='button'
            onClick={() => baixarCsv(`gaio-${arquivo}-${dataDoArquivo()}.csv`, tabela.colunas, tabela.linhas)}
            disabled={!tabela.linhas.length}
            className='focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-900 hover:bg-surface-100 disabled:text-gray-300'
            title='Baixar os dados do gráfico em CSV'
          >
            <FileDown size={14} />
            CSV
          </button>
          <button
            type='button'
            onClick={() => graficoRef.current && void baixarPng(graficoRef.current, `gaio-${arquivo}.png`)}
            disabled={verTabela}
            className='focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-900 hover:bg-surface-100 disabled:text-gray-300'
            title='Baixar o gráfico como imagem'
          >
            <Download size={14} />
            PNG
          </button>
        </div>
      </div>
      {verTabela ? (
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='text-gray-500'>
              <tr>{tabela.colunas.map((c) => <th key={c} className='px-2 py-1 font-medium'>{c}</th>)}</tr>
            </thead>
            <tbody className='tabular-nums text-brand-900'>
              {tabela.linhas.map((linha, i) => (
                <tr key={i} className='border-t border-surface-100'>
                  {linha.map((valor, j) => <td key={j} className='px-2 py-1'>{valor}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={graficoRef}>{children}</div>
      )}
    </Card>
  );
};
