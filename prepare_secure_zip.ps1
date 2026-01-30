# Script para criar pacote SEGURO (Código Ofuscado)
# Use este script para gerar o arquivo ZIP para seu amigo sem revelar o código fonte da API.

$ErrorActionPreference = "Stop"
$workspaceDir = "c:\Users\tranf\whatsapp-chatbot"
$targetDir = "$workspaceDir\SISTEMA_SECURE"
$zipPath = "$workspaceDir\apps\admin\SISTEMA_PROTEGIDO.zip"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "      CRIANDO VERSAO PROTEGIDA (ANTI-COPIA)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Limpeza inicial
if (Test-Path $targetDir) {
    Write-Host "[-] Removendo versao temporaria anterior..." -ForegroundColor Yellow
    Remove-Item -Path $targetDir -Recurse -Force
}
if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}

# 2. Criar estrutura
Write-Host "[+] Criando pasta temporaria..." -ForegroundColor Green
New-Item -ItemType Directory -Path $targetDir | Out-Null
New-Item -ItemType Directory -Path "$targetDir\apps" | Out-Null

# 3. Copiar arquivos da raiz (Scripts de inicio e docs)
Write-Host "[+] Copiando scripts de inicializacao..." -ForegroundColor Green
Copy-Item "$workspaceDir\*.bat" -Destination $targetDir
Copy-Item "$workspaceDir\*.txt" -Destination $targetDir
Copy-Item "$workspaceDir\*.md" -Destination $targetDir
# Nao queremos scripts de desenvolvimento
# Copy-Item "$workspaceDir\*.json" -Destination $targetDir # package.json raiz talvez nao precise, mas melhor ter

# 4. Preparar API (A PARTE CRITICA)
Write-Host "[+] Preparando API (O CORACAO DO ROBO)..." -ForegroundColor Green

# Criar pasta destino
New-Item -ItemType Directory -Path "$targetDir\apps\api" | Out-Null

# Lista de exclusão
$excludeItems = @("node_modules", "dist", ".git", ".vscode", "test", "coverage", "src", "whatsapp-auth", "whatsapp-sessions", "logs")

# Copiar itens filtrados
Get-ChildItem -Path "$workspaceDir\apps\api" | Where-Object { 
    $excludeItems -notcontains $_.Name
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination "$targetDir\apps\api" -Recurse
}


# 5. OFUSCACAO (A MAGICA)
Write-Host "[!] INICIANDO OFUSCACAO DE CODIGO (Isso pode demorar um pouco)..." -ForegroundColor Magenta
Write-Host "    Aguarde enquanto embaralhamos os arquivos .js da API..."

# Usamos npx para rodar javascript-obfuscator sem instalar globalmente
# Alvo: apenas os arquivos JS raiz da API (onde estao os servers)
$apiPath = "$targetDir\apps\api"
$obfuscatorCmd = "npx -y javascript-obfuscator ""$apiPath"" --output ""$apiPath"" --target node --compact true --self-defending true --split-strings true --exclude ""node_modules"" "

Invoke-Expression $obfuscatorCmd

Write-Host "[OK] Codigo da API ofuscado!" -ForegroundColor Green

# 6. Preparar Admin (Frontend) - Mantemos 'src' pois o Next.js precisa pra rodar em dev
# Se quisessemos proteger 100%, precisariamos buildar, mas isso exige enviar .next gigante.
Write-Host "[+] Copiando Admin..." -ForegroundColor Green
$excludeAdmin = @("node_modules", ".next", ".git")
Copy-Item "$workspaceDir\apps\admin" -Destination "$targetDir\apps" -Recurse
if (Test-Path "$targetDir\apps\admin\node_modules") {
    Remove-Item -Path "$targetDir\apps\admin\node_modules" -Recurse -Force
}
if (Test-Path "$targetDir\apps\admin\.next") {
    Remove-Item -Path "$targetDir\apps\admin\.next" -Recurse -Force
}

# 7. Comprimir
Write-Host "[+] Gerando arquivo ZIP final..." -ForegroundColor Cyan
Compress-Archive -Path "$targetDir\*" -DestinationPath $zipPath -Force

# 8. Limpeza final
Remove-Item -Path $targetDir -Recurse -Force

Write-Host "=======================================================" -ForegroundColor Green
Write-Host " COMPLETO! ARQUIVO SEGURO CRIADO:" -ForegroundColor White
Write-Host " $zipPath" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Green
