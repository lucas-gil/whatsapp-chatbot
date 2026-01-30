# 🎬 ChatBot IPTV - Documentação

## 📋 Visão Geral

Chatbot inteligente para WhatsApp que vende e gerencia assinaturas de IPTV. Sistema completo com fluxo de conversação, processamento de pagamentos e suporte.

## 🚀 Funcionalidades

### 1. **Boas-vindas Automáticas**
- Mensagem de boas-vindas ao cliente novo
- Apresentação dos serviços
- Redirecionamento para menu principal

### 2. **Contratação de Planos**
- Apresentação de todos os planos ativos
- Detalhes do preço e características
- Botão de confirmação
- Integração com Mercado Pago para pagamento

### 3. **Renovação de Assinatura**
- Verificação de status da assinatura
- Aviso de expiração
- Opções de renovação
- Múltiplas formas de pagamento (PIX, Crédito, Boleto)

### 4. **Suporte Técnico**
- Menu de categorias de problemas
- Criação automática de tickets
- Atendimento ao vivo com operador
- Rastreamento de chamados

### 5. **Perguntas Frequentes**
- Respostas pré-configuradas
- Categorias de dúvidas
- Integração com IA para respostas personalizadas

### 6. **Estatísticas e Relatórios**
- Total de contatos
- Conversações ativas
- Taxa de conversão
- Assinaturas ativas

---

## 📱 Fluxo de Conversação

```
Usuário envia "oi"
        ↓
    [WELCOME]
        ↓
   Menu Principal
        ↓
   ┌───────┬──────────┬────────┬─────────┐
   ↓       ↓          ↓        ↓         ↓
Contratar Renovar Suporte  FAQ  Voltar
   ↓       ↓          ↓        ↓
  Planos Status    Ticket  Resposta
   ↓       ↓          ↓        ↓
 Pagar  Pagar    Criado   Finalizado
```

---

## 🔧 Instalação e Configuração

### 1. Adicionar o serviço ao índice

Edite [apps/api/src/index.ts](apps/api/src/index.ts):

```typescript
import iptvRoutes from '@/routes/iptv.routes';

// Adicione a rota no express
app.use('/api/iptv', iptvRoutes);
```

### 2. Variáveis de Ambiente

Adicione ao `.env`:

```env
# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_id_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_numero_id_aqui
WHATSAPP_ACCESS_TOKEN=seu_token_aqui
WHATSAPP_VERIFY_TOKEN=seu_verify_token_aqui

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica_aqui

# Banco de Dados
DATABASE_URL=postgresql://...

# IPTV
DEMO_VIDEO_URL=https://seu-servidor.com/demo.mp4
```

### 3. Configurar o Banco de Dados

Execute as migrations:

```bash
cd apps/api
npx prisma migrate dev --name init
```

---

## 📚 Rotas da API

### 1. Webhook (Receber Mensagens)

**POST** `/api/iptv/webhook`

Recebe mensagens do WhatsApp Cloud API.

```bash
curl -X POST http://localhost:3000/api/iptv/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "type": "text",
            "text": {"body": "oi"}
          }]
        }
      }]
    }]
  }'
```

### 2. Enviar Boas-vindas

**POST** `/api/iptv/send-welcome`

```bash
curl -X POST http://localhost:3000/api/iptv/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999"}'
```

Response:
```json
{
  "success": true,
  "message": "Welcome message sent"
}
```

### 3. Enviar Mensagem Customizada

**POST** `/api/iptv/send-custom`

```bash
curl -X POST http://localhost:3000/api/iptv/send-custom \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "🎬 Aproveite 30% de desconto em todos os planos!"
  }'
```

### 4. Enviar Mensagens em Massa

**POST** `/api/iptv/send-bulk`

```bash
curl -X POST http://localhost:3000/api/iptv/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "phones": ["5511999999999", "5511888888888"],
    "message": "🎬 Aproveite 30% de desconto!"
  }'
```

Response:
```json
{
  "success": true,
  "results": [
    {"phone": "5511999999999", "status": "sent"},
    {"phone": "5511888888888", "status": "sent"}
  ]
}
```

### 5. Obter Informações do Contato

**GET** `/api/iptv/contact/:phone`

```bash
curl http://localhost:3000/api/iptv/contact/5511999999999
```

Response:
```json
{
  "id": "uuid",
  "phone": "5511999999999",
  "name": "João Silva",
  "status": "cliente",
  "subscriptions": [
    {
      "id": "uuid",
      "status": "active",
      "plan": {
        "name": "Premium",
        "price": 2999
      },
      "expiresAt": "2026-02-19"
    }
  ]
}
```

### 6. Estatísticas Gerais

**GET** `/api/iptv/stats`

```bash
curl http://localhost:3000/api/iptv/stats
```

Response:
```json
{
  "totalContacts": 1250,
  "totalConversations": 1250,
  "totalMessages": 5420,
  "activeSubscriptions": 847
}
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Cliente Novo Buscando Informações

```
Cliente: "Oi"
Bot:     "🎬 Bem-vindo ao IPTV Streaming! 🎬

          Somos sua melhor opção para assistir:
          ✅ Filmes e séries em HD/4K
          ✅ Canais ao vivo 24h
          ✅ Esportes, documentários e muito mais
          
          O que você gostaria de fazer?"
          [Botões: Contratar, Renovar, Suporte, Dúvidas]

