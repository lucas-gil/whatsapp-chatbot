@echo off
REM ================================================
REM   WHATSAPP CHATBOT - INSTALADOR SUPER FÁCIL
REM   CLIQUE 2x E PRONTO!
REM ================================================

chcp 65001 >nul
setlocal enabledelayedexpansion

REM Pegar o caminho da pasta onde o script está
cd /d "%~dp0"

cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║                                                  ║
echo ║   WHATSAPP CHATBOT - INSTALADOR AUTOMÁTICO      ║
echo ║                                                  ║
echo ║   ⏳ Aguarde... processando...                   ║
echo ║                                                  ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM ================================================
REM VERIFICAR NODE.JS
REM ================================================
node --version >nul 2>&1
if errorlevel 1 (
    cls
    echo.
    echo ╔══════════════════════════════════════════════════╗
    echo ║         ❌ NODE.JS NÃO ENCONTRADO               ║
    echo ╚══════════════════════════════════════════════════╝
    echo.
    echo Você precisa instalar Node.js:
    echo.
    echo 1. Acesse: https://nodejs.org/
    echo 2. Clique no botão LTS (versão mais estável)
    echo 3. Execute o instalador
    echo 4. Reinicie o computador
    echo 5. Clique 2x neste arquivo novamente
    echo.
    pause
    exit /b 1
)

REM ================================================
REM LIMPEZA AUTOMÁTICA
REM ================================================
echo [1/4] Limpando sistema antigo...

rmdir /s /q "apps\api\baileys-auth" 2>nul
rmdir /s /q "baileys-auth" 2>nul
rmdir /s /q "whatsapp-auth" 2>nul
rmdir /s /q "node_modules" 2>nul
del "package-lock.json" 2>nul
del ".eslintignore" 2>nul

timeout /t 1 >nul

REM ================================================
REM INSTALAR DEPENDÊNCIAS
REM ================================================
echo [2/4] Instalando dependências (pode levar alguns minutos)...

npm install --legacy-peer-deps >nul 2>&1

if errorlevel 1 (
    cls
    echo.
    echo ❌ ERRO na instalação!
    echo Tente novamente ou entre em contato com suporte.
    echo.
    pause
    exit /b 1
)

timeout /t 1 >nul

REM ================================================
REM BUILD
REM ================================================
echo [3/4] Compilando código...

npm run build >nul 2>&1

timeout /t 1 >nul

REM ================================================
REM INICIAR
REM ================================================
cls
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║                                                  ║
echo ║   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!          ║
echo ║                                                  ║
echo ║   🚀 INICIANDO SISTEMA...                        ║
echo ║                                                  ║
echo ║   Aguarde alguns segundos...                    ║
echo ║                                                  ║
echo ╚══════════════════════════════════════════════════╝
echo.

timeout /t 3 >nul

echo [4/4] Iniciando servidores...
echo.

REM Iniciar o sistema
npm run dev
