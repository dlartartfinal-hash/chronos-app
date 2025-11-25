<#
  setup-node-and-lint.ps1
  - Verifica se Node/NPM estão instalados
  - Se não estiverem, abre a página de download do Node.js e aguarda instalação manual
  - Instala devDependencies necessárias (ESLint, Prettier e plugins)
  - Executa Prettier (check + write) e ESLint --fix

  Uso: abra o PowerShell no diretório do projeto e execute:
    powershell -ExecutionPolicy Bypass -File .\setup-node-and-lint.ps1

  Observação: se for solicitado, execute o PowerShell como Administrador para permitir instalação de pacotes globais/alterações no sistema.
#>

function Assert-CommandExists($cmd) {
    return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "Iniciando setup: verificando Node.js/NPM..." -ForegroundColor Cyan

if (-not (Assert-CommandExists "node") -or -not (Assert-CommandExists "npm")) {
    Write-Warning "Node.js e/ou npm não foram encontrados no PATH."
    Write-Host "Vou abrir a página oficial de download do Node.js (LTS). Por favor, baixe e instale a versão LTS e depois volte aqui." -ForegroundColor Yellow
    Start-Process "https://nodejs.org/en/download/"
    Read-Host "Após instalar o Node.js, pressione Enter para continuar"

    if (-not (Assert-CommandExists "node") -or -not (Assert-CommandExists "npm")) {
        Write-Error "Node.js ainda não está disponível. O script será encerrado. Instale o Node.js e execute este script novamente." -ErrorAction Stop
    }
}

Write-Host "Node detectado:" -NoNewline
node -v
Write-Host "npm detectado:" -NoNewline
npm -v

$devDeps = @(
    'eslint',
    'prettier',
    '@typescript-eslint/parser',
    '@typescript-eslint/eslint-plugin',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks'
)

Write-Host "Instalando devDependencies necessárias (pode demorar)..." -ForegroundColor Cyan

$installCmd = "npm install --save-dev " + ($devDeps -join ' ')
Write-Host $installCmd

$proc = Start-Process -FilePath npm -ArgumentList @('install','--save-dev') + $devDeps -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
if ($proc.ExitCode -ne 0) {
    Write-Warning "A instalação via npm retornou código de saída $($proc.ExitCode). Tentando executar npm install direto (fallback)..."
    npm install --save-dev $devDeps
}

Write-Host "Instalação das dependências concluída (ou houve um erro)." -ForegroundColor Green

Write-Host "Executando Prettier (check)..." -ForegroundColor Cyan
try {
    npx prettier --check .
} catch {
    Write-Warning "Prettier check falhou ou não encontrou arquivos. Tentando aplicar formatação de qualquer forma..."
}

Write-Host "Aplicando Prettier (write) nos arquivos..." -ForegroundColor Cyan
try {
    npx prettier --write .
} catch {
    Write-Error "Falha ao executar Prettier --write. Verifique se o npm/npm packages foram instalados corretamente." -ErrorAction Continue
}

Write-Host "Executando ESLint --fix nos arquivos do src..." -ForegroundColor Cyan
try {
    npx eslint "./src/**/*.{js,jsx,ts,tsx}" --fix
} catch {
    Write-Warning "ESLint falhou ou não encontrou arquivos. Verifique a configuração em .eslintrc.json e se as dependências foram instaladas." -ErrorAction Continue
}

Write-Host "Processo concluído. Revise a saída acima para ver arquivos modificados e possíveis erros." -ForegroundColor Green

Write-Host "Se desejar, execute agora: git status" -ForegroundColor Yellow
