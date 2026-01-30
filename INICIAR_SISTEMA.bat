@echo off
TITLE Sistema WhatsApp Bot - IPTV
color 0A

echo =======================================================
echo          SISTEMA DE PAGAMENTOS E BOT WHATSAPP
echo =======================================================
echo.

REM 1. Verifica se o Node.js esta instalado
echo [1/4] Verificando instalacao do Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Para usar este sistema, seu amigo precisa instalar o Node.js.
    echo Baixe e instale a versao LTS em: https://nodejs.org
    echo.
    pause
    exit
)
echo [OK] Node.js detectado.
echo.

REM 2. Instalacao Automatica de Dependencias (Primeira vez)
if not exist "apps\api\node_modules" (
    echo [INFO] Primeira vez detectada. Instalando dependencias da API...
    cd apps\api
    call npm install
    cd ..\..
    echo [OK] Dependencias da API instaladas.
)

if not exist "apps\admin\node_modules" (
    echo [INFO] Instalando dependencias do Painel Admin...
    cd apps\admin
    call npm install
    cd ..\..
    echo [OK] Dependencias do Admin instaladas.
)

REM 3. Iniciar API (Backend)
echo [2/4] Iniciando Servidor WhatsApp (API)...
echo        Uma nova janela se abrira com o servidor.
echo        NAO FECHE A JANELA PRETA QUE VAI ABRIR!
start "API SERVER - NAO FECHE" cmd /k "cd apps\api && node whatsapp-web-server.js"

REM 4. Iniciar Admin (Frontend)
echo [3/4] Iniciando Painel Administrativo...
echo        Aguardando servidor subir...
timeout /t 5 >nul
start "PAINEL ADMIN - NAO FECHE" cmd /k "cd apps\admin && npm run dev -- -p 3001"

REM 5. Abrir Navegador
echo [4/4] Abrindo navegador...
timeout /t 8 >nul
start http://localhost:3001

echo.
echo =======================================================
echo           SISTEMA INICIADO COM SUCESSO!
echo =======================================================
echo.
echo 1. O qr code aparecera na janela "API SERVER" ou no terminal.
echo 2. Acesse http://localhost:3001 para configurar.
echo.
pause
