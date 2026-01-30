# 📚 Exemplos de API e Payloads

## WhatsApp Webhook Exemplos

### 1. Mensagem de Texto Recebida
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "12345",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "1234567890"
            },
            "messages": [
              {
                "from": "5511988888888",
                "id": "wamid.xxx",
                "timestamp": "1674853200",
                "type": "text",
                "text": {
                  "body": "Oi, tudo bem?"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### 2. Botão Clicado
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511988888888",
                "id": "wamid.xxx",
                "timestamp": "1674853200",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "instalei",
                    "title": "✅ SIM, INSTALEI"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### 3. Opção de Lista Selecionada
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511988888888",
                "type": "interactive",
                "interactive": {
                  "type": "list_reply",
                  "list_reply": {
                    "id": "smartphone",
                    "title": "📱 SMARTPHONE"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### 4. Imagem Recebida
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511988888888",
                "type": "image",
                "image": {
                  "mime_type": "image/jpeg",
                  "sha256": "hash_do_arquivo",
                  "id": "IMAGE_MEDIA_ID"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## API Calls com cURL

### Listar Contatos
```bash
curl -X GET http://localhost:3000/api/contacts \
  -H "Content-Type: application/json"
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "clu1234",
      "phone": "5511988888888",
      "name": "João Silva",
      "status": "prospect",
      "device": "SMARTPHONE",
      "createdAt": "2024-01-19T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Buscar Contato Específico
```bash
curl -X GET http://localhost:3000/api/contacts/5511988888888 \
  -H "Content-Type: application/json"
```

### Atualizar Contato
```bash
curl -X PATCH http://localhost:3000/api/contacts/5511988888888 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "status": "lead"
  }'
```

### Listar Planos
```bash
curl -X GET http://localhost:3000/api/plans \
  -H "Content-Type: application/json"
```

**Resposta:**
```json
[
  {
    "id": "plan1",
    "name": "Básico",
    "description": "Plano mensal com acesso essencial",
    "price": 2999,
    "billingCycle": 30,
    "features": ["Streaming em HD", "1 dispositivo", "Suporte"],
    "active": true,
    "order": 1
  },
  {
    "id": "plan2",
    "name": "Premium",
    "description": "Plano mensal com todos os recursos",
    "price": 5999,
    "billingCycle": 30,
    "features": ["Streaming em 4K", "4 dispositivos", "Download offline"],
    "active": true,
    "order": 2
  }
]
```

### Criar Assinatura (Teste)
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "clu1234",
    "planId": "plan1"
  }'
```

**Resposta:**
```json
{
  "id": "sub1",
  "contactId": "clu1234",
  "planId": "plan1",
  "status": "trial",
  "trialEndsAt": "2024-01-26T10:30:00Z",
  "createdAt": "2024-01-19T10:30:00Z"
}
```

### Criar Pagamento
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub1",
    "contactId": "clu1234",
    "planId": "plan1"
  }'
```

**Resposta:**
```json
{
  "paymentId": "pay1",
  "checkoutUrl": "https://www.mercadopago.com.br/checkout/v1/...",
  "preferenceId": "mp_pref_123"
}
```

### Criar Ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "clu1234",
    "category": "instalacao",
    "subject": "Problema na instalação",
    "description": "Não consigo instalar o app no smartphone"
  }'
```

### Listar Tickets
```bash
curl -X GET "http://localhost:3000/api/tickets?status=open&priority=high" \
  -H "Content-Type: application/json"
```

---

## Exemplos em Node.js

### Enviar Mensagem de Texto
```javascript
const axios = require('axios');

async function sendMessage() {
  const response = await axios.post('http://localhost:3000/api/messages', {
    to: '5511988888888',
    text: 'Olá! Como posso ajudar?'
  });
  
  console.log('Mensagem enviada:', response.data);
}

sendMessage();
```

### Obter Contatos com Status
```javascript
const axios = require('axios');

async function getContacts() {
  const response = await axios.get('http://localhost:3000/api/contacts?status=lead');
  
  response.data.data.forEach(contact => {
    console.log(`${contact.name} - ${contact.phone} (${contact.status})`);
  });
}

getContacts();
```

---

## Webhook Mercado Pago

### Evento: Pagamento Aprovado
```json
{
  "action": "payment.created",
  "data": {
    "id": 1234567890
  }
}
```

**Fluxo no Backend:**
1. Webhook recebido em `/webhooks/mercadopago`
2. Verificar status do pagamento
3. Se `status === "approved"`:
   - Atualizar Subscription para `active`
   - Enviar mensagem WhatsApp ao usuário
   - Registrar evento no banco

---

## Testando com Postman

### 1. Importar Collection
```json
{
  "info": {
    "name": "WhatsApp Chatbot API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Contacts",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/contacts"
      }
    },
    {
      "name": "Create Payment",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/payments/create",
        "body": {
          "mode": "raw",
          "raw": "{\"subscriptionId\": \"sub1\", \"contactId\": \"clu1234\", \"planId\": \"plan1\"}"
        }
      }
    }
  ]
}
```

### 2. Configurar Variáveis
- `base_url`: `http://localhost:3000`

### 3. Executar Requisições

---

## Status Codes

| Código | Significado |
|--------|------------|
| 200    | OK - Sucesso |
| 201    | Created - Recurso criado |
| 400    | Bad Request - Dados inválidos |
| 404    | Not Found - Recurso não existe |
| 500    | Server Error - Erro interno |

---

## Rate Limiting

- **WhatsApp**: 80 mensagens por segundo por número
- **OpenAI**: Conforme seu plano (ex: 3.500 RPM para GPT-4)
- **Mercado Pago**: 600 requisições por minuto

---

## Debugging

### Ver Logs
```bash
# Terminal com npm run dev
tail -f logs/chatbot.log
```

### Verificar Banco
```bash
# Acessar PostgreSQL
psql postgresql://user:password@localhost:5432/whatsapp_chatbot

# Listar contatos
SELECT * FROM "Contact" LIMIT 10;

# Ver conversas
SELECT * FROM "Conversation" LIMIT 10;
```

### Testar Conexão Redis
```bash
redis-cli ping
# Resposta: PONG
```

---

**Precisa de mais exemplos? Abra uma issue no repositório!**
