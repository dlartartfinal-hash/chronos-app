<#
  setup-local.ps1
  - Script para preparar ambiente local do projeto (Windows PowerShell)
  - Verifica Node/npm, instala dependências, gera Prisma client, aplica migrations e roda seed opcional
  - Ao final inicia o servidor de desenvolvimento (`npm run dev`)

  Uso (PowerShell):
    powershell -ExecutionPolicy Bypass -File .\setup-local.ps1

  Nota: execute o PowerShell como Administrador se precisar instalar ferramentas globais.
#>

function Assert-CommandExists($cmd) {
    return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "=== Setup local do projeto - iniciando ===" -ForegroundColor Cyan

if (-not (Assert-CommandExists "node") -or -not (Assert-CommandExists "npm")) {
    Write-Warning "Node.js/npm não detectados. Execute o instalador LTS em https://nodejs.org/ e depois rode este script novamente."
    Start-Process "https://nodejs.org/en/download/"
    Read-Host "Depois de instalar Node.js, pressione Enter para continuar"
}

Write-Host "Node detectado:" -NoNewline; node -v
Write-Host "npm detectado:" -NoNewline; cmd /c "npm -v"

Write-Host "1) Instalando dependências (pode demorar)..." -ForegroundColor Cyan
cmd /c "npm install"

Write-Host "2) Gerando Prisma Client..." -ForegroundColor Cyan
try {
    cmd /c "npx prisma generate"
} catch {
    Write-Warning "Erro ao gerar Prisma Client. Verifique se o Prisma está instalado nas dependências." -ErrorAction Continue
}

Write-Host "3) Rodar migrations (opcional)." -ForegroundColor Cyan
Write-Host "Se quiser aplicar migrations automaticamente, digite 'y' e pressione Enter. Caso contrário, pressione Enter para pular." -ForegroundColor Yellow
$apply = Read-Host "Aplicar migrations agora? (y/N)"
if ($apply -and $apply.ToLower() -eq 'y') {
    try {
        cmd /c "npx prisma migrate dev --name init"
    } catch {
        Write-Warning "Falha ao aplicar migrations. Você pode executar manualmente: npx prisma migrate dev --name init" -ErrorAction Continue
    }
} else {
    Write-Host "Pulado applying migrations." -ForegroundColor Yellow
}

Write-Host "4) Rodar seed (se existir) - opcional" -ForegroundColor Cyan
if (Test-Path "prisma/seed.js") {
    Write-Host "Arquivo prisma/seed.js encontrado. Deseja executar o seed agora? (y/N)" -ForegroundColor Yellow
    $seed = Read-Host "Executar seed? (y/N)"
    if ($seed -and $seed.ToLower() -eq 'y') {
        try {
            cmd /c "npm run prisma:seed"
        } catch {
            Write-Warning "Falha ao rodar seed. Rode manualmente: npm run prisma:seed" -ErrorAction Continue
        }
    } else {
        Write-Host "Seed não executado." -ForegroundColor Yellow
    }
} else {
    Write-Host "Nenhum seed encontrado." -ForegroundColor Gray
}

Write-Host "Setup concluído. Iniciando app em modo dev (porta padrão definida no package.json)..." -ForegroundColor Green
try {
    cmd /c "npm run dev"
} catch {
    Write-Warning "Falha ao iniciar 'npm run dev'. Rode manualmente: npm run dev" -ErrorAction Continue
}
