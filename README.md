# 🤖 WhatsApp Chatbot com IA - Guia Completo

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Requisitos](#requisitos)
3. [Instalação Rápida](#instalação-rápida)
4. [Configuração](#configuração)
5. [Arquitetura](#arquitetura)
6. [Fluxo de Conversação](#fluxo-de-conversação)
7. [APIs](#apis)
8. [Deploy](#deploy)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

**Webot Chatbot** é um sistema completo de atendimento por WhatsApp com:

✅ **Integração WhatsApp Cloud API** - Envio/recebimento de mensagens, botões, listas, mídia  
✅ **IA Inteligente** - OpenAI/Gemini com RAG (base de conhecimento)  
✅ **Motor de Fluxo** - State machine para controlar conversas  
✅ **CRM Automático** - Funil de vendas com 5 estágios  
✅ **Pagamentos** - Integração Mercado Pago (PIX, cartão)  
✅ **Painel Admin** - Next.js com dashboard de contatos e tickets  
✅ **Multi-dispositivo** - Instruções customizadas por device  
✅ **Suporte Técnico** - Sistema de tickets integrado  

---

## 📦 Requisitos

- **Node.js** 20+
- **Docker** e **Docker Compose** (para PostgreSQL + Redis)
- **Git**
- Chaves de API:
  - WhatsApp Business Account (Meta)
  - OpenAI ou Google Gemini
  - Mercado Pago (opcional)
  - Telegram (para notificações - opcional)

---

## 🚀 Instalação Rápida

### 1. Clonar/Baixar Projeto
```bash
cd c:\Users\tranf\whatsapp-chatbot
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Editar .env com suas chaves
```

### 4. Iniciar Banco de Dados
```bash
npm run docker:up
# Aguardar PostgreSQL + Redis iniciarem
```

### 5. Preparar Banco
```bash
npm run db:migrate
npm run db:seed
```

### 6. Iniciar Projetos
```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Admin (em outra aba)
cd apps/admin
npm run dev
```

**URLs:**
- 🤖 API: `http://localhost:3000`
- 🖥️ Admin: `http://localhost:3001`

---

## 🔧 Configuração

### WhatsApp Cloud API Setup

#### 1. Criar App Meta
1. Acesse [developers.facebook.com](https://developers.facebook.com/)
2. Clique em "Meus Apps" → "Criar App"
3. Escolha tipo: **Empresa** → Caso de uso: **Gerenciamento de Negócios**
4. Preencha informações

#### 2. Configurar WhatsApp
1. No app, clique em **Adicionar Produto**
2. Procure por **WhatsApp** → Adicione
3. Vá em **Configurações** → **Tokens de Acesso**
4. Copie o **Token** permanente

#### 3. Registrar Número
1. Em **Seleção de Número**, clique em **Registrar Número**
2. Escolha seu país e número
3. Copie o **Phone Number ID**

#### 4. Configurar Webhook
1. Em **Configurações do Webhook**, clique em **Editar Callback URL**
2. URL: `https://seu-dominio.com/webhook`
3. Verify Token: Crie uma senha aleatória
4. Inscrever em: `messages`, `message_status`

#### 5. Atualizar .env
```bash
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=sua_senha
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_business_account_id
```

### Configurar IA (OpenAI)

#### 1. Obter API Key
1. Acesse [platform.openai.com](https://platform.openai.com/)
2. Clique em **API Keys** → **Create new secret key**
3. Copie a chave

#### 2. Atualizar .env
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

### Configurar Mercado Pago (Pagamentos)

#### 1. Obter Credenciais
1. Acesse [www.mercadopago.com.br](https://www.mercadopago.com.br/)
2. Vá em **Conta** → **Configurações** → **Credenciais**
3. Copie **Access Token** e **Public Key**

#### 2. Atualizar .env
```bash
MERCADO_PAGO_ACCESS_TOKEN=seu_token
MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica
```

### Banco de Dados

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_chatbot
REDIS_URL=redis://localhost:6379
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│             WhatsApp Cloud API                      │
│         (Mensagens chegam aqui)                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         Webhook POST /webhook                       │
│      (apps/api/src/routes/whatsapp.routes.ts)      │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ FlowService      │  │ AIService        │
│ (State Machine)  │  │ (IA + RAG)       │
└────┬─────────────┘  └────┬─────────────┘
     │                     │
     └──────────┬──────────┘
                ▼
┌─────────────────────────────────────────────────────┐
│        PrismaClient (Banco de Dados)                │
│  PostgreSQL: Contatos, Conversas, Tickets, Planos  │
└─────────────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│   Redis (Cache)  │  │ Mercado Pago API │
│  (Sessões)       │  │ (Pagamentos)     │
└──────────────────┘  └──────────────────┘
```

---

## 💬 Fluxo de Conversação

### FLUXO A: Bem-vindo
```
Usuário: "Oi"
    ↓
Bot envia vídeo + boas-vindas
    ↓
Bot oferece seleção de dispositivo (botões)
    ↓ Estado: device_selection
```

### FLUXO B: Seleção de Dispositivo
```
Usuário clica: "📱 SMARTPHONE"
    ↓
Bot envia instruções + 3 imagens
    ↓
Bot oferece: "SIM, INSTALEI" ou "NÃO CONSEGUI"
    ↓ Estado: installation_instructions
```

### FLUXO C: Comprovante de Instalação
```
Usuário: "SIM, INSTALEI"
    ↓
Bot solicita print da tela
    ↓
Usuário envia foto
    ↓
Bot salva anexo + cria ticket para suporte
    ↓ Estado: main_menu
```

### FLUXO D: Menu Principal
```
Bot oferece:
 - CONTRATAR PLANO 💎
 - RENOVAÇÃO ♻️
 - SUPORTE TÉCNICO 🛠️
 - DÚVIDAS ❓
 ↓ Estado: main_menu
```

### FLUXO E: Contratação
```
Usuário: "CONTRATAR PLANO"
    ↓
Bot lista planos com preços
    ↓
Usuário escolhe: "Premium - R$ 59,99/mês"
    ↓
Bot cria assinatura + gera link Mercado Pago
    ↓
Bot envia link de pagamento via WhatsApp
    ↓ Estado: contratar_menu
```

### FLUXO F: Pagamento Aprovado
```
Webhook Mercado Pago: payment.approved
    ↓
Assinatura marcada como "active"
    ↓
Bot envia mensagem: "Bem-vindo! Acesso liberado ✅"
    ↓
Contato avança para status "cliente"
```

---

## 📡 APIs

### Webhook WhatsApp
```
GET /webhook?mode=subscribe&token=TOKEN&challenge=CHALLENGE
POST /webhook (receber mensagens)
```

### Contatos
```
GET /api/contacts - Listar
GET /api/contacts/:phone - Detalhes
PATCH /api/contacts/:phone - Atualizar
GET /api/contacts/:phone/conversations - Histórico
```

### Planos
```
GET /api/plans - Listar planos
POST /api/subscriptions - Criar assinatura
GET /api/contacts/:contactId/subscriptions - Assinaturas do contato
```

### Pagamentos
```
POST /api/payments/create - Criar pagamento
GET /api/payments/:paymentId - Status
POST /webhooks/mercadopago - Webhook MP
```

### Tickets
```
POST /api/tickets - Criar
GET /api/tickets - Listar
GET /api/tickets/:id - Detalhes
PATCH /api/tickets/:id - Atualizar
```

---

## 🐳 Deploy com Docker

### Build Local
```bash
docker-compose up -d
```

### Deploy em Produção (Railway/Render)

#### 1. Criar Dockerfile da API
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY apps/api ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. Variáveis de Ambiente (Railway)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
WHATSAPP_ACCESS_TOKEN=...
OPENAI_API_KEY=...
NODE_ENV=production
```

#### 3. Deploy Manual
```bash
# Railway
railway up

# Render
git push heroku main
```

---

## 🐛 Troubleshooting

### Webhook não recebe mensagens
- ✅ Verificar se URL está acessível (use ngrok para local)
- ✅ Conferir Verify Token em `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- ✅ Ver logs: `npm run dev` e procure por "Webhook"

### IA retorna respostas genéricas
- ✅ Verificar `OPENAI_API_KEY`
- ✅ Atualizar prompt em `src/config/environment.ts`
- ✅ Adicionar docs à `KnowledgeBase` via admin

### Pagamento não funciona
- ✅ Verificar `MERCADO_PAGO_ACCESS_TOKEN`
- ✅ Confirmar se em modo produção (não sandbox)
- ✅ Ver webhook: `/webhooks/mercadopago`

### PostgreSQL recusa conexão
```bash
# Reiniciar containers
docker-compose down
docker-compose up -d
```

### Erro: "Telegram não configurado"
- Isso é esperado se não tiver `TELEGRAM_BOT_TOKEN`
- Sistema continua funcionando normalmente
- Para ativar notificações, configure as variáveis

---

## 📚 Exemplos de Payload

### Webhook Recebido
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5511999999999",
          "type": "text",
          "text": { "body": "Oi" }
        }]
      }
    }]
  }]
}
```

### Resposta de Botão
```json
{
  "messages": [{
    "from": "5511999999999",
    "type": "interactive",
    "interactive": {
      "type": "button_reply",
      "button_reply": {
        "id": "btn_1",
        "title": "SIM, INSTALEI"
      }
    }
  }]
}
```

### Webhook Mercado Pago
```json
{
  "action": "payment.approved",
  "data": {
    "id": "1234567890"
  }
}
```

---

## 📞 Suporte

- **Docs**: [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- **OpenAI**: [API Reference](https://platform.openai.com/docs)
- **Mercado Pago**: [Dev Docs](https://www.mercadopago.com.br/developers)

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026  
**Autor**: Seu Nome
