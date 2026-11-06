import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AddressAutocomplete } from '../components/domain/AddressAutocomplete';
import { PriceRange } from '../components/domain/PriceRange';
import { PropertyCard } from '../components/domain/PropertyCard';
import { EstimateCard } from '../components/domain/EstimateCard';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { PageHeader } from '../components/layout/PageHeader';
import { AMENIDADES, CATEGORIAS, TIPOS_IMOVEL, montarAmenidades } from '../constants/imovel';
import { estimativaService } from '../services/estimativaService';
import { AmenidadeKey, EnderecoEscolhido, EstimativaRequest, EstimativaResponse, LocalEstimateUiState, TipoImovel } from '../types';
import { getErrorMessage } from '../utils/error';
import { localEstimateStorage, pendingEstimateStorage } from '../utils/storage';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const optionsSimple = ['1', '2', '3', '4', '5+'];
const garagemOptions = ['0', '1', '2', '3', '4', '5+'];

const parseNumericOption = (value: string): number => (value.includes('+') ? 5 : Number(value));

// Limite aceito pela API (EstimativaRequest.areaM2).
const AREA_MAXIMA = 5000;

// O modelo foi treinado so com imoveis da cidade de Sao Paulo.
const ehCidadeDeSaoPaulo = (cidade: string | null) =>
  (cidade ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() === 'sao paulo';

// Aceita "850", "R$ 850", "1.250,50" e vazio (= sem condominio).
const parseCondominio = (value: string): number | null => {
  const limpo = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  if (!limpo) return 0;
  const numero = Number(limpo);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
};

interface Caracteristicas {
  areaM2: number;
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
}

export const NovaEstimativaPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  // Endereco vindo do mapa ("Calcular estimativa aqui"), quando houver.
  const vindoDoMapa = (useLocation().state as EnderecoEscolhido | null) ?? null;
  const [enderecoTexto, setEnderecoTexto] = useState(vindoDoMapa?.endereco ?? '');
  const [bairroSelecionado, setBairroSelecionado] = useState<string | null>(vindoDoMapa?.bairro ?? null);
  const [logradouro, setLogradouro] = useState<string | null>(vindoDoMapa?.logradouro ?? null);
  const [enderecoCompleto, setEnderecoCompleto] = useState(vindoDoMapa?.endereco ?? '');
  const resultadoRef = useRef<HTMLDivElement>(null);
  const [cidadeForaDoEscopo, setCidadeForaDoEscopo] = useState<string | null>(null);
  const [caracteristicas, setCaracteristicas] = useState<Caracteristicas>({
    areaM2: 105,
    quartos: 3,
    banheiros: 2,
    vagasGaragem: 2
  });
  const [uiState, setUiState] = useState<LocalEstimateUiState>({
    categoria: 'APARTAMENTOS',
    tipo: 'PADRAO',
    condominioMensal: '',
    comodidades: ['elevador', 'piscina']
  });

  const [result, setResult] = useState<EstimativaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedEstimativaId, setSavedEstimativaId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ endereco?: string; condominio?: string; area?: string }>({});

  // Leva a tela ate o resultado (ou ao aviso de carregamento): ele aparece abaixo do formulario.
  useEffect(() => {
    if (loading || result) resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, result]);

  useEffect(() => {
    const pending = pendingEstimateStorage.get();
    if (!pending) return;
    if (!pending.result?.parametros) {
      // Pendencia gravada pela versao anterior da tela, sem os campos atuais da API.
      pendingEstimateStorage.clear();
      return;
    }

    const { request } = pending;
    setEnderecoTexto(request.bairroOuCep);
    setBairroSelecionado(request.bairroOuCep);
    setCaracteristicas({
      areaM2: request.areaM2,
      quartos: request.quartos,
      banheiros: request.banheiros,
      vagasGaragem: request.vagasGaragem
    });
    setUiState(pending.uiState);
    setResult(pending.result);
    pendingEstimateStorage.clear();
    showToast({
      type: 'info',
      title: 'Dados restaurados',
      description: 'Recuperamos sua estimativa para você continuar de onde parou.'
    });
  }, []);

  const canSubmit = useMemo(() => enderecoTexto.trim().length >= 3 && caracteristicas.areaM2 > 0, [enderecoTexto, caracteristicas]);

  const montarRequest = (condominio: number): EstimativaRequest => ({
    // O modelo reconhece o bairro; o endereco completo da sugestao comeca pela rua.
    bairroOuCep: bairroSelecionado ?? enderecoTexto.trim(),
    ...caracteristicas,
    categoria: uiState.categoria,
    tipo: uiState.tipo,
    condominio,
    amenidades: montarAmenidades(uiState.comodidades)
  });

  const handleCalculate = async () => {
    const condominio = parseCondominio(uiState.condominioMensal);
    const errors: { endereco?: string; condominio?: string; area?: string } = {};
    if (!enderecoTexto.trim()) errors.endereco = 'Informe o endereço ou o bairro.';
    if (!(caracteristicas.areaM2 > 0) || caracteristicas.areaM2 > AREA_MAXIMA) errors.area = `Informe uma área entre 1 e ${AREA_MAXIMA} m².`;
    if (condominio === null) errors.condominio = 'Informe um valor em reais, por exemplo 850.';
    setFieldErrors(errors);
    if (Object.keys(errors).length || condominio === null) return;

    const request = montarRequest(condominio);
    setLoading(true);
    setResult(null);
    setSavedEstimativaId(null);
    try {
      const data = await estimativaService.calcular(request);
      setResult(data);
      localEstimateStorage.add({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        bairroOuCep: request.bairroOuCep,
        valorEstimado: data.valorEstimado
      });
      showToast({ type: 'success', title: 'Estimativa calculada', description: 'Confira o resultado, os insights e as dicas de fotos.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Falha ao calcular estimativa', description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  // Salva a estimativa na conta e devolve o id (ou null se nao foi possivel salvar agora).
  const salvar = async (): Promise<number | null> => {
    if (!result) return null;
    if (savedEstimativaId) return savedEstimativaId;
    const request = montarRequest(result.parametros.condominio);

    if (!isAuthenticated) {
      pendingEstimateStorage.set({ request, result, uiState });
      showToast({ type: 'info', title: 'Faça login para salvar', description: 'Seus dados foram preservados para continuar depois.' });
      navigate('/login', { state: { from: '/estimativas/nova' } });
      return null;
    }

    setSaveLoading(true);
    try {
      const saved = await estimativaService.salvar({
        parametros: request,
        valorEstimado: result.valorEstimado,
        faixaMinima: result.faixaMinima,
        faixaMaxima: result.faixaMaxima,
        confianca: result.confianca,
        insightsMercado: result.insightsMercado,
        referenciaMercado: result.referenciaMercado ?? null
      });
      setSavedEstimativaId(saved.id);
      showToast({ type: 'success', title: 'Estimativa salva', description: `Estimativa #${saved.id} salva na sua conta.` });
      return saved.id;
    } catch (error) {
      showToast({ type: 'error', title: 'Não foi possível salvar', description: getErrorMessage(error) });
      return null;
    } finally {
      setSaveLoading(false);
    }
  };

  const salvarECriarAnuncio = async () => {
    const id = await salvar();
    if (id === null || !result) return;
    navigate('/anuncios/novo', {
      state: { estimativaId: id, bairro: result.parametros.localizacao, logradouro: logradouro ?? undefined }
    });
  };

  const toggleAmenity = (amenity: AmenidadeKey) => {
    setUiState((prev) => ({
      ...prev,
      comodidades: prev.comodidades.includes(amenity)
        ? prev.comodidades.filter((item) => item !== amenity)
        : [...prev.comodidades, amenity]
    }));
  };

  const contagem = (campo: keyof Omit<Caracteristicas, 'areaM2'>, opcoes: string[], titulo: string) => (
    <div>
      <p className='mb-2 text-sm font-medium text-brand-900'>{titulo}</p>
      <div className='flex flex-wrap gap-2'>
        {opcoes.map((option) => (
          <button
            key={option}
            type='button'
            className={`focus-ring min-w-10 rounded-full border px-3 py-2 text-sm ${caracteristicas[campo] === parseNumericOption(option) ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
            onClick={() => setCaracteristicas((prev) => ({ ...prev, [campo]: parseNumericOption(option) }))}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      <PageHeader title='Calcule a estimativa do seu imóvel' subtitle='Preencha os dados e veja uma estimativa de preço com faixa de mercado, insights e dicas de fotos.' />

      <PropertyCard>
        <section id='localizacao' className='space-y-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Localização</h2>
          <AddressAutocomplete
            value={enderecoTexto}
            error={fieldErrors.endereco}
            onInputChange={(value) => {
              setEnderecoTexto(value);
              setBairroSelecionado(null);
              setEnderecoCompleto('');
              setCidadeForaDoEscopo(null);
              setLogradouro(null);
            }}
            onAddressSelected={({ suggestion, details }) => {
              setEnderecoTexto(suggestion.descricao);
              setBairroSelecionado(details.bairro || null);
              setEnderecoCompleto(details.enderecoFormatado);
              setLogradouro(details.logradouro);
              setCidadeForaDoEscopo(details.cidade && !ehCidadeDeSaoPaulo(details.cidade) ? details.cidade : null);
              showToast({
                type: 'success',
                title: 'Endereço selecionado',
                description: details.bairro ? `Bairro: ${details.bairro}` : 'Não identificamos o bairro; a estimativa pode ficar menos precisa.'
              });
            }}
          />
          <p className='text-xs text-gray-500'>
            Busque pela rua ou pelo bairro e escolha uma das sugestões. O número do imóvel é pedido na hora de criar o anúncio.
          </p>
          {cidadeForaDoEscopo ? (
            <p className='rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800'>
              O endereço escolhido fica em {cidadeForaDoEscopo}. A estimativa foi treinada só com imóveis da cidade de São Paulo,
              então para outras cidades o valor não é confiável.
            </p>
          ) : null}
        </section>

        <section className='space-y-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Tipo do imóvel</h2>
          <div className='grid grid-cols-2 gap-2'>
            {CATEGORIAS.map((categoria) => (
              <button
                key={categoria.value}
                type='button'
                className={`focus-ring rounded-full border px-3 py-2 text-sm font-medium ${uiState.categoria === categoria.value ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
                onClick={() => setUiState((prev) => ({ ...prev, categoria: categoria.value }))}
              >
                {categoria.label}
              </button>
            ))}
          </div>
          <Select label='Tipo' value={uiState.tipo} onChange={(e) => setUiState((prev) => ({ ...prev, tipo: e.target.value as TipoImovel }))}>
            {TIPOS_IMOVEL.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </Select>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Características</h2>
          <PriceRange
            min={20}
            max={500}
            maxDigitado={AREA_MAXIMA}
            value={caracteristicas.areaM2}
            error={fieldErrors.area}
            onChange={(areaM2) => setCaracteristicas((prev) => ({ ...prev, areaM2 }))}
          />
          <Input
            label='Condomínio mensal'
            placeholder='R$ 850'
            inputMode='decimal'
            value={uiState.condominioMensal}
            error={fieldErrors.condominio}
            onChange={(event) => setUiState((prev) => ({ ...prev, condominioMensal: event.target.value }))}
            helperText='Deixe em branco ou 0 se não houver condomínio.'
          />
        </section>

        <section className='space-y-4'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Instalações</h2>
          <div className='grid gap-4 md:grid-cols-3'>
            {contagem('quartos', optionsSimple, 'Número de quartos')}
            {contagem('banheiros', optionsSimple, 'Banheiros')}
            {contagem('vagasGaragem', garagemOptions, 'Vagas de garagem')}
          </div>
        </section>

        <section className='space-y-4'>
          <h2 className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Comodidades</h2>
          <div className='flex flex-wrap gap-2'>
            {AMENIDADES.map(({ key, label }) => {
              const active = uiState.comodidades.includes(key);
              return (
                <button
                  key={key}
                  type='button'
                  aria-pressed={active}
                  className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${active ? 'border-brand-900 bg-brand-900 text-white' : 'border-surface-100 bg-white text-brand-900'}`}
                  onClick={() => toggleAmenity(key)}
                >
                  <span className={`inline-block h-3 w-3 rounded-sm border ${active ? 'border-white bg-white/90' : 'border-brand-900'}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <div className='space-y-2'>
          <Button onClick={handleCalculate} disabled={!canSubmit} loading={loading} fullWidth>
            Calcular estimativa
          </Button>
          {enderecoCompleto ? (
            <p className='text-xs text-gray-500'>Endereço selecionado: {enderecoCompleto}</p>
          ) : null}
        </div>
      </PropertyCard>

      <div ref={resultadoRef} className='scroll-mt-4'>
        {loading ? (
          <Card className='text-center text-sm text-gray-600'>Calculando a estimativa...</Card>
        ) : result ? (
          <div className='space-y-3'>
            <EstimateCard
              result={result}
              onSave={() => void salvar()}
              onSaveAndCreate={() => void salvarECriarAnuncio()}
              onReset={() => {
                setResult(null);
                setSavedEstimativaId(null);
              }}
              saveLoading={saveLoading}
              saved={savedEstimativaId !== null}
            />
            {savedEstimativaId ? (
              <p className='rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800'>
                Estimativa #{savedEstimativaId} salva na sua conta. Use "Criar anúncio" para publicá-la.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