Cliente: [Clica em "Contratar Plano"]
Bot:     "🎁 Nossos Planos IPTV 🎁

          Escolha o plano que melhor se encaixa para você:"
          [Lista de planos com preços]

Cliente: [Seleciona "Premium - R$ 29,90/mês"]
Bot:     "✨ Você selecionou o plano: ✨
          
          📺 Premium
          R$ 29,90/mês
          ✅ 4 streams simultâneos
          ✅ 4K
          
          [Botões: Confirmar, Voltar]"

Cliente: [Clica em "Confirmar"]
Bot:     "💳 Selecione a forma de pagamento:
          [PIX, Cartão de Crédito, Boleto]"
```

### Exemplo 2: Cliente Renovando Assinatura

```
Cliente: "Preciso renovar"
Bot:     "✅ Sua assinatura está ATIVA!
          
          Plano: Premium
          Vencimento: 19/02/2026
          
          Deseja renovar agora?"
          [Botões: Renovar Agora, Voltar]

Cliente: [Clica em "Renovar Agora"]
Bot:     "💳 Selecione a forma de pagamento:
          [PIX, Cartão de Crédito, Boleto]"
```

### Exemplo 3: Cliente com Problema Técnico

```
Cliente: "Não consigo conectar"
Bot:     "🛠️ SUPORTE TÉCNICO 🛠️
          
          Como posso ajudá-lo?"
          [Erro técnico, Lentidão, Outro, Dúvida técnica]

Cliente: [Clica em "Erro técnico"]
Bot:     "📝 Por favor, descreva com detalhes o problema
          (Máximo 500 caracteres)"

Cliente: "Abro o app mas não conecta no servidor"
Bot:     "✅ Seu chamado foi registrado. Nosso suporte 
          entrará em contato em breve!
          
          🆔 ID do Chamado: #SUPORTE-1705688400000"
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### contacts
```sql
id (UUID)
phone (String) - Chave única
name (String) - Opcional
email (String) - Opcional
status (enum) - prospect | lead | negociacao | cliente | encerrado
device (String) - Dispositivo preferido
createdAt (DateTime)
updatedAt (DateTime)
```

#### conversations
```sql
id (UUID)
contactId (UUID) - FK para contacts
step (String) - Estado atual do fluxo
stepData (JSON) - Dados contextuais do step
lastActivityAt (DateTime)
createdAt (DateTime)
```

#### subscriptions
```sql
id (UUID)
contactId (UUID) - FK para contacts
planId (UUID) - FK para plans
status (enum) - trial | active | expired | cancelled
expiresAt (DateTime)
mercadopagoId (String) - ID do Mercado Pago
createdAt (DateTime)
```

#### tickets
```sql
id (UUID)
contactId (UUID) - FK para contacts
category (enum) - erro_tecnico | pagamento | outro
priority (enum) - low | normal | high | urgent
status (enum) - open | in_progress | resolved | closed
subject (String)
description (Text)
createdAt (DateTime)
updatedAt (DateTime)
```

---

## 🔐 Segurança

### Autenticação Webhook

Configure o verify token no WhatsApp Cloud API:

1. Acesse [Facebook App Dashboard](https://developers.facebook.com)
2. Vá até "Configurações de Webhook"
3. Configure o token de verificação (mesma variável `WHATSAPP_VERIFY_TOKEN`)

### Proteção de Dados

- 🔒 Todos os dados sensíveis são criptografados no banco
- 🔒 Tokens de acesso nunca são armazenados em logs
- 🔒 Comunicação com WhatsApp API via HTTPS
- 🔒 Rate limiting ativo (máx 60 mensagens/min por contato)

---

## 📊 Métricas e KPIs

### Acompanhar Desempenho

```javascript
// Via /api/iptv/stats
{
  "conversionRate": (activeSubscriptions / totalContacts) * 100,
  "engagementRate": (totalMessages / totalConversations),
  "avgSessionDuration": "cálculo em desenvolvimento"
}
```

### Dashboards Disponíveis

- Admin Panel: [http://localhost:3001](http://localhost:3001)
- Relatórios: Acesso em "Relatórios" → "IPTV"

---

## 🐛 Troubleshooting

### Mensagens não chegam

**Problema:** Mensagens não aparecem no WhatsApp

**Solução:**
- Verifique token de acesso: `echo $WHATSAPP_ACCESS_TOKEN`
- Teste a conexão: `POST /api/iptv/send-welcome`
- Verifique logs: `docker logs api`

### Banco não conecta

**Problema:** "Error connecting to database"

**Solução:**
```bash
# Verificar conexão
psql $DATABASE_URL -c "SELECT 1"

# Resetar migrations
npx prisma migrate reset
```

### Fluxo travado

**Problema:** Cliente preso em um step

**Solução:**
```bash
# Forçar retorno ao menu principal
curl -X POST http://localhost:3000/api/iptv/send-custom \
  -d '{"phone": "5511999999999", "message": "menu"}'
```

---

## 📞 Suporte e Contato

- 📧 Email: suporte@iptvstreamng.com
- 💬 WhatsApp: [Seu número]
- 🐙 GitHub Issues: [Link do repositório]

---

## 📄 Licença

MIT License - Veja LICENSE.md para detalhes

---

**Desenvolvido com ❤️ para vendas de IPTV**
