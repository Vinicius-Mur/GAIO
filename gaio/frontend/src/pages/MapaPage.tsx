import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { LocateFixed } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageHeader } from '../components/layout/PageHeader';
import { enderecoService } from '../services/enderecoService';
import { mercadoService } from '../services/mercadoService';
import { EnderecoDetalhes, MercadoBairro } from '../types';
import { getErrorMessage } from '../utils/error';
import { formatCurrencyBRL } from '../utils/format';

const CENTRO_SP: [number, number] = [-23.5505, -46.6333];
// Um pouco alem dos limites da cidade de Sao Paulo, area coberta pelo modelo.
const LIMITES_SP: [[number, number], [number, number]] = [[-24.1, -46.95], [-23.25, -46.25]];
const NOME_ZONA: Record<string, string> = { NORTE: 'zona Norte', SUL: 'zona Sul', LESTE: 'zona Leste', OESTE: 'zona Oeste', CENTRO: 'Centro' };

interface Ponto {
  lat: number;
  lng: number;
}

const ehSaoPaulo = (cidade: string | null) =>
  (cidade ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase() === 'sao paulo';

const CliqueNoMapa = ({ onEscolher }: { onEscolher: (ponto: Ponto) => void }) => {
  useMapEvents({ click: (evento) => onEscolher(evento.latlng) });
  return null;
};

const Centralizar = ({ ponto }: { ponto: Ponto | null }) => {
  const map = useMap();
  useEffect(() => {
    if (ponto) map.flyTo([ponto.lat, ponto.lng], Math.max(map.getZoom(), 15));
  }, [map, ponto]);
  return null;
};

const Barra = ({ rotulo, valor, total }: { rotulo: string; valor: number; total: number }) => {
  const percentual = total ? Math.round((valor / total) * 100) : 0;
  return (
    <div className='grid grid-cols-[5rem_1fr_2.5rem] items-center gap-2 text-xs text-brand-900'>
      <span>{rotulo}</span>
      <span className='h-2 rounded-full bg-surface-100'>
        <span className='block h-2 rounded-full bg-brand-900' style={{ width: `${percentual}%` }} />
      </span>
      <span className='text-right text-gray-500'>{percentual}%</span>
    </div>
  );
};

const PainelMercado = ({ mercado }: { mercado: MercadoBairro }) => {
  const local = mercado.fonte === 'bairro' ? `no bairro ${mercado.bairro}` : `na ${NOME_ZONA[mercado.zona] ?? mercado.zona}`;
  const quartos = ['1', '2', '3', '4', '5'].map((q) => ({ q, n: mercado.quartos[q] ?? 0 }));
  const tipos = Object.entries(mercado.tipos).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className='space-y-4 text-sm'>
      {mercado.fonte === 'zona' ? (
        <p className='rounded-lg bg-amber-50 p-2 text-xs text-amber-800'>
          {mercado.bairro} tem poucos anúncios na base; os números abaixo são da {NOME_ZONA[mercado.zona] ?? mercado.zona}.
        </p>
      ) : null}
      <p className='text-gray-600'>{mercado.anuncios} anúncios na base de dados {local}.</p>
      <div>
        <p className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>m² mediano</p>
        <dl className='mt-2 grid grid-cols-2 gap-2'>
          {(['Apartamentos', 'Casas'] as const).map((categoria) => {
            const valor = mercado.precoM2PorCategoria[categoria];
            const anuncios = mercado.anunciosPorCategoria?.[categoria];
            return valor ? (
              <div key={categoria}>
                <dt className='text-gray-500'>{categoria}</dt>
                <dd className='font-semibold text-brand-900'>{formatCurrencyBRL(valor)}</dd>
                {anuncios ? <dd className='text-xs text-gray-500'>{anuncios} anúncios</dd> : null}
              </div>
            ) : null;
          })}
          <div><dt className='text-gray-500'>Todos</dt><dd className='font-semibold text-brand-900'>{formatCurrencyBRL(mercado.precoM2Mediano)}</dd></div>
          {mercado.condominioMedianoApartamentos ? (
            <div><dt className='text-gray-500'>Condomínio típico</dt><dd className='font-semibold text-brand-900'>{formatCurrencyBRL(mercado.condominioMedianoApartamentos)}</dd></div>
          ) : null}
        </dl>
      </div>
      <div className='space-y-1'>
        <p className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Quartos</p>
        {quartos.map(({ q, n }) => (
          <Barra key={q} rotulo={q === '5' ? '5 ou mais' : `${q} quarto${q === '1' ? '' : 's'}`} valor={n} total={mercado.anuncios} />
        ))}
      </div>
      <div className='space-y-1'>
        <p className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Tipos mais comuns</p>
        {tipos.map(([tipo, n]) => (
          <Barra key={tipo} rotulo={tipo} valor={n} total={mercado.anuncios} />
        ))}
      </div>
    </div>
  );
};

