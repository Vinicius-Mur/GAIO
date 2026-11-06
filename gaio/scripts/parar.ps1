# Encerra frontend, backend e modelo de ML, e para o banco (os dados do banco sao mantidos).
$raiz = Split-Path -Parent $PSScriptRoot

# Porta -> processo esperado nela, para nao derrubar outro programa que use a mesma porta.
$servicos = @(
    @{ Nome = 'Frontend'; Porta = 5173; Processo = 'node' },
    @{ Nome = 'Backend'; Porta = 8080; Processo = 'java' },
    @{ Nome = 'Modelo'; Porta = 8000; Processo = 'python' }
)

foreach ($s in $servicos) {
    $conexao = Get-NetTCPConnection -LocalPort $s.Porta -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $conexao) { Write-Host "$($s.Nome): nao estava rodando"; continue }
    $processo = Get-Process -Id $conexao.OwningProcess -ErrorAction SilentlyContinue
    if ($processo -and $processo.ProcessName -like "$($s.Processo)*") {
        Stop-Process -Id $processo.Id -Force
        Write-Host "$($s.Nome): encerrado" -ForegroundColor Green
    } else {
        Write-Host "$($s.Nome): a porta $($s.Porta) esta com outro programa ($($processo.ProcessName)); nao mexi" -ForegroundColor Yellow
    }
}

Push-Location $raiz
docker compose stop 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host 'Banco: parado (dados mantidos)' -ForegroundColor Green }
else { Write-Host 'Banco: Docker indisponivel, nada a parar' }
Pop-Location
