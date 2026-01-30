# 🔧 Guia de Configuração Passo-a-Passo

## 1️⃣ WhatsApp Business Account

### Passo 1: Criar Meta Developer Account
1. Acesse [https://developers.facebook.com/](https://developers.facebook.com/)
2. Clique em **"Começar"**
3. Faça login com sua conta Facebook ou crie uma

### Passo 2: Criar App
1. Clique em **"Meus Apps"** (canto superior direito)
2. Clique em **"Criar App"**
3. Escolha:
   - **Tipo de app**: Empresa
   - **Objetivo**: Gerenciamento de Negócios
4. Preencha as informações:
   - **Nome do App**: `WhatsApp Chatbot`
   - **Email**: seu@email.com
   - **Telefone**: seu número
5. Clique em **"Criar App"**

### Passo 3: Adicionar WhatsApp
1. Na dashboard, clique em **"Adicionar Produto"**
2. Procure por **"WhatsApp"**
3. Clique em **"Configurar"**
4. Escolha **"Usar Cloud API"**

### Passo 4: Registrar Número de Telefone
1. Na aba **WhatsApp**, vá em **"Configurações"**
2. Clique em **"Registrar Número"**
3. Preencha:
   - **País**: Brasil
   - **Número de Telefone**: seu número (ex: 11999999999)
   - **Nome da Empresa**: seu nome/marca
4. Verifique o código recebido por SMS/chamada
5. Clique em **"Verificar e Registrar"**

### Passo 5: Obter Token de Acesso
1. Vá em **"Configurações"** → **"Configurações da Conta"**
2. Clique em **"Gerar Token"**
3. Copie o token exibido (salve em local seguro!)

### Passo 6: Obter IDs
1. Na mesma página, copie:
   - **ID do Número de Telefone**: `WHATSAPP_PHONE_NUMBER_ID`
   - **ID da Conta Comercial**: `WHATSAPP_BUSINESS_ACCOUNT_ID`

### Passo 7: Configurar Webhook
1. Vá em **"Configurações"** → **"Webhook do WhatsApp"**
2. Clique em **"Editar URL de Callback"**
3. Preencha:
   - **URL**: `https://seu-dominio.com/webhook`
   - **Token de Verificação**: crie uma senha (ex: `abc123xyz`)
4. Clique em **"Verificar e Salvar"**
5. Após salvar, clique em **"Inscrever"** e selecione:
   - ✅ messages
   - ✅ message_status

---

## 2️⃣ OpenAI (IA)

### Passo 1: Criar Conta
1. Acesse [https://platform.openai.com/](https://platform.openai.com/)
2. Clique em **"Sign up"**
3. Use email ou Google/Microsoft
4. Preencha os dados

### Passo 2: Ir para API Keys
1. Clique em seu avatar (canto superior direito)
2. Selecione **"API keys"**
3. Clique em **"Create new secret key"**
4. Copie a chave (exemplo: `sk-proj-...`)
5. Salve em um lugar seguro!

### Passo 3: Adicionar Créditos (Opcional)
Para usar, você precisa adicionar um método de pagamento:
1. Vá em **"Billing"** → **"Overview"**
2. Clique em **"Set up paid account"**
3. Adicione cartão de crédito

---

## 3️⃣ Mercado Pago (Pagamentos)

### Passo 1: Criar Conta
1. Acesse [https://www.mercadopago.com.br/](https://www.mercadopago.com.br/)
2. Clique em **"Criar conta"**
3. Use email ou conta existente

### Passo 2: Ativar Modo Produtor
1. Depois de logar, vá em **"Conta"** → **"Configurações"**
2. Clique em **"Usuário"** → **"Tipo de conta"**
3. Selecione **"Vendedor"** → **"Continuar"**

### Passo 3: Obter Credenciais
1. Vá em **"Ferramentas de Desenvolvedores"**
2. Clique em **"Credenciais"**
3. Você verá:
   - **Access Token**
   - **Public Key**
4. Copie ambos

---

## 4️⃣ Atualizar .env

```bash
# Abra o arquivo .env na raiz do projeto e preencha:

# ===== WHATSAPP =====
WHATSAPP_BUSINESS_ACCOUNT_ID=<ID_DA_CONTA_COMERCIAL>
WHATSAPP_PHONE_NUMBER_ID=<ID_DO_NÚMERO_DE_TELEFONE>
WHATSAPP_ACCESS_TOKEN=<TOKEN_DE_ACESSO>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<SUA_SENHA_WEBHOOK>

# ===== IA (OpenAI) =====
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo

# ===== MERCADO PAGO =====
MERCADO_PAGO_ACCESS_TOKEN=<ACCESS_TOKEN>
MERCADO_PAGO_PUBLIC_KEY=<PUBLIC_KEY>

# ===== BANCO DE DADOS =====
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_chatbot
REDIS_URL=redis://localhost:6379

# ===== ADMIN =====
ADMIN_SECRET=sua_senha_super_segura
JWT_SECRET=sua_chave_jwt_aleatoria

# ===== MARCA =====
BRAND_NAME=Sua Marca
BRAND_DESCRIPTION=Descrição da sua marca
DEMO_VIDEO_URL=https://link-do-seu-video.mp4
```

---

## 5️⃣ Iniciar Banco de Dados

### Com Docker
```bash
# Terminal 1
npm run docker:up

# Aguarde 10 segundos para PostgreSQL iniciar
```

### Verificar se está rodando
```bash
docker ps
```

Você deverá ver:
```
whatsapp_chatbot_db
whatsapp_chatbot_redis
```

---

## 6️⃣ Preparar Banco de Dados

```bash
# Aplicar migrations
npm run db:migrate

# Seed com dados iniciais
npm run db:seed
```

---

## 7️⃣ Iniciar Desenvolvimento

### Terminal 1: API
```bash
cd apps/api
npm run dev
```

Você deve ver:
```
🚀 Servidor rodando em http://localhost:3000
```

### Terminal 2: Admin (nova aba)
```bash
cd apps/admin
npm run dev
```

Você deve ver:
```
► Ready in 2.5s
```

---

## 8️⃣ Testar Webhook Localmente

Se estiver desenvolvendo local, use **ngrok** para expor seu webhook:

```bash
# Instalar ngrok (uma vez)
npm install -g ngrok

# Rodar ngrok
ngrok http 3000
```

Você verá algo como:
```
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

### Atualizar Webhook no Meta
1. Vá em **WhatsApp** → **Configurações** → **Webhook do WhatsApp**
2. Clique em **"Editar URL de Callback"**
3. Mude para: `https://abc123.ngrok.io/webhook`
4. Clique em **"Verificar e Salvar"**

---

## 9️⃣ Testar Primeira Mensagem

1. Abra WhatsApp no seu celular
2. Envie uma mensagem para o número registrado
3. Você deve receber a resposta do bot!

Se não receber:
- ✅ Conferir logs no terminal (npm run dev)
- ✅ Verificar se Verify Token está correto
- ✅ Verificar se .env tem todas as variáveis

---

## 🔟 Acessar Admin

1. Abra [http://localhost:3001](http://localhost:3001)
2. Você verá o dashboard com:
   - Total de Contatos
   - Chats Ativos
   - Tickets Abertos
   - Clientes

---

## ✅ Checklist Final

- [ ] WhatsApp Business Account criado
- [ ] Número registrado e verificado
- [ ] Token de Acesso copiado
- [ ] OpenAI API Key obtida
- [ ] Mercado Pago credenciais copiadas
- [ ] .env preenchido
- [ ] Docker rodando (PostgreSQL + Redis)
- [ ] `npm run db:migrate` executado
- [ ] `npm run db:seed` executado
- [ ] API rodando em `localhost:3000`
- [ ] Admin rodando em `localhost:3001`
- [ ] Primeira mensagem recebida e respondida

---

**Tudo funcionando? 🎉 Comece a criar mensagens e customizar o bot!**

Para próximas etapas, leia o README.md principal.
