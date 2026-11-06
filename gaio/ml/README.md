# GAIÒ - Modelo de preço

Modelo que estima o preço de venda de imóveis em São Paulo (capital) e o serviço HTTP `/predict` consumido pelo backend (`MlPredictionServiceClient`).

## Como rodar

```bash
cd ml
python -m venv .venv
.venv\Scripts\activate            # Windows (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt

python train.py                   # treina e grava artifacts/ (usa ../Documento de Guilherme.csv)
uvicorn service:app --port 8000   # sobe o /predict
```

Para recalcular só as estatísticas da base (as do dashboard e dos insights) sem retreinar o modelo: `python train.py --so-estatisticas`.

O CSV tratado não está no git. Para retreinar, coloque o arquivo na raiz do projeto ou passe o caminho: `python train.py caminho/do/arquivo.csv`. O modelo já treinado (`artifacts/`) está versionado, então o serviço sobe sem o CSV.

Para o backend usar o modelo real em vez do mock: `ML_SERVICE_MOCK=false` e `ML_SERVICE_URL=http://localhost:8000`.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `common.py` | Nomes das colunas (dataset → JSON do backend), constantes e normalização de bairro |
| `train.py` | Validação cruzada, calibração da faixa, treino final e estatísticas para os insights |
| `service.py` | API FastAPI: reconhece o bairro, prevê, calcula a confiança, gera os insights (`/predict`) e expõe as estatísticas do bairro (`/mercado/bairro`) e o panorama da base com as métricas do modelo (`/mercado/resumo`) |
| `artifacts/model.cbm` | Modelo CatBoost treinado |
| `artifacts/metadata.json` | Métricas, calibração, zona de cada bairro e estatísticas dos insights |

## Como o modelo funciona

- **Algoritmo:** CatBoost (gradient boosting com suporte nativo a variáveis categóricas), treinado sobre `log(preço)`.
- **Variáveis:** área, quartos, banheiros, vagas, condomínio, bairro, zona, categoria, tipo e as 19 amenidades.
- **Faixa de preço:** o modelo prevê três percentis ao mesmo tempo (`MultiQuantile`): P10, P50 e P90. O P50 é o valor estimado, e P10–P90 é a faixa de mercado.
- **Calibração da faixa:** sem ajuste, a faixa P10–P90 continha o preço real em 74% dos casos, abaixo dos 80% prometidos. Uma calibração conformal (CQR), feita com os erros da validação cruzada, alarga a faixa até cobrir 80%.
- **Confiança:** `1 − (faixaMaxima − faixaMinima) / (2 × valorEstimado)`, limitada entre 0 e 1. É uma medida de precisão relativa da faixa calibrada, **não uma probabilidade**: quanto mais estreita a faixa, maior a confiança.

## Localização

1. O texto recebido em `bairroOuCep` é normalizado (sem acento, sem ", São Paulo", abreviações como "V." e "Jd" expandidas) e comparado com os 907 bairros da base.
2. Se não houver nome igual, uma busca por semelhança (`rapidfuzz`, nota mínima 90) corrige pequenos erros de digitação.
3. Com o bairro reconhecido, a zona vem do próprio bairro. Se o bairro não for reconhecido, o serviço usa a `zona` enviada pelo backend; sem nenhuma das duas, estima só pelas demais características.

Para o modelo saber lidar com bairro desconhecido, o treino inclui cópias de 15% dos anúncios sem o bairro e de 5% sem bairro e sem zona. A faixa é calibrada separadamente em cada situação, então fica mais larga (e a confiança menor) quando falta informação.

## Resultados da validação cruzada (5 folds, 20.498 imóveis)

| Situação | Erro mediano | MAPE | Cobertura da faixa | Meia largura média da faixa |
|---|---|---|---|---|
| Bairro reconhecido | 16,3% | 22,5% | 80% | 36% |
| Só a zona | 18,9% | 26,8% | 80% | 42% |
| Sem localização | 20,9% | 29,2% | 80% | 47% |

Variáveis mais importantes: área (34%), condomínio (16%), zona (12%), bairro (9%), vagas (8%), banheiros (6%).

## Insights de mercado

Calculados a partir da base de anúncios (não do mercado inteiro), usando o bairro quando ele tem pelo menos 15 anúncios e a zona caso contrário. A resposta traz até 3 insights.

O primeiro sempre situa o imóvel e explica o resultado, sem julgar o preço: compara o m² estimado com o m² mediano dos imóveis **da mesma categoria** no local (apartamento com apartamento) e diz o que mais puxou o valor para cima ou para baixo. Exemplo: "Apartamentos anunciados no bairro Consolação têm m² mediano de R$ 12.216. Neste imóvel o m² estimado é de R$ 10.019, 18% abaixo dessa referência, principalmente por ter 1 banheiro e 1 vaga de garagem."

Os fatores vêm dos valores SHAP do próprio CatBoost (quanto cada variável moveu a previsão do P50). Ficam de fora da explicação a localização (é a mesma da referência) e a área (o modelo explica o preço total, e área pequena puxa o total para baixo mesmo com m² mais caro). Diferenças de menos de 5% aparecem como "em linha com essa referência".

Os outros dois são os mais marcantes entre:

- participação de imóveis com a mesma quantidade de quartos na oferta;
- tipo de imóvel pouco comum (menos de 10% da oferta);
- condomínio acima ou abaixo da mediana dos apartamentos;
- diferença de m² mediano associada a uma amenidade do imóvel, na mesma zona e categoria;
- posição da área em relação aos imóveis da mesma categoria.

A base não tem data dos anúncios (a coluna foi removida no tratamento), por isso não há insights de tendência de preço no tempo.
