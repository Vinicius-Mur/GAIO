# GAIÒ - Calculadora Imobiliária

[![CI](https://github.com/guilherme-donadon/gaio/actions/workflows/ci.yml/badge.svg)](https://github.com/guilherme-donadon/gaio/actions/workflows/ci.yml)

Estima o valor de venda de imóveis em São Paulo (capital) a partir do endereço e das características do imóvel, e ajuda a transformar uma estimativa salva em um anúncio.

## Estrutura do repositório

| Pasta | Conteúdo |
|---|---|
| `backend/` | API REST em Spring Boot: estimativas, busca de endereço, autenticação e anúncios |
| `ml/` | Modelo de preço (CatBoost) e o serviço `/predict` em Python. Ver [ml/README.md](ml/README.md) |
| `frontend/` | Aplicação web em React + TypeScript + Vite. Ver [frontend/README.md](frontend/README.md) |
| `docker-compose.yml` | Banco PostgreSQL para desenvolvimento |

## Stack

- **Backend:** Java 17, Spring Boot 4.1.1 (Web, Data JPA, Validation, Security com JWT, Actuator, springdoc-openapi), Maven
- **Banco:** PostgreSQL 16
- **Modelo:** Python 3.12, CatBoost, FastAPI, pandas, rapidfuzz
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Axios
- **Endereços:** Nominatim (OpenStreetMap), gratuito e sem chave de API

## Como rodar localmente

### Atalho (Windows)

Com Docker Desktop, Java 17, Python 3.12 e Node.js instalados, na raiz do repositório:

```
.\iniciar.cmd              # banco, modelo, backend e frontend; abre http://localhost:5173
.\iniciar.cmd -SemModelo   # mesmo fluxo, com a estimativa simulada no lugar do modelo
.\parar.cmd                # encerra tudo (os dados do banco são mantidos)
```

O `iniciar` abre o Docker se precisar, instala as dependências na primeira execução e abre cada serviço numa janela própria, com os logs. Os scripts ficam em `scripts/`.

### Passo a passo manual

1. Suba o banco de dados (na raiz do repositório):
   ```
   docker compose up -d
   ```
2. Suba o serviço do modelo (opcional; sem ele, o backend usa uma estimativa simulada):
   ```
   cd ml
   python -m venv .venv
   .venv\Scripts\activate   # Linux/Mac: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn service:app --port 8000
   ```
3. Rode o backend:
   ```
   cd backend
   ./mvnw spring-boot:run
   ```
   Para usar o modelo real, defina antes `ML_SERVICE_MOCK=false` (e `ML_SERVICE_URL`, se o serviço não estiver em `http://localhost:8000`).
4. A API sobe em `http://localhost:8080`. Documentação Swagger em `http://localhost:8080/docs`.
5. Rode o frontend:
   ```
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   A aplicação abre em `http://localhost:5173`.

Os valores padrão em `backend/src/main/resources/application.properties` já apontam para o Postgres do `docker-compose.yml` (usuário/senha/banco `gaio`), então não é necessário configurar nada extra. Para customizar, exporte as variáveis descritas em `.env.example` antes de iniciar.

## Testes e integração contínua

- Backend: `cd backend && ./mvnw test` (com o Postgres rodando).
- Modelo: `cd ml && pip install -r requirements-dev.txt && pytest`.
- Frontend: `cd frontend && npm run lint && npm test && npm run build`.

A cada push no `main` e em todo pull request, o GitHub Actions (`.github/workflows/ci.yml`) roda as três partes: o backend com um Postgres temporário, o modelo com Python 3.12 e o lint, os testes (Vitest) e o build do frontend.

## Endpoints principais

### Calculadora

- `POST /api/estimativas/calcular` - recebe os parametros do imovel e retorna
  a estimativa (valor, faixa, confianca, insights de mercado, dicas de fotos e a
  referencia de mercado: m² mediano e quartis 25%/75% dos anuncios da mesma categoria
  no bairro, ou na zona quando o bairro tem poucos anuncios; nula no mock).
  Nao persiste nada - equivale ao botao "Calcular" do protótipo.
- `POST /api/estimativas` - persiste uma estimativa ja calculada (botao
  "Salvar" do protótipo). Recebe os parametros originais + o resultado exibido
  ao usuario, para nao haver divergencia entre o que foi mostrado e o que foi salvo.
  Os insights de mercado exibidos tambem sao gravados (`insightsMercado`, ate 10), para
  aparecerem no detalhe e na exportacao mesmo depois que a base de mercado mudar.
  A referencia de mercado (`referenciaMercado`, opcional) tambem e gravada; o dashboard
  usa ela para posicionar cada estimativa no bairro sem consultar o servico de ML de novo.
- `GET /api/estimativas` - historico de estimativas salvas pelo usuario logado (exige login).
- `GET /api/estimativas/{id}` - detalhe de uma estimativa salva do proprio usuario (exige login;
  estimativa de outro usuario responde 404).
- `DELETE /api/estimativas/{id}` - exclui uma estimativa do proprio usuario (exige login).
  Se ela tiver um anuncio vinculado, responde 400: exclua o anuncio antes.

### Autenticacao

- `POST /api/auth/registrar` - cria uma conta (nome, email, senha) e devolve um token JWT.
- `POST /api/auth/login` - devolve um token JWT. Nas rotas protegidas, envie
  `Authorization: Bearer <token>`.

### Perfil (exige login)

- `GET /api/usuarios/me` - dados do usuario logado (id, nome, email).
- `PUT /api/usuarios/me` - atualiza nome e email e devolve uma sessao nova (token + usuario):
  o token identifica o usuario pelo email, entao trocar o email invalida o anterior.
  Email ja usado por outra conta responde 409.
- `PUT /api/usuarios/me/senha` - troca a senha (`senhaAtual`, `novaSenha` com no minimo 6
  caracteres e diferente da atual). Senha atual errada responde 400.

### Anuncios (exigem login)

- `POST /api/anuncios` - cria um anuncio a partir de uma estimativa salva, com
  titulo, descricao e dicas de fotos gerados automaticamente. Cada estimativa gera um
  unico anuncio: um segundo anuncio para a mesma estimativa responde 400.
- `GET /api/anuncios` - lista os anuncios do usuario, com filtros por `id`,
  `bairro` e `status`.
- `GET /api/anuncios/{id}` - detalhe de um anuncio.
- `PATCH /api/anuncios/{id}` - edita titulo, descricao, status
  (RASCUNHO/COMPLETO) e publicacao. So anuncios COMPLETO podem ser publicados.
- `DELETE /api/anuncios/{id}` - exclui um anuncio do proprio usuario. A estimativa de
  origem continua salva.

As respostas de anuncio trazem tambem `valorEstimado`, `faixaMinima`, `faixaMaxima` e
`confianca`, copiados da estimativa vinculada, e as datas `criadoEm` e `atualizadoEm`.
O titulo e a descricao gerados usam o bairro ("Cobertura com 3 quartos no bairro
Consolacao") e concordam com o genero do tipo ("Cobertura localizada...",
"Apartamento localizado..."). As estimativas salvas trazem as `dicasFotos`.

### Enderecos (normalizacao via Nominatim / OpenStreetMap)

- `GET /api/enderecos/autocomplete?input=avenida paulista` - sugestoes de
  endereco, restritas a area da cidade de Sao Paulo (escopo do modelo). Se o texto
  tiver numero e nada for encontrado, a busca e repetida so com a rua (o
  OpenStreetMap tem poucos numeros de imovel cadastrados em SP).
- `GET /api/enderecos/detalhes?placeId=...` - detalhes estruturados do
  endereco escolhido (logradouro, bairro, cidade, UF, CEP, lat/lng).
- `GET /api/enderecos/reverso?lat=...&lon=...` - endereco de um ponto do mapa
  (mesmo formato de `/detalhes`).

### Mercado

- `GET /api/mercado/bairro?nome=...` - estatisticas dos anuncios da base para o
  bairro (ou para a zona, quando o bairro tem poucos anuncios): m² mediano por
  categoria (com quartis e quantidade de anuncios de cada categoria), quantidade de
  anuncios, distribuicao de quartos, tipos e condominio tipico. Vem do servico de ML; com `ML_SERVICE_MOCK=true` responde 502.
- `GET /api/mercado/resumo` - panorama da base usada no treino, para o dashboard: m² mediano
  por zona e categoria, todos os bairros com pelo menos 30 anuncios na categoria (m² mediano,
  quartis e contagem da categoria), diferenca de m² associada a cada amenidade por zona e
  categoria e na cidade toda, distribuicao de tipos e quartos por zona e categoria, e as metricas de
  validacao cruzada e a importancia das variaveis do modelo. Publico; tambem responde 502 no mock.

Usa a API publica e gratuita do [Nominatim](https://nominatim.openstreetmap.org)
(OpenStreetMap) - nao requer API key. O `placeId` retornado no autocomplete e
um identificador OSM (ex: `R123456`) que deve ser reenviado para `/detalhes`.

O uso publico do Nominatim tem um limite informal de ~1 requisicao por
segundo por IP; para volume maior no futuro, considere hospedar uma instancia
propria ou usar um provedor com SLA (ex: LocationIQ, que tambem tem free
tier compativel com a API do Nominatim).

## Integracao com o modelo de Machine Learning

O calculo do valor estimado passa pela interface `MlPredictionService`
(`backend/src/main/java/com/gaio/calculadora/service/ml`). Existem duas implementacoes, selecionadas por propriedade:

- `MlPredictionServiceMock` (ativa por padrao, `app.ml-service.mock=true`):
  heuristica simples baseada em area/quartos/banheiros/vagas, zona e
  quantidade de amenidades, usada para o fluxo completo funcionar mesmo sem
  o modelo real pronto.
- `MlPredictionServiceClient` (`app.ml-service.mock=false`): faz um
  `POST /predict` para o servico HTTP configurado em `app.ml-service.base-url`
  (variavel `ML_SERVICE_URL`), enviando `ImovelFeatures` e esperando de volta
  um `PredicaoImovel` (ver `PredicaoImovel.java` no mesmo pacote para o formato
  exato do JSON esperado).

Detalhes do `ImovelFeatures` que o modelo precisa respeitar:
- `categoria` e `tipo` vao com o texto exato do dataset de treino
  (`"Apartamentos"`, `"Casa de condomínio"`...), nao com o nome do enum Java.
  `zona` vai como `"NORTE"`, `"SUL"`, `"LESTE"`, `"OESTE"`, `"CENTRO"` ou `null`:
  ela e opcional, porque o servico deduz a zona pelo bairro e so usa a enviada
  quando nao reconhece o bairro.
- `bairroOuCep` deve trazer o nome do bairro (idealmente o `bairro` devolvido por
  `/api/enderecos/detalhes`); um CEP sozinho nao e reconhecido pelo modelo.
- `quartos`, `banheiros` e `vagasGaragem` sao limitados a 5, porque o dataset
  registra "5 ou mais" como 5. O valor real informado continua salvo no banco.
- As 19 amenidades vao como booleanos soltos (`academia`, `piscina`, ...).

O servico real esta em `ml/` (Python, CatBoost + FastAPI); ver [ml/README.md](ml/README.md)
para treinar e subir, e para o metodo e as metricas do modelo. Para usar: suba o servico (`uvicorn service:app --port 8000`)
e rode o backend com `ML_SERVICE_MOCK=false` e `ML_SERVICE_URL=http://localhost:8000`.

## Banco de dados

O schema (`usuarios`, `estimativas`, `anuncios`) e gerado automaticamente
pelo Hibernate (`ddl-auto=update`) para acelerar o desenvolvimento.

Ja existem migrations Flyway prontas em `backend/src/main/resources/db/migration/`
(`V1__baseline_schema.sql`, `V2__imoveis_referencia.sql`) formalizando esse
schema com constraints e indices que o `ddl-auto` nao cria sozinho -
inclusive a regra de negocio "anuncio so pode ser publicado se estiver
COMPLETO" vira um `CHECK` no proprio banco. **Elas ainda nao estao ativas**
(o projeto continua usando `ddl-auto=update`) - isso e proposital, o schema
ainda pode mudar (contrato do `/predict`). Para ativar
quando o schema estabilizar:

1. Adicionar a dependencia `flyway-core` no `backend/pom.xml`.
2. Trocar `spring.jpa.hibernate.ddl-auto` para `validate`.
3. Se o banco local ja tiver dados (ambiente de dev), rodar com
   `spring.flyway.baseline-on-migrate=true` na primeira vez.

### Atualizando um banco local antigo

Quando uma coluna obrigatoria nova e adicionada a uma entidade (como
`categoria`, `tipo`, `zona`, `condominio` e as amenidades em `estimativas`),
o `ddl-auto=update` nao consegue criar a coluna se a tabela ja tiver linhas.
O Hibernate so registra um aviso no log (`contains null values`) e a
aplicacao sobe, mas salvar uma estimativa passa a falhar. Em ambiente de dev,
limpe os dados de teste antes de subir:

```bash
docker exec gaio-postgres psql -U gaio -d gaio_calculadora -c "TRUNCATE anuncios, estimativas;"
```

O caminho inverso tambem nao e feito sozinho: quando uma coluna deixa de ser
obrigatoria (como `zona`), o `ddl-auto=update` nao remove o `NOT NULL` ja criado.
Se o seu banco criou `zona` como obrigatoria, rode uma vez:

```bash
docker exec gaio-postgres psql -U gaio -d gaio_calculadora -c "ALTER TABLE estimativas ALTER COLUMN zona DROP NOT NULL;"
```

`V2__imoveis_referencia.sql` cria uma tabela de referencia com a base de
imoveis tratada pelo colega de dados (nao usada pela aplicacao ainda, so
preparada para futuras features de comparaveis). Para carregar os dados
nela: `python backend/scripts/importar_imoveis_referencia.py` (ver
instrucoes no topo do arquivo).

## O que o frontend consome

Toda a API esta documentada via OpenAPI/Swagger em `/docs` assim que a
aplicacao sobe - e a fonte de verdade sobre formatos de request/response.
O frontend (`frontend/`) consome esses endpoints; a lista e o formato dos
corpos estao no [frontend/README.md](frontend/README.md).

Rotas protegidas respondem `401` quando o token falta, e invalido ou expirou;
o frontend usa esse status para encerrar a sessao e voltar ao login.
