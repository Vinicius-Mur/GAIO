import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { anuncio, estimativa, resumoMercado } from '../test/fabricas';
import { DashboardPage } from './DashboardPage';

const servicos = vi.hoisted(() => ({
  listarAnuncios: vi.fn(),
  listarEstimativas: vi.fn(),
  resumo: vi.fn()
}));

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { nome: 'Ana' } }) }));
vi.mock('../services/anuncioService', () => ({ anuncioService: { list: servicos.listarAnuncios } }));
vi.mock('../services/estimativaService', () => ({ estimativaService: { listar: servicos.listarEstimativas } }));
vi.mock('../services/mercadoService', () => ({ mercadoService: { resumo: servicos.resumo, bairro: vi.fn() } }));

const renderizar = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>);

describe('DashboardPage', () => {
  beforeEach(() => {
    servicos.listarAnuncios.mockResolvedValue([anuncio({ status: 'COMPLETO', publicado: true })]);
    servicos.listarEstimativas.mockResolvedValue([
      estimativa({ valorEstimado: 1_300_000, categoria: 'CASAS', zona: 'OESTE' }),
      estimativa({ id: 2, categoria: 'CASAS', zona: 'OESTE' }),
      estimativa({ id: 3, referenciaMercado: null })
    ]);
    servicos.resumo.mockResolvedValue(resumoMercado());
  });

  it('mostra a carteira com faixa de preço em vez de soma de valores', async () => {
    renderizar();
    expect(await screen.findByText('Sua carteira')).toBeInTheDocument();
    expect(screen.getByText('Faixa de preço média')).toBeInTheDocument();
    expect(screen.getByText('±18%')).toBeInTheDocument();
    expect(screen.getByText('1 de 1')).toBeInTheDocument();
    expect(screen.queryByText(/valor total estimado/i)).not.toBeInTheDocument();
    expect(screen.getByText(/1 estimativa antiga não tem referência/)).toBeInTheDocument();
  });

  it('começa o panorama no recorte que o usuário mais estima e deixa trocar', async () => {
    renderizar();
    expect(await screen.findByText('Panorama do mercado de São Paulo')).toBeInTheDocument();

    const filtros = screen.getByRole('group', { name: 'Categoria' });
    expect(within(filtros).getByRole('button', { name: 'Casas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox')).toHaveValue('OESTE');

    await userEvent.click(within(filtros).getByRole('button', { name: 'Apartamentos' }));
    await userEvent.selectOptions(screen.getByRole('combobox'), '');

    expect(screen.getByText(/Os 3 bairros com amostra suficiente de apartamentos na cidade toda/)).toBeInTheDocument();
    expect(screen.getByText(/93,5% de apartamentos na cidade toda são do tipo padrão/)).toBeInTheDocument();
  });

  it('explica a cobertura igual nos três cenários do modelo', async () => {
    renderizar();
    expect(await screen.findByText(/a faixa é calibrada para cobrir 80% dos casos/)).toBeInTheDocument();
  });

  it('avisa quando o panorama está indisponível sem derrubar a carteira', async () => {
    servicos.resumo.mockRejectedValue({ message: 'Serviço de ML indisponível' });
    renderizar();
    expect(await screen.findByText('Panorama do mercado indisponível')).toBeInTheDocument();
    expect(screen.getByText('Sua carteira')).toBeInTheDocument();
  });

  it('mostra o estado vazio para conta nova', async () => {
    servicos.listarAnuncios.mockResolvedValue([]);
    servicos.listarEstimativas.mockResolvedValue([]);
    renderizar();
    expect(await screen.findByText('Sua carteira ainda está vazia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /estimativas \(csv\)/i })).toBeDisabled();
  });
});
