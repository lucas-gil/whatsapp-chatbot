@echo off
REM Teste rápido da integração Gemini

echo.
echo ================================================
echo  TESTE DE INTEGRAÇÃO GEMINI
echo ================================================
echo.

REM 1. Verificar se API está respondendo
echo [1/3] Testando API WhatsApp...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ API respondendo em localhost:3000
) else (
    echo ✗ API NÃO está respondendo!
    echo   Inicie com: npm run dev (em apps/api)
)

REM 2. Verificar se Admin está respondendo
echo [2/3] Testando Painel Admin...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Admin respondendo em localhost:3001
) else (
    echo ✗ Admin NÃO está respondendo!
    echo   Inicie com: npm run dev (em apps/admin)
)

REM 3. Verificar se variável de ambiente está configurada
echo [3/3] Verificando GEMINI_API_KEY...
if defined GEMINI_API_KEY (
    echo ✓ Chave Gemini configurada
) else (
    echo ✗ GEMINI_API_KEY não configurada!
    echo   Execute: $env:GEMINI_API_KEY = "sua_chave"
)

echo.
echo ================================================
echo  PRÓXIMOS PASSOS:
echo ================================================
echo.
echo 1. Abra http://localhost:3001
echo 2. Menu → Configurar Produto
echo 3. Preencha os dados
echo 4. Teste a IA
echo.
echo Dúvidas? Leia: GEMINI_COMECE_AQUI.txt
echo.
pause
