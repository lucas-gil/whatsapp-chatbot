# DIAGNÓSTICO - PAINEL ADMIN DO CHATBOT

Write-Host ""
Write-Host "🔍 DIAGNÓSTICO - PAINEL ADMIN DO CHATBOT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar arquivo admin.html
Write-Host "1️⃣  Verificando arquivo admin.html..." -ForegroundColor Yellow
if (Test-Path "public/admin.html") {
    Write-Host "✅ admin.html encontrado" -ForegroundColor Green
    $adminSize = (Get-Item "public/admin.html").Length
    Write-Host "   Tamanho: $adminSize bytes" -ForegroundColor Green
} else {
    Write-Host "❌ admin.html NÃO encontrado" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Verificar server.js
Write-Host "2️⃣  Verificando server.js..." -ForegroundColor Yellow
if (Test-Path "apps/api/server.js") {
    Write-Host "✅ server.js encontrado" -ForegroundColor Green
    
    # Verificar se tem express.static
    $content = Get-Content "apps/api/server.js" -Raw
    if ($content -match "express\.static") {
        Write-Host "✅ express.static configurado" -ForegroundColor Green
    } else {
        Write-Host "❌ express.static NÃO encontrado" -ForegroundColor Red
    }
    
    # Verificar se tem rotas /admin e /painel
    if ($content -match "app\.get.*'/admin'" -and $content -match "app\.get.*'/painel'") {
        Write-Host "✅ Rotas /admin e /painel configuradas" -ForegroundColor Green
    } else {
        Write-Host "❌ Rotas não estão configuradas" -ForegroundColor Red
    }
} else {
    Write-Host "❌ server.js NÃO encontrado" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Verificar Dockerfile
Write-Host "3️⃣  Verificando Dockerfile..." -ForegroundColor Yellow
if (Test-Path "Dockerfile") {
    $dockerfile = Get-Content "Dockerfile" -Raw
    if ($dockerfile -match "CMD.*server\.js") {
        Write-Host "✅ Dockerfile usa server.js" -ForegroundColor Green
    } elseif ($dockerfile -match "CMD.*dist/index\.js") {
        Write-Host "❌ Dockerfile ainda usa dist/index.js (DESATUALIZADO)" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Comando CMD não encontrado em Dockerfile" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Dockerfile NÃO encontrado" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar docker-compose.prod.yml
Write-Host "4️⃣  Verificando docker-compose.prod.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.prod.yml") {
    Write-Host "✅ docker-compose.prod.yml encontrado" -ForegroundColor Green
    $composefile = Get-Content "docker-compose.prod.yml" -Raw
    if ($composefile -match "Dockerfile") {
        Write-Host "✅ Usa Dockerfile correto" -ForegroundColor Green
    }
} else {
    Write-Host "❌ docker-compose.prod.yml NÃO encontrado" -ForegroundColor Red
}
Write-Host ""

# 5. Verificar package.json
Write-Host "5️⃣  Verificando package.json..." -ForegroundColor Yellow
if (Test-Path "apps/api/package.json") {
    $package = Get-Content "apps/api/package.json" -Raw
    if ($package -match "`"start`":\s*`"node server\.js`"") {
        Write-Host "✅ npm start aponta para server.js" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Verificar script start em package.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ package.json NÃO encontrado" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar dependências
Write-Host "6️⃣  Verificando dependências..." -ForegroundColor Yellow
if ($package -match "`"express`"") {
    Write-Host "✅ Express instalado" -ForegroundColor Green
}
if ($package -match "`"cors`"") {
    Write-Host "✅ CORS instalado" -ForegroundColor Green
}
if ($package -match "`"qrcode`"") {
    Write-Host "✅ QRCode instalado" -ForegroundColor Green
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Diagnóstico concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Fazer rebuild no EasyPanel (3-5 minutos)"
Write-Host "2. Acessar https://seu-dominio/admin"
Write-Host "3. Limpar cache do navegador (Ctrl+Shift+Del)"
Write-Host ""
