@echo off
REM 🚀 Quick Start para Windows

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   WhatsApp Chatbot Setup                       ║
echo ║                      Versão 1.0.0                             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar Node.js
echo [1/5] Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não está instalado!
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado
echo.

REM Instalar dependências
echo [2/5] Instalando dependências...
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)
echo ✅ Dependências instaladas
echo.

REM Criar .env
echo [3/5] Verificando .env...
if not exist .env (
    copy .env.example .env
    echo ✅ Arquivo .env criado
    echo ⚠️  Abra .env e preencha suas variáveis de ambiente!
) else (
    echo ✅ .env já existe
)
echo.

REM Docker
echo [4/5] Iniciando Docker Compose...
docker-compose up -d >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker não disponível (você pode continuar)
) else (
    echo ✅ Docker iniciado
    timeout /t 5 /nobreak
)
echo.

REM Migrations
echo [5/5] Preparando banco de dados...
call npm run db:migrate >nul 2>&1
call npm run db:seed >nul 2>&1
echo ✅ Banco de dados pronto
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    Pronto para começar! 🎉                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📝 Próximos passos:
echo.
echo 1. Abra .env e configure com suas credenciais:
echo    - WHATSAPP_PHONE_NUMBER_ID
echo    - WHATSAPP_ACCESS_TOKEN
echo    - OPENAI_API_KEY
echo    - etc...
echo.
echo 2. Em um terminal PowerShell, inicie a API:
echo    cd apps\api
echo    npm run dev
echo.
echo 3. Em outro terminal, inicie o Admin:
echo    cd apps\admin
echo    npm run dev
echo.
echo 4. Acesse:
echo    🤖 API: http://localhost:3000
echo    🖥️  Admin: http://localhost:3001
echo.
echo 📚 Leia o SETUP.md para instruções detalhadas!
echo.

pause
