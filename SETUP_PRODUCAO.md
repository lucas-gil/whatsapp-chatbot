# 🚀 Guia de Setup para Produção - WhatsApp Chatbot Baileys

## ⚡ Início Rápido (5 minutos)

### 1. Pré-requisitos
- **Node.js**: 16+ (download em https://nodejs.org)
- **Git** (optional, para clonar o repositório)
- **Windows/Linux/Mac**: Compatível com qualquer OS

### 2. Clone ou Copie o Projeto
```bash
# Option A: Clone do repositório
git clone <seu-repositorio> whatsapp-chatbot
cd whatsapp-chatbot

# Option B: Copie os arquivos e extraia no seu PC
# Depois entre na pasta:
cd whatsapp-chatbot
```

### 3. Instale as Dependências
```bash
npm install
```

### 4. Inicie o Sistema
```bash
# Opção A: Desenvolvimento (com hot reload)
npm run dev

# Opção B: Produção
npm run build
npm start
```

**Pronto!** A aplicação estará rodando:
- 🔗 Admin Dashboard: http://localhost:3001
- 🔌 API WhatsApp: http://localhost:3000

---

## 📱 Como Usar

### 1. Abrir o Painel de Admin
1. Acesse http://localhost:3001 no navegador
2. Vá para a aba "WhatsApp"
3. Clique em **"Gerar QR Code REAL"**

### 2. Conectar o WhatsApp
1. Um QR code aparecerá na tela
2. Abra o **WhatsApp no seu celular**
3. Vá para: **Configurações → Dispositivos Conectados → Conectar um Dispositivo**
4. **Escaneie o QR code** com a câmera do celular
5. Confirme a autenticação

### 3. Status da Conexão
- ✅ Conectado: Você verá "WhatsApp Conectado!" com o número
- 💬 Mensagens: Todas as mensagens recebidas aparecem na lista
- 🤖 Auto-reply: Respostas automáticas são enviadas automaticamente

### 4. Enviar Mensagens
1. Clique em uma conversa na lista
2. Digite a mensagem
3. Clique "Enviar"

### 5. Broadcast (Enviar para Todos)
1. Escreva a mensagem na seção "Broadcast"
2. Clique "Enviar para Todos"
3. A mensagem será enviada para todos que já enviaram mensagens

---

## 🔧 Configuração Avançada

### Variáveis de Ambiente (Opcional)
Crie um arquivo `.env` na raiz do projeto:

```bash
# API Configuration
PORT=3000
NODE_ENV=production
API_URL=http://localhost:3000

# Database (Opcional, para futuro uso)
DATABASE_URL=sqlite:./data/database.db

# Admin Config
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Mudança de Portas
Se as portas 3000 ou 3001 já estão em uso:

1. **Edite** `apps/api/src/index.ts` (linha com `PORT`)
2. **Edite** `apps/admin/next.config.js` ou use variável de ambiente

```bash
# Ou use no terminal:
PORT=3002 npm run dev
```

---

## 🐳 Usar com Docker (Opcional)

### Instalar Docker
- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt-get install docker.io`

### Iniciar com Docker
```bash
docker-compose up -d
```

A aplicação estará pronta em:
- Admin: http://localhost:3001
- API: http://localhost:3000

---

## 🤖 Personalizar Respostas Automáticas

### Editar Auto-reply
Abra [apps/api/src/index.ts](apps/api/src/index.ts) e procure por `getAutoReply`:

```typescript
const getAutoReply = (text) => {
  const msg = (text || '').toLowerCase();
  
  // Adicione suas próprias regras:
  if (msg.includes('produtos')) {
    return '📦 Confira nossos produtos...';
  }
  
  return '🤖 Mensagem padrão...';
};
```

**Salve** e o sistema recarregará automaticamente em desenvolvimento.

---

## 🔍 Troubleshooting

### ❌ "Porta 3000 já em uso"
```bash
# Windows: Procure qual processo está usando a porta
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000

# Solução: Use outra porta
PORT=3002 npm run dev
```

### ❌ "QR Code não aparece"
1. Verifique a conexão com http://localhost:3000/health
2. Abra o console do navegador (F12) e procure por erros
3. Reinicie: Ctrl+C e `npm run dev` novamente

### ❌ "Mensagens não chegam"
1. Verifique se o WhatsApp está conectado (aba verde)
2. Teste enviando uma mensagem simples
3. Verifique os logs no terminal (procure por ✓ ou ❌)

### ❌ "Node.js não encontrado"
- Reinstale Node.js: https://nodejs.org/
- Reinicie o terminal após instalar
- Verifique com: `node --version`

---

## 📊 Estrutura de Arquivos

```
whatsapp-chatbot/
├── apps/
│   ├── api/                    # Servidor Node.js + WhatsApp
│   │   ├── src/
│   │   │   └── index.ts       # ← Lógica principal do bot
│   │   ├── baileys-auth/      # ← Credenciais do WhatsApp
│   │   └── package.json
│   │
│   └── admin/                  # Dashboard Next.js
│       ├── src/app/
│       │   └── whatsapp/
│       │       └── page.tsx    # ← Interface do usuário
│       └── package.json
│
├── package.json               # Monorepo config
└── SETUP_PRODUCAO.md         # ← Você está aqui
```

---

## 🚀 Deploy em Outro PC

### Passo 1: Copie o Projeto
Copie toda a pasta `whatsapp-chatbot` para o outro PC.

### Passo 2: Instale Node.js
Se ainda não tiver Node.js instalado no outro PC.

### Passo 3: Instale Dependências
```bash
cd whatsapp-chatbot
npm install
```

### Passo 4: Inicie
```bash
npm run dev
```

### Passo 5: Gere Novo QR Code
- As credenciais anteriores ficam em `baileys-auth/`
- Se quiser resetar, delete a pasta `baileys-auth/`
- Gere um novo QR code no painel de admin

---

## 🔐 Segurança

### ⚠️ Importante
1. **Não compartilhe** a pasta `baileys-auth/` com ninguém
2. **Não execute** em modo público sem autenticação
3. **Proteja** a porta 3001 com senha (próxima versão)

### Recomendações para Produção
1. Use um reverse proxy (Nginx/Apache)
2. Configure HTTPS/SSL
3. Implemente rate limiting
4. Adicione autenticação no admin

---

## 📞 Suporte

### Logs Úteis
Se algo der errado, procure por:
- `✓`: Operação bem-sucedida
- `❌`: Erro
- `⏳`: Aguardando
- `✅`: Conectado com sucesso

### Verifique a Saúde do Sistema
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{ "status": "ok", "connectionsActive": 0 }
```

---

## 🎯 Próximos Passos

1. **Personalizar** as mensagens automáticas
2. **Adicionar** mais regras de resposta
3. **Integrar** com seu banco de dados
4. **Implementar** inteligência artificial (IA)

---

## ✨ Versão

- **Versão**: 1.0.0
- **Biblioteca**: Baileys (WhatsApp Web)
- **Framework**: Express.js + Next.js 14
- **Data**: 2024

---

**Pronto para começar?** Execute `npm run dev` e acesse http://localhost:3001 🚀
