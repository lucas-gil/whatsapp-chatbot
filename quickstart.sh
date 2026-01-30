#!/bin/bash

# 🚀 Quick Start - Iniciar Projeto Completo

echo "
╔════════════════════════════════════════════════════════════════╗
║                   WhatsApp Chatbot Setup                       ║
║                      Versão 1.0.0                             ║
╚════════════════════════════════════════════════════════════════╝
"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}📦 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado!${NC}"
    echo "Baixe em: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# Verificar Docker
echo -e "${BLUE}📦 Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker não está instalado (opcional)${NC}"
else
    echo -e "${GREEN}✅ Docker instalado${NC}"
fi

# Instalar dependências
echo -e "${BLUE}📥 Instalando dependências...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências instaladas${NC}"

# Criar .env
if [ ! -f .env ]; then
    echo -e "${BLUE}🔧 Criando arquivo .env...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Abra .env e preencha suas variáveis de ambiente!${NC}"
else
    echo -e "${GREEN}✅ .env já existe${NC}"
fi

# Iniciar Docker
if command -v docker &> /dev/null; then
    echo -e "${BLUE}🐳 Iniciando Docker Compose...${NC}"
    docker-compose up -d
    sleep 5
    echo -e "${GREEN}✅ Docker iniciado${NC}"
fi

# Migrations
echo -e "${BLUE}🗄️  Aplicando migrations...${NC}"
npm run db:migrate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations aplicadas${NC}"
else
    echo -e "${YELLOW}⚠️  Erro nas migrations (banco pode não estar pronto)${NC}"
fi

# Seed
echo -e "${BLUE}🌱 Carregando dados iniciais...${NC}"
npm run db:seed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed realizado${NC}"
else
    echo -e "${YELLOW}⚠️  Erro no seed${NC}"
fi

echo "
╔════════════════════════════════════════════════════════════════╗
║                    Pronto para começar! 🎉                     ║
╚════════════════════════════════════════════════════════════════╝

📝 Próximos passos:

1. Abra .env e configure:
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_ACCESS_TOKEN
   - WHATSAPP_WEBHOOK_VERIFY_TOKEN
   - OPENAI_API_KEY
   - MERCADO_PAGO_ACCESS_TOKEN

2. Em um terminal, inicie a API:
   cd apps/api && npm run dev

3. Em outro terminal, inicie o Admin:
   cd apps/admin && npm run dev

4. Acesse:
   🤖 API: http://localhost:3000
   🖥️  Admin: http://localhost:3001

📚 Leia o SETUP.md para instruções detalhadas!

"
