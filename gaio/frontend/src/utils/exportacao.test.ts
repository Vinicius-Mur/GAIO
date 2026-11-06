import { describe, expect, it } from 'vitest';
import { formatarPercentual } from '../constants/graficos';
import { montarCsv } from './exportacao';

describe('montarCsv', () => {
  it('gera o formato que o Excel em português abre direto', () => {
    const csv = montarCsv(['Bairro', 'Valor', 'Insights'], [
      ['Pinheiros', 1234.5, 'm² "acima"; ver detalhes'],
      ['Moema', null, undefined]
    ]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Bairro;Valor;Insights',
      'Pinheiros;1234,5;"m² ""acima""; ver detalhes"',
      'Moema;;'
    ]);
  });

  it('não agrupa milhares, para o Excel ler como número', () => {
    expect(montarCsv(['v'], [[1250000]]).endsWith('1250000')).toBe(true);
  });
});

describe('formatarPercentual', () => {
  it('mostra o sinal e não exibe "-0%"', () => {
    expect(formatarPercentual(0.123)).toBe('+12%');
    expect(formatarPercentual(-0.2)).toBe('-20%');
    expect(formatarPercentual(-0.003)).toBe('0%');
    expect(formatarPercentual(0.1234, 1)).toBe('+12,3%');
  });
});
