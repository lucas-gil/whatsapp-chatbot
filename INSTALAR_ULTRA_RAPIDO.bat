@echo off
REM ================================================
REM   INSTALAR E ABRIR - VERSÃO ULTRA SIMPLES
REM   CLIQUE 2x E TUDO ACONTECE SOZINHO!
REM ================================================

chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    start https://nodejs.org/
    msg * Instale Node.js, depois execute este arquivo novamente!
    exit /b 1
)

REM Limpar
rmdir /s /q "apps\api\baileys-auth" 2>nul
rmdir /s /q "baileys-auth" 2>nul
rmdir /s /q "whatsapp-auth" 2>nul
rmdir /s /q "node_modules" 2>nul
del "package-lock.json" 2>nul

REM Instalar
npm install --legacy-peer-deps >nul 2>&1

REM Iniciar em segundo plano
start npm run dev

REM Aguardar sistema iniciar
timeout /t 10 >nul

REM Abrir navegador automaticamente
start http://localhost:3001

exit /b 0