export const MapaPage = () => {
  const navigate = useNavigate();
  const bairroInicial = (useLocation().state as { bairro?: string } | null)?.bairro;
  const [ponto, setPonto] = useState<Ponto | null>(null);
  const [endereco, setEndereco] = useState<EnderecoDetalhes | null>(null);
  const [mercado, setMercado] = useState<MercadoBairro | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [localizando, setLocalizando] = useState(false);

  const escolher = async (novo: Ponto) => {
    setPonto(novo);
    setEndereco(null);
    setMercado(null);
    setAviso(null);
    setCarregando(true);
    try {
      const encontrado = await enderecoService.reverso(novo.lat, novo.lng);
      setEndereco(encontrado);
      if (!ehSaoPaulo(encontrado.cidade)) {
        setAviso('Este ponto fica fora da cidade de São Paulo. Os dados de mercado e as estimativas cobrem só a capital.');
        return;
      }
      if (!encontrado.bairro) {
        setAviso('Não identificamos o bairro deste ponto. Tente clicar mais perto de uma rua.');
        return;
      }
      setMercado(await mercadoService.bairro(encontrado.bairro));
    } catch (error) {
      setAviso(getErrorMessage(error));
    } finally {
      setCarregando(false);
    }
  };

  // Vindo do dashboard: localiza o bairro pelo nome e mostra os numeros dele.
  const abrirBairro = async (nome: string) => {
    setAviso(null);
    setCarregando(true);
    try {
      const [mercadoDoBairro, sugestoes] = await Promise.all([
        mercadoService.bairro(nome),
        enderecoService.autocomplete(`${nome}, São Paulo`).catch(() => [])
      ]);
      setMercado(mercadoDoBairro);
      const detalhes = sugestoes.length ? await enderecoService.detalhes(sugestoes[0].placeId).catch(() => null) : null;
      setEndereco(detalhes ? { ...detalhes, bairro: nome } : { enderecoFormatado: `${nome}, São Paulo`, logradouro: null, bairro: nome, cidade: 'São Paulo', uf: 'SP', cep: null, latitude: null, longitude: null });
      setPonto(detalhes?.latitude != null && detalhes.longitude != null ? { lat: detalhes.latitude, lng: detalhes.longitude } : null);
    } catch (error) {
      setAviso(getErrorMessage(error));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (bairroInicial) void abrirBairro(bairroInicial);
    // So na chegada a pagina.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usarMinhaLocalizacao = () => {
    if (!navigator.geolocation) {
      setAviso('Seu navegador não informa a localização. Clique no mapa para escolher um ponto.');
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setLocalizando(false);
        void escolher({ lat: posicao.coords.latitude, lng: posicao.coords.longitude });
      },
      () => {
        setLocalizando(false);
        setAviso('Não foi possível obter sua localização. Clique no mapa para escolher um ponto.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Mapa do mercado'
        subtitle='Clique no mapa ou use sua localização para ver os números dos anúncios da região.'
        action={
          <Button variant='secondary' onClick={usarMinhaLocalizacao} loading={localizando}>
            <LocateFixed size={16} />
            Minha localização
          </Button>
        }
      />

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='h-[28rem] overflow-hidden rounded-2xl shadow-soft lg:col-span-2 lg:h-[34rem]'>
          <MapContainer center={CENTRO_SP} zoom={12} minZoom={10} maxBounds={LIMITES_SP} className='h-full w-full'>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <CliqueNoMapa onEscolher={(p) => void escolher(p)} />
            <Centralizar ponto={ponto} />
            {ponto ? <CircleMarker center={[ponto.lat, ponto.lng]} radius={10} pathOptions={{ color: '#2A2440', fillColor: '#C79A3B', fillOpacity: 0.9 }} /> : null}
          </MapContainer>
        </div>

        <Card className='space-y-4'>
          {!ponto && !mercado && !carregando && !aviso ? (
            <p className='text-sm text-gray-600'>Escolha um ponto no mapa para ver o preço típico do m², os tipos de imóvel e o tamanho mais comum dos anúncios do bairro.</p>
          ) : (
            <>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wide2 text-brand-800'>Local escolhido</p>
                <p className='mt-1 font-semibold text-brand-900'>{endereco?.bairro ?? (carregando ? 'Identificando...' : '—')}</p>
                {endereco ? <p className='text-xs text-gray-500'>{endereco.enderecoFormatado}</p> : null}
              </div>
              {carregando ? <p className='text-sm text-gray-500'>Buscando os dados da região...</p> : null}
              {aviso ? <p className='rounded-lg bg-amber-50 p-3 text-sm text-amber-800'>{aviso}</p> : null}
              {mercado ? <PainelMercado mercado={mercado} /> : null}
              {endereco && mercado ? (
                <Button
                  fullWidth
                  onClick={() =>
                    navigate('/estimativas/nova', {
                      state: { endereco: endereco.enderecoFormatado, bairro: endereco.bairro ?? undefined, logradouro: endereco.logradouro ?? undefined }
                    })
                  }
                >
                  Calcular estimativa aqui
                </Button>
              ) : null}
            </>
          )}
          <p className='text-xs text-gray-400'>Números da base de anúncios usada para treinar o modelo, não do mercado inteiro.</p>
        </Card>
      </div>
    </div>
  );
};
