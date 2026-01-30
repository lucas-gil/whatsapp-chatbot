$ErrorActionPreference = "SilentlyContinue"
$workDir = Get-Location
$tempRoot = "$workDir\TEMP_EXPORT"
$targetDir = "$tempRoot\whatsapp-bot-sistema"
$zipFile = "$workDir\SISTEMA_PARA_AMIGO.zip"

Write-Host "=== PREPARANDO ARQUIVO PARA ENVIO ===" -ForegroundColor Cyan

# 1. Limpar anterior
if (Test-Path $tempRoot) { Remove-Item $tempRoot -Recurse -Force }
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }

# 2. Criar estrutura temporária
New-Item -ItemType Directory -Path $targetDir | Out-Null

# 3. Copiar arquivos essenciais
Write-Host "--> Copiando arquivos..."
Copy-Item "INICIAR_SISTEMA.bat" $targetDir
Copy-Item "package.json" $targetDir
Copy-Item "docker-compose.yml" $targetDir
Copy-Item "README.md" $targetDir

# Copiar pastas recursivamente
Write-Host "--> Copiando pasta apps..."
Copy-Item "apps" $targetDir -Recurse
if (Test-Path "packages") { Copy-Item "packages" $targetDir -Recurse }
if (Test-Path "public") { Copy-Item "public" $targetDir -Recurse }

# 4. Remover lixo (node_modules, .next, etc) para o arquivo ficar leve
Write-Host "--> Limpando node_modules e caches para reduzir tamanho..." -ForegroundColor Yellow

# Função helper para deletar
function Clean-Dir($path) {
    Get-ChildItem -Path $path -Include "node_modules",".next",".git",".turbo","dist" -Recurse | Remove-Item -Recurse -Force
}

# Deletar pastas específicas que sabemos que existem e são pesadas
if (Test-Path "$targetDir\apps\admin\node_modules") { Remove-Item "$targetDir\apps\admin\node_modules" -Recurse -Force }
if (Test-Path "$targetDir\apps\admin\.next") { Remove-Item "$targetDir\apps\admin\.next" -Recurse -Force }
if (Test-Path "$targetDir\apps\api\node_modules") { Remove-Item "$targetDir\apps\api\node_modules" -Recurse -Force }
if (Test-Path "$targetDir\apps\api\.next") { Remove-Item "$targetDir\apps\api\.next" -Recurse -Force }

# 5. Compactar
Write-Host "--> Criando arquivo ZIP (isso pode levar alguns segundos)..." -ForegroundColor Cyan
Compress-Archive -Path "$targetDir" -DestinationPath $zipFile

# 6. Limpeza final
Remove-Item $tempRoot -Recurse -Force

Write-Host "✅ SUCESSO!" -ForegroundColor Green
Write-Host "Arquivo criado em: $zipFile" -ForegroundColor Green
