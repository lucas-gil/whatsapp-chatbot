# 🤖 Integração de IA com Gemini - Guia Completo

## 📋 Sumário
Este documento descreve como usar a nova funcionalidade de **Vendedor Virtual com IA** integrada ao seu sistema WhatsApp Chatbot.

---

## 🚀 Passo 1: Obter Chave da API Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Clique em **"Get API Key"** (canto superior direito)
3. Selecione **"Create API key in new project"**
4. Copie a chave gerada

---

## 🔑 Passo 2: Configurar Variável de Ambiente

### Windows (PowerShell)
```powershell
# Editar o arquivo .env na pasta apps/api
# OU defina como variável de ambiente:
$env:GEMINI_API_KEY = "sua_chave_aqui"
```

### Linux/Mac
```bash
export GEMINI_API_KEY="sua_chave_aqui"
```

**Arquivo `.env` (na pasta `apps/api`):**
```
GEMINI_API_KEY=sua_chave_gemini_aqui
```

---

## 📦 Passo 3: Configurar Seu Produto no Painel Admin

1. Acesse o painel admin: **http://localhost:3001**
2. No menu lateral, clique em **"⚙️ Configurar Produto"**
3. Preencha os dados:
   - **Nome da Loja/Produto**: Ex: "Infinity One IPTV"
   - **Descrição**: Detalhe os benefícios, características, diferenciais
   - **Preço**: Ex: "R$ 29,90/mês"
   - **Prazo**: Ex: "Imediato" ou "24 horas"
   - **Garantia**: Ex: "7 dias de garantia"
   - **Estoque**: Selecione o status

4. Clique em **"Salvar Configurações"**

---

## 🧪 Passo 4: Testar o Vendedor Virtual

Na mesma página, abaixo, há uma seção **"🤖 Testar Vendedor Virtual"**:

1. Digite uma mensagem como cliente:
   - "Qual é o preço?"
   - "Funciona em qual aplicativo?"
   - "Tem garantia?"
   - "Como faço para comprar?"

2. Clique em **"Testar Resposta"**

3. A IA irá gerar uma resposta personalizada seguindo o **prompt de vendas**

---

## 💬 Regras do Prompt (Automáticas)

A IA responde seguindo estas regras de ouro:

### ✅ Obrigações
1. **Nunca deixar sem resposta**: Acolhimento + 1-3 perguntas + próximo passo
2. **Não inventar dados**: Se faltar info, pede ao cliente ou ao dono
3. **Persuasão ética**: Destaca benefícios reais, não engana
4. **CTA claro**: Finaliza com ação (ex: "Quer gerar link de pagamento?")
5. **Respostas curtas**: Máximo 3 emojis, linguagem simples
6. **Segurança**: Recusa pedidos ilegais, oferece alternativa

### 🎯 Exemplo de Resposta

**Cliente:** "Quanto custa?"

**IA (Vendedor Virtual):**
```
Ótimo! 😊

Oferecemos planos a partir de R$ 29,90/mês com:
✅ Todos os canais
✅ Filmes em 4K
✅ Esportes ao vivo

Qual seria seu perfil?
1️⃣ Apenas TV aberta
2️⃣ Completo com tudo
```

---

## 🔗 Endpoints da API

### GET `/api/product/data`
Obtém dados do produto configurado

**Resposta:**
```json
{
  "success": true,
  "product": {
    "name": "Infinity One IPTV",
    "description": "...",
    "price": "R$ 29,90/mês",
    "warranty": "7 dias",
    "shippingTime": "Imediato",
    "stockStatus": "Em estoque"
  }
}
```

---

### POST `/api/product/data`
Atualiza dados do produto

**Requisição:**
```json
{
  "name": "Infinity One IPTV",
  "description": "Descrição do produto...",
  "price": "R$ 29,90/mês",
  "warranty": "7 dias de garantia",
  "shippingTime": "Imediato",
  "stockStatus": "Em estoque"
}
```

---

### POST `/api/ai/generate-response`
Gera resposta com IA para mensagem do cliente

**Requisição:**
```json
{
  "message": "Qual é o preço?"
}
```

**Resposta:**
```json
{
  "success": true,
  "response": "Ótimo! Nosso plano custa R$ 29,90/mês com..."
}
```

---

## 🛠️ Integração com WhatsApp Automático

Se quiser usar IA para responder AUTOMATICAMENTE no WhatsApp:

### 1. Modificar o arquivo `whatsapp-web-server.js`

Localize a seção onde processa mensagens recebidas e adicione:

```javascript
const { processMessageWithAI } = require('./src/ai-processor');

// Quando receber mensagem
client.on('message', async (message) => {
  if (!message.fromMe) {
    // Tenta IA primeiro
    const aiResponse = await processMessageWithAI(message.body);
    
    if (aiResponse) {
      await message.reply(aiResponse);
    }
  }
});
```

---

## ⚙️ Configurações Avançadas

### Limite de Caracteres
- Mensagens cliente: **500 caracteres**
- Resposta IA: **1000 caracteres** (limite WhatsApp)

### Modelo Gemini
Atualmente usando: **`gemini-pro`**

Para usar modelo mais novo:
```javascript
// Em src/gemini-config.js
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
```

### Timeout
Se a IA demorar muito, ajuste em `.env`:
```
GEMINI_TIMEOUT=30000  // 30 segundos
```

---

## 🐛 Solução de Problemas

### ❌ "Erro ao chamar Gemini"

**Causa:** Chave API inválida ou não configurada

**Solução:**
```bash
# Verificar variável de ambiente
echo $GEMINI_API_KEY  # Linux/Mac
echo %GEMINI_API_KEY%  # Windows

# Se vazio, configure novamente
```

---

### ❌ "Nenhuma resposta gerada"

**Causa:** Mensagem muito vaga ou API com problema

**Solução:** 
- Tente uma pergunta mais específica
- Verifique conexão com internet
- Verifique logs do servidor

---

### ❌ "Resposta cortada ou incompleta"

**Causa:** Limite de caracteres do WhatsApp

**Solução:** 
- IA já limita a 1000 caracteres
- Divida em múltiplas mensagens (manual)

---

## 📚 Exemplos de Uso

### Exemplo 1: Loja de IPTV
```
Nome: Infinity One IPTV
Descrição: Serviço de IPTV com +5000 canais, filmes em 4K, esportes ao vivo...
Preço: R$ 29,90/mês
Garantia: 7 dias de garantia ou devolução do dinheiro
Prazo: Ativação imediata
```

### Exemplo 2: Loja de Roupas
```
Nome: Moda Prime
Descrição: Roupas de moda com frete grátis, trocas fáceis...
Preço: A partir de R$ 49,90
Garantia: 30 dias para trocar
Prazo: 3-5 dias úteis
```

---

## 🎓 Dicas de Sucesso

1. **Descrição Detalhada**: Quanto mais informações, melhor a IA responde
2. **Atualizar Dados**: Mude preço/promoções regularmente
3. **Testar Antes**: Use a seção de teste antes de aplicar no WhatsApp
4. **Monitorar**: Veja as respostas que a IA está gerando
5. **Feedback**: Se uma resposta for ruim, refine a descrição do produto

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do servidor (`apps/api`)
2. Teste o endpoint `/api/ai/generate-response` direto
3. Verifique se a chave Gemini está ativa em [aistudio.google.com](https://aistudio.google.com)

---

**Versão:** 1.0.0  
**Última atualização:** 26/01/2026
