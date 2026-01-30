#!/bin/bash

echo "🔍 DIAGNÓSTICO - PAINEL ADMIN DO CHATBOT"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar arquivo admin.html
echo "1️⃣  Verificando arquivo admin.html..."
if [ -f "public/admin.html" ]; then
    echo -e "${GREEN}✅ admin.html encontrado${NC}"
    ADMIN_SIZE=$(wc -c < public/admin.html)
    echo "   Tamanho: $ADMIN_SIZE bytes"
else
    echo -e "${RED}❌ admin.html NÃO encontrado${NC}"
    exit 1
fi
echo ""

# 2. Verificar server.js
echo "2️⃣  Verificando server.js..."
if [ -f "apps/api/server.js" ]; then
    echo -e "${GREEN}✅ server.js encontrado${NC}"
    
    # Verificar se tem express.static
    if grep -q "express.static" apps/api/server.js; then
        echo -e "${GREEN}✅ express.static configurado${NC}"
    else
        echo -e "${RED}❌ express.static NÃO encontrado${NC}"
    fi
    
    # Verificar se tem rotas /admin e /painel
    if grep -q "app.get.*'/admin'" apps/api/server.js && grep -q "app.get.*'/painel'" apps/api/server.js; then
        echo -e "${GREEN}✅ Rotas /admin e /painel configuradas${NC}"
    else
        echo -e "${RED}❌ Rotas não estão configuradas${NC}"
    fi
else
    echo -e "${RED}❌ server.js NÃO encontrado${NC}"
    exit 1
fi
echo ""

# 3. Verificar Dockerfile
echo "3️⃣  Verificando Dockerfile..."
if grep -q "CMD.*server.js" Dockerfile; then
    echo -e "${GREEN}✅ Dockerfile usa server.js${NC}"
elif grep -q "CMD.*dist/index.js" Dockerfile; then
    echo -e "${RED}❌ Dockerfile ainda usa dist/index.js (DESATUALIZADO)${NC}"
else
    echo -e "${YELLOW}⚠️  Comando CMD não encontrado em Dockerfile${NC}"
fi
echo ""

# 4. Verificar docker-compose.prod.yml
echo "4️⃣  Verificando docker-compose.prod.yml..."
if [ -f "docker-compose.prod.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.prod.yml encontrado${NC}"
    if grep -q "Dockerfile" docker-compose.prod.yml; then
        echo -e "${GREEN}✅ Usa Dockerfile correto${NC}"
    fi
else
    echo -e "${RED}❌ docker-compose.prod.yml NÃO encontrado${NC}"
fi
echo ""

# 5. Verificar package.json
echo "5️⃣  Verificando package.json..."
if grep -q "\"start\": \"node server.js\"" apps/api/package.json; then
    echo -e "${GREEN}✅ npm start aponta para server.js${NC}"
else
    echo -e "${YELLOW}⚠️  Verificar script start em package.json${NC}"
fi
echo ""

# 6. Verificar dependências
echo "6️⃣  Verificando dependências..."
if grep -q "\"express\"" apps/api/package.json; then
    echo -e "${GREEN}✅ Express instalado${NC}"
fi
if grep -q "\"cors\"" apps/api/package.json; then
    echo -e "${GREEN}✅ CORS instalado${NC}"
fi
if grep -q "\"qrcode\"" apps/api/package.json; then
    echo -e "${GREEN}✅ QRCode instalado${NC}"
fi
echo ""

echo "=========================================="
echo "✅ Diagnóstico concluído!"
echo ""
echo "📌 PRÓXIMOS PASSOS:"
echo "1. Fazer rebuild no EasyPanel (3-5 minutos)"
echo "2. Acessar https://seu-dominio/admin"
echo "3. Limpar cache do navegador (Ctrl+Shift+Del)"
echo ""
