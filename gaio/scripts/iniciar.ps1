# Sobe o projeto completo: banco (Docker), modelo de ML, backend e frontend.
# Uso: .\iniciar.cmd            (modelo real)
#      .\iniciar.cmd -SemModelo  (backend com a estimativa simulada, sem subir o modelo)
param([switch]$SemModelo)

$raiz = Split-Path -Parent $PSScriptRoot
$dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'

function Escrever($texto) { Write-Host "==> $texto" -ForegroundColor Cyan }

function Esperar($nome, [scriptblock]$pronto, $segundos) {
    $limite = (Get-Date).AddSeconds($segundos)
    while ((Get-Date) -lt $limite) {
        if (& $pronto) { Write-Host "    $nome pronto" -ForegroundColor Green; return }
        Start-Sleep -Seconds 2
    }
    throw "$nome nao ficou pronto em $segundos segundos. Veja a janela dele para o erro."
}

function PortaEmUso($porta) {
    [bool](Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue)
}

function UrlResponde($url) {
    try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 | Out-Null; $true } catch { $false }
}

function AbrirJanela($titulo, $pasta, $comando) {
    $script = "`$host.UI.RawUI.WindowTitle = '$titulo'; Set-Location '$pasta'; $comando"
    Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $script | Out-Null
}

# 1. Docker e banco
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    if (-not (Test-Path $dockerDesktop)) { throw 'Docker Desktop nao encontrado. Instale ou abra o Docker manualmente.' }
    Escrever 'Abrindo o Docker Desktop'
    Start-Process $dockerDesktop
    Esperar 'Docker' { docker info *> $null; $LASTEXITCODE -eq 0 } 180
}
Escrever 'Subindo o banco de dados'
Push-Location $raiz
docker compose up -d
Pop-Location
Esperar 'Postgres' { docker exec gaio-postgres pg_isready -U gaio -d gaio_calculadora *> $null; $LASTEXITCODE -eq 0 } 60

# 2. Dependencias (so na primeira vez)
$python = Join-Path $raiz 'ml\.venv\Scripts\python.exe'
if (-not $SemModelo -and -not (Test-Path $python)) {
    Escrever 'Criando o ambiente Python do modelo (primeira vez)'
    python -m venv (Join-Path $raiz 'ml\.venv')
    & $python -m pip install -q -r (Join-Path $raiz 'ml\requirements.txt')
}
if (-not (Test-Path (Join-Path $raiz 'frontend\node_modules'))) {
    Escrever 'Instalando as dependencias do frontend (primeira vez)'
    Push-Location (Join-Path $raiz 'frontend')
    npm install
    Pop-Location
}
$envFront = Join-Path $raiz 'frontend\.env'
if (-not (Test-Path $envFront)) { Copy-Item (Join-Path $raiz 'frontend\.env.example') $envFront }

# 3. Servicos, cada um na sua janela (os que ja estiverem rodando sao mantidos)
if ($SemModelo) {
    $mock = 'true'
} else {
    $mock = 'false'
    if (PortaEmUso 8000) { Escrever 'Modelo ja esta rodando na porta 8000' }
    else {
        Escrever 'Abrindo o modelo de ML'
        AbrirJanela 'GAIO - Modelo' (Join-Path $raiz 'ml') "& '$python' -m uvicorn service:app --port 8000"
    }
}

if (PortaEmUso 8080) { Escrever 'Backend ja esta rodando na porta 8080' }
else {
    Escrever 'Abrindo o backend'
    AbrirJanela 'GAIO - Backend' (Join-Path $raiz 'backend') "`$env:ML_SERVICE_MOCK = '$mock'; .\mvnw.cmd spring-boot:run"
}

if (PortaEmUso 5173) { Escrever 'Frontend ja esta rodando na porta 5173' }
else {
    Escrever 'Abrindo o frontend'
    AbrirJanela 'GAIO - Frontend' (Join-Path $raiz 'frontend') 'npm run dev'
}

# 4. Espera tudo responder e abre o navegador
if (-not $SemModelo) { Esperar 'Modelo' { UrlResponde 'http://localhost:8000/health' } 120 }
Esperar 'Backend' { UrlResponde 'http://localhost:8080/actuator/health' } 240
Esperar 'Frontend' { UrlResponde 'http://localhost:5173' } 120

Escrever 'Tudo pronto: http://localhost:5173  (Swagger: http://localhost:8080/docs)'
Start-Process 'http://localhost:5173'
