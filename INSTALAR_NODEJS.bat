@echo off
REM ========================================================
REM  INSTALAR NODE.JS AUTOMATICAMENTE
REM  Clique com direito → Executar como administrador
REM ========================================================

echo.
echo =========================================
echo    INSTALADOR NODE.JS PARA WINDOWS
echo =========================================
echo.

REM 1. Verificar se Node.js ja esta instalado
echo [1/3] Verificando se Node.js ja esta instalado...
node -v >nul 2>&1

if %errorlevel% equ 0 (
    echo [SUCESSO] Node.js ja esta instalado!
    node -v
    echo.
    echo Nao precisa instalar novamente.
    pause
    exit /b 0
)

REM 2. Fazer download do Node.js
echo [AGUARDE] Node.js nao encontrado. Fazendo download...
echo.

REM Usar PowerShell para fazer download (mais confiavel)
powershell -Command ^
  "if (-not (Test-Path '$env:TEMP\node-installer.msi')) { ^
    Write-Host 'Baixando Node.js LTS...'; ^
    $url='https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi'; ^
    $output='$env:TEMP\node-installer.msi'; ^
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing; ^
    Write-Host 'Download concluido!'; ^
  }"

if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Falha ao fazer download!
    echo.
    echo Tente descarregar manualmente em:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 3. Instalar Node.js
echo [2/3] Instalando Node.js...
msiexec /i "%TEMP%\node-installer.msi" /quiet ADDLOCAL=ALL

if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Falha na instalacao!
    pause
    exit /b 1
)

REM 4. Aguardar um pouco
timeout /t 5 /nobreak

REM 5. Verificar instalacao
echo [3/3] Verificando instalacao...
node -v >nul 2>&1

if %errorlevel% equ 0 (
    color 0A
    echo [SUCESSO] Node.js instalado com sucesso!
    echo.
    echo Versao instalada:
    node -v
    npm -v
    echo.
    echo Voce pode agora extrair e usar o sistema WhatsApp Chatbot.
    echo.
    pause
    exit /b 0
) else (
    color 0C
    echo [ERRO] Node.js nao foi instalado corretamente.
    echo.
    echo Tente reinstalar manualmente:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
