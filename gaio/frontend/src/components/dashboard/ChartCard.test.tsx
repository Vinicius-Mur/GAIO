import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ChartCard } from './ChartCard';

const tabela = { colunas: ['Etapa', 'Quantidade'], linhas: [['Salvas', 4], ['Publicadas', 1]] as (string | number)[][] };

describe('ChartCard', () => {
  it('alterna entre o gráfico e a tabela com os mesmos dados', async () => {
    render(<ChartCard titulo='Funil' arquivo='funil' tabela={tabela}><div>grafico</div></ChartCard>);
    expect(screen.getByText('grafico')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ver dados/i }));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Publicadas' })).toBeInTheDocument();
    expect(screen.queryByText('grafico')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /png/i })).toBeDisabled();
  });

  it('desabilita o CSV quando não há dados', () => {
    render(<ChartCard titulo='Vazio' arquivo='vazio' tabela={{ colunas: ['a'], linhas: [] }}><div /></ChartCard>);
    expect(screen.getByRole('button', { name: /csv/i })).toBeDisabled();
  });
});
