@echo off
REM Teste direto do QR Code
REM Este script testa se a API está gerando o QR code corretamente

chcp 65001 >nul
cd /d "%~dp0"

cls
echo.
echo ╔═════════════════════════════════════════════════════╗
echo ║     TESTE DO QR CODE - DIAGNÓSTICO RÁPIDO          ║
echo ╚═════════════════════════════════════════════════════╝
echo.

echo [1] Limpando sessões antigas...
rmdir /s /q "apps\api\baileys-auth" 2>nul
rmdir /s /q "baileys-auth" 2>nul
rmdir /s /q "whatsapp-auth" 2>nul

echo [2] Instalando dependências (se necessário)...
npm install --legacy-peer-deps >nul 2>&1

echo [3] Iniciando API...
echo.
echo ⏳ A API está iniciando... aguarde alguns segundos
echo.

timeout /t 3 >nul

echo [4] Testando QR Code...
echo.

REM Enviar requisição POST para gerar QR Code
echo Enviando requisição para: http://localhost:3000/api/whatsapp/start-session
echo.

REM Usar PowerShell para fazer a requisição
powershell -Command "$ErrorActionPreference='Stop'; try { $result = Invoke-RestMethod -Uri 'http://localhost:3000/api/whatsapp/start-session' -Method Post -ContentType 'application/json' -TimeoutSec 30; if ($result.qrCode) { Write-Host '✅ QR CODE GERADO COM SUCESSO!' -ForegroundColor Green; Write-Host ('SessionID: ' + $result.sessionId) -ForegroundColor Cyan; Write-Host ('QR Code: ' + $result.qrCode.Substring(0, 50) + '...') -ForegroundColor Green } else { Write-Host '❌ QR CODE NÃO FOI GERADO' -ForegroundColor Red; Write-Host ('Resposta: ' + ($result | ConvertTo-Json)) -ForegroundColor Yellow } } catch { Write-Host ('❌ ERRO: ' + $_.Exception.Message) -ForegroundColor Red }"

echo.
echo.
echo ╔═════════════════════════════════════════════════════╗
echo ║              TESTE CONCLUÍDO                        ║
echo ╚═════════════════════════════════════════════════════╝
echo.

pause
