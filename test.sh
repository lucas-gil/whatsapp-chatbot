#!/bin/bash
# Script de testes básicos para o chatbot

echo "🧪 Iniciando testes do Chatbot WhatsApp..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3000"

# 1. Health Check
echo -e "${YELLOW}[1] Testando health check...${NC}"
HEALTH=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/health")
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ API está respondendo${NC}"
else
    echo -e "${RED}❌ API não está respondendo (HTTP $HEALTH)${NC}"
    echo "Inicie com: cd apps/api && npm run dev"
    exit 1
fi
echo ""

# 2. Listar Planos
echo -e "${YELLOW}[2] Testando GET /api/plans...${NC}"
PLANS=$(curl -s "$API_URL/api/plans" | jq length)
echo -e "${GREEN}✅ $PLANS planos encontrados${NC}"
echo ""

# 3. Listar Contatos
echo -e "${YELLOW}[3] Testando GET /api/contacts...${NC}"
CONTACTS=$(curl -s "$API_URL/api/contacts" | jq '.data | length')
echo -e "${GREEN}✅ $CONTACTS contatos encontrados${NC}"
echo ""

# 4. Verificar Banco de Dados
echo -e "${YELLOW}[4] Verificando PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    psql -U user -h localhost -d whatsapp_chatbot -c "SELECT COUNT(*) as contacts FROM \"Contact\"" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PostgreSQL conectado${NC}"
    else
        echo -e "${RED}❌ Erro ao conectar PostgreSQL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  psql não instalado (pulando)${NC}"
fi
echo ""

# 5. Verificar Redis
echo -e "${YELLOW}[5] Verificando Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    REDIS_STATUS=$(redis-cli ping 2>/dev/null)
    if [ "$REDIS_STATUS" = "PONG" ]; then
        echo -e "${GREEN}✅ Redis conectado${NC}"
    else
        echo -e "${RED}❌ Redis não respondendo${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli não instalado (pulando)${NC}"
fi
echo ""

echo -e "${GREEN}🎉 Testes concluídos!${NC}"
echo ""
echo "Próximas etapas:"
echo "1. Configure seu .env com credenciais"
echo "2. Inicie os webhooks do WhatsApp"
echo "3. Teste enviando uma mensagem via WhatsApp"
