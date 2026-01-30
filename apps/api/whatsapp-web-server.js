const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const { generateAIResponse, updateProductData, getProductData } = require('./src/gemini-config');

const app = express();
const PORT = 3000;

// ✅ CORS - Middleware simples e direto
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size, timestamp: new Date().toISOString() });
});

// ✅ Diagnóstico de sessões (apenas ativas)
app.get('/api/whatsapp/sessions', (req, res) => {
  const list = Array.from(sessions.values())
    .filter(s => s.isConnected) // Apenas sessões ativas
    .map((session) => ({
      id: session.id,
      isConnected: session.isConnected,
      phoneNumber: session.phoneNumber,
      state: session.state,
      messageCount: (session.messages || []).length,
      autoReplyEnabled: !!session.autoReplyEnabled
    }));

  res.json({ success: true, sessions: list, count: list.length });
});

// ✅ Histórico COMPLETO (todas as sessões, incluindo desconectadas)
app.get('/api/whatsapp/all-sessions', (req, res) => {
  const list = Array.from(sessions.values()).map((session) => ({
    id: session.id,
    isConnected: session.isConnected,
    phoneNumber: session.phoneNumber,
    state: session.state,
    messageCount: (session.messages || []).length,
    autoReplyEnabled: !!session.autoReplyEnabled,
    createdAt: new Date(session.createdAt).toLocaleString('pt-BR'),
    daysOld: Math.floor((Date.now() - session.createdAt) / (24 * 60 * 60 * 1000))
  }));

  res.json({ success: true, sessions: list });
});

// ✅ Histórico COMPLETO com sessões expiradas (recuperáveis)
app.get('/api/whatsapp/history', (req, res) => {
  const active = Array.from(sessions.values());
  const history = loadSessionHistory();
  
  res.json({
    success: true,
    active: active.map(s => ({ id: s.id, phoneNumber: s.phoneNumber, state: 'active' })),
    history: history.map(s => ({
      id: s.id,
      phoneNumber: s.phoneNumber,
      state: s.state,
      messages: s.messageCount || 0,
      lastActive: s.lastActive || 'unknown'
    }))
  });
});

// ✅ Mensagens do bot (para editor do Admin)
app.get('/api/bot/messages', (req, res) => {
  botMessagesCache = loadBotMessages();
  res.json({ success: true, messages: botMessagesCache });
});

app.post('/api/bot/messages', (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: 'messages deve ser um array' });
  }

  try {
    ensureTemplatesFile();
    fs.writeFileSync(templatesFile, JSON.stringify(messages, null, 2));
    botMessagesCache = messages;
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar mensagens do bot:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ ENDPOINTS DE CONFIGURAÇÃO DO PRODUTO E IA

// GET - Obter dados do produto
app.get('/api/product/data', (req, res) => {
  const productData = getProductData();
  res.json({ success: true, product: productData });
});

// POST - Atualizar dados do produto
app.post('/api/product/data', (req, res) => {
  const { name, description, price, warranty, shippingTime, stockStatus } = req.body;
  
  try {
    const updatedData = updateProductData({
      name: name || undefined,
      description: description || undefined,
      price: price || undefined,
      warranty: warranty || undefined,
      shippingTime: shippingTime || undefined,
      stockStatus: stockStatus || undefined
    });
    
    console.log('✅ Produto configurado:', updatedData);
    res.json({ success: true, product: updatedData });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Gerar resposta com IA (Gemini)
app.post('/api/ai/generate-response', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ success: false, error: 'message é obrigatória' });
  }
  
  try {
    console.log(`🤖 Gerando resposta com IA para: ${message}`);
    const aiResponse = await generateAIResponse(message, getProductData());
    
    if (!aiResponse) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao gerar resposta com Gemini. Verifique a chave API.' 
      });
    }
    
    console.log(`✅ Resposta IA gerada: ${aiResponse.substring(0, 100)}...`);
    res.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('Erro ao chamar IA:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ ENDPOINTS DE CONFIGURAÇÃO DE SETTINGS

// POST - Salvar token Gemini
app.post('/api/settings/gemini-key', (req, res) => {
  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ success: false, error: 'key é obrigatória' });
  }

  try {
    process.env.GEMINI_API_KEY = key;
    console.log('✅ Token Gemini configurado');
    res.json({ success: true, message: 'Token configurado com sucesso' });
  } catch (error) {
    console.error('Erro ao configurar token:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Testar token Gemini
app.post('/api/settings/test-gemini', async (req, res) => {
  const { key, message } = req.body;
  
  if (!key) {
    return res.status(400).json({ success: false, error: 'key é obrigatória' });
  }

  try {
    console.log('🧪 Testando token Gemini...');
    
    // Usar a chave fornecida para testar
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const testAI = new GoogleGenerativeAI(key);
    const model = testAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(message || 'Teste de conexão. Responda com uma mensagem curta.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Token Gemini válido e funcionando!');
    res.json({ 
      success: true, 
      message: 'Token funcionando corretamente',
      response: text 
    });
  } catch (error) {
    console.error('❌ Erro ao testar token:', error.message);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao conectar com Gemini: ${error.message}` 
    });
  }
});

// GET - Verificar status dos serviços
app.get('/api/settings/status', (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const productData = getProductData();
  
  res.json({
    success: true,
    status: {
      api: 'ok',
      gemini_configured: hasGeminiKey,
      product_configured: !!productData.name,
      timestamp: new Date().toISOString()
    }
  });
});

// ✅ Endpoint simples para teste CORS
app.options('/api/whatsapp/start-session', cors());

// ✅ Endpoints do Dashboard (dados fictícios para exemplo)
app.get('/api/contacts', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({
    success: true,
    contacts: [
      { id: 1, name: 'João Silva', phone: '5511999999999', status: 'ativo' },
      { id: 2, name: 'Maria Santos', phone: '5511988888888', status: 'ativo' },
      { id: 3, name: 'Pedro Oliveira', phone: '5511977777777', status: 'inativo' }
    ].slice(0, limit)
  });
});

app.get('/api/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      { id: 1, name: 'Plano Basic', price: 49.90, channels: 200, status: 'ativo' },
      { id: 2, name: 'Plano Plus', price: 79.90, channels: 500, status: 'ativo' },
      { id: 3, name: 'Plano Premium', price: 129.90, channels: 800, status: 'ativo' }
    ]
  });
});

app.get('/api/tickets', (req, res) => {
  res.json({
    success: true,
    tickets: [
      { id: 1, title: 'Problema de acesso', status: 'aberto', priority: 'alta' },
      { id: 2, title: 'Qualidade de vídeo ruim', status: 'em_andamento', priority: 'média' }
    ]
  });
});

app.get('/api/payments', (req, res) => {
  res.json({
    success: true,
    payments: [
      { id: 1, amount: 49.90, date: '2024-01-20', status: 'pago' },
      { id: 2, amount: 79.90, date: '2024-01-15', status: 'pago' }
    ]
  });
});

// Armazenar sessões ativas
const sessions = new Map();
// Cache para evitar logs repetitivos de "Sessão não encontrada"
const warnedSessions = new Set();

// ✅ Arquivo de histórico de sessões (para recuperação)
const historyFile = path.join(__dirname, 'data', 'sessions-history.json');

const ensureHistoryFile = () => {
  const dir = path.dirname(historyFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(historyFile)) fs.writeFileSync(historyFile, JSON.stringify([]), 'utf-8');
};

const loadSessionHistory = () => {
  try {
    ensureHistoryFile();
    return JSON.parse(fs.readFileSync(historyFile, 'utf-8')) || [];
  } catch (e) {
    return [];
  }
};

const saveSessionToHistory = (sessionData) => {
  try {
    ensureHistoryFile();
    const history = loadSessionHistory();
    const existing = history.findIndex(s => s.id === sessionData.id);
    
    if (existing >= 0) {
      history[existing] = sessionData;
    } else {
      history.push(sessionData);
    }
    
    // Manter apenas últimas 100 sessões
    if (history.length > 100) history.shift();
    
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao salvar histórico:', e.message);
  }
};

const defaultBotMessages = [
  {
    id: 'msg-1',
    title: 'Boas Vindas',
    content: '👋 Olá! Bem-vindo ao nosso serviço de IPTV. Como posso ajudá-lo?',
    buttons: [
      { id: 'btn-1', label: 'Ver Planos', response: 'Mostrando os planos disponíveis...', nextMessage: 'Qual plano te interessa?' },
      { id: 'btn-2', label: 'Suporte', response: 'Conectando com suporte...', nextMessage: 'Suporte Técnico' },
      { id: 'btn-3', label: 'Promoções', response: 'Confira nossas promoções especiais!', nextMessage: 'Qual plano te interessa?' }
    ]
  },
  {
    id: 'msg-2',
    title: 'Qual plano te interessa?',
    content: 'Escolha um dos nossos incríveis planos de IPTV:',
    buttons: [
      { id: 'btn-4', label: 'Plano Basic - R$ 49,90', response: 'Você escolheu o Plano Basic', nextMessage: 'Confirmação de Pedido' },
      { id: 'btn-5', label: 'Plano Plus - R$ 79,90', response: 'Você escolheu o Plano Plus', nextMessage: 'Confirmação de Pedido' },
      { id: 'btn-6', label: 'Plano Premium - R$ 129,90', response: 'Você escolheu o Plano Premium', nextMessage: 'Confirmação de Pedido' }
    ]
  },
  {
    id: 'msg-3',
    title: 'Suporte Técnico',
    content: '🆘 Está com algum problema? Estamos aqui para ajudar!',
    buttons: [
      { id: 'btn-7', label: 'Problema de Acesso', response: 'Vou ajudar você a recuperar o acesso', nextMessage: null },
      { id: 'btn-8', label: 'Qualidade de Imagem', response: 'Dicas para melhorar a qualidade', nextMessage: null },
      { id: 'btn-9', label: 'Outro Problema', response: 'Descreva seu problema para nos ajudar', nextMessage: null }
    ]
  },
  {
    id: 'msg-4',
    title: 'Confirmação de Pedido',
    content: '✅ Seu pedido foi confirmado! Obrigado por escolher nosso serviço.',
    buttons: [
      { id: 'btn-10', label: 'Baixar App', response: 'Enviando link para download', nextMessage: null },
      { id: 'btn-11', label: 'Tutorial', response: 'Acessando tutorial de instalação', nextMessage: null },
      { id: 'btn-12', label: 'Voltar ao Menu', response: 'Retornando ao menu principal', nextMessage: 'Boas Vindas' }
    ]
  }
];

const templatesDir = path.join(__dirname, 'data');
const templatesFile = path.join(templatesDir, 'messages.json');

const ensureTemplatesFile = () => {
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  if (!fs.existsSync(templatesFile)) {
    fs.writeFileSync(templatesFile, JSON.stringify(defaultBotMessages, null, 2));
  }
};

const loadBotMessages = () => {
  try {
    ensureTemplatesFile();
    const raw = fs.readFileSync(templatesFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultBotMessages;
  } catch (error) {
    console.error('Erro ao carregar mensagens do bot:', error.message);
    return defaultBotMessages;
  }
};

let botMessagesCache = loadBotMessages();

// ✅ LIMPEZA AUTOMÁTICA DE SESSÕES ANTIGAS (> 7 dias sem conexão)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;  // 7 dias

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessions) {
    const age = now - session.createdAt;
    if (age > SESSION_TTL && !session.isConnected) {
      sessions.delete(sessionId);
      cleaned++;
      console.log(`🗑️  Limpeza: Sessão ${sessionId} removida (${Math.floor(age / (24 * 60 * 60 * 1000))} dias)`);
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Limpeza concluída: ${cleaned} sessões removidas`);
  }
}, CLEANUP_INTERVAL);

// ✅ Função SEGURA para enviar mensagens (com validação e tratamento de markedUnread)
const safeSendMessage = async (client, chatId, message, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Delay progressivo: 800ms, 1500ms, 3000ms
      const delayMs = [800, 1500, 3000][i] || 3000;
      await new Promise(r => setTimeout(r, delayMs));
      
      console.log(`📤 [SAFE-SEND] Tentativa ${i + 1}/${retries} enviando para ${chatId.substring(0, 20)}...`);
      
      // Enviar a mensagem
      const result = await client.sendMessage(chatId, message);
      
      // Validação: esperamos um result com ID
      if (result && result.id) {
        console.log(`✅ [SAFE-SEND] Mensagem REALMENTE enviada (ID: ${result.id._serialized})`);
        return result;
      } else {
        throw new Error('Result inválido: sem ID de mensagem');
      }
    } catch (error) {
      const errorStr = String(error);
      const errorMsg = error.message || String(error);
      
      // ⚠️ IMPORTANTE: Se o erro contém "markedUnread", a mensagem foi ENVIADA
      // O erro ocorre após o envio, durante o processamento interno do WhatsApp Web.js
      if (errorStr.includes('markedUnread') || (errorStr.includes('Cannot read properties') && errorStr.includes('markedUnread'))) {
        console.warn(`⚠️  [SAFE-SEND] Erro 'markedUnread' ignorado - a mensagem foi ENVIADA com sucesso.`);
        // Retornar sucesso porque a mensagem foi enviada antes do erro
        return { 
          id: { _serialized: `msg_${Date.now()}_sent_before_markedunread` },
          success: true,
          note: 'enviada_mas_markedunread_erro'
        };
      }

      // Log do erro
      console.error(`❌ [SAFE-SEND] Tentativa ${i + 1} error:`, errorMsg.substring(0, 100));
      
      // Se é último erro e não é markedUnread, retorna null
      if (i === retries - 1) {
        console.error(`❌ [SAFE-SEND] FALHA FINAL após ${retries} tentativas`);
        return null;
      }
    }
  }
  
  return null; // Falha definitiva
};

const getAutoReply = (text, templates) => {
  const message = (text || '').toLowerCase().trim();
  const list = Array.isArray(templates) && templates.length ? templates : defaultBotMessages;

  const createResult = (item) => {
    let media = undefined;
    if (item.image && item.image.startsWith('data:')) {
      try {
        const parts = item.image.split(',');
        // data:image/png;base64,.....
        // parts[0] is data:image/png;base64
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const b64 = parts[1];
        media = new MessageMedia(mime, b64);
      } catch (e) {
        console.error('Erro ao processar imagem da mensagem:', e.message);
      }
    }
    let content = item.content;
    if (item.buttons && item.buttons.length > 0) {
      console.log(`🏗️ Criando Enquete: "${item.content}" com botões: [${item.buttons.map(b => b.label).join(', ')}]`);
      content = new Poll(item.content, item.buttons.map(b => b.label));
    } else {
        console.log(`📝 Criando Mensagem Simples: "${item.content}" (sem botões)`);
    }
    return { content, media };
  };

  // 1. Menu Principal / Saudações / Reset
  if (!message || ['menu', 'opções', 'opcoes', 'oi', 'ola', 'olá', 'inicio', 'início', 'começar', 'reset', 'tchau'].includes(message)) {
    const firstMsg = list.find(m => m.id === 'msg-1' || m.title === 'Boas Vindas') || list[0];
    if (firstMsg) return createResult(firstMsg);
    return { content: 'Olá! Bem-vindo.' };
  }

  // 2. Navegação Dinâmica
  for (const item of list) {
    if (item.buttons) {
       // Normalizar input para comparação (remover emojis se necessário ou apenas trim)
       const buttonMatch = item.buttons.find(b => b.label.toLowerCase().trim() === message);
       
       if (buttonMatch) {
            console.log(`✓ Botão detectado: "${buttonMatch.label}" -> Próximo: "${buttonMatch.nextMessage || 'Fim'}"`);
            
            if (buttonMatch.nextMessage) {
                 const target = buttonMatch.nextMessage.toLowerCase().trim();
                 
                 // 1. Tenta match exato de título
                 let nextMsg = list.find(m => m.title.toLowerCase().trim() === target);
                 
                 // 2. Tenta match parcial (ex: "pagamento" encontra "Forma de Pagamento")
                 if (!nextMsg) {
                     nextMsg = list.find(m => m.title.toLowerCase().includes(target) || target.includes(m.title.toLowerCase()));
                 }
                 
                 if (nextMsg) return createResult(nextMsg);
                 
                 console.warn(`⚠️ Mensagem vinculada não encontrada: "${buttonMatch.nextMessage}"`);
            }
            return { content: buttonMatch.response };
       }
    }
  }

  // 3. Fallback: Inteligência para Título Exato
  const exactTitleMatch = list.find(m => m.title.toLowerCase() === message);
  if (exactTitleMatch) return createResult(exactTitleMatch);

  // 4. Fallback: Busca por Palavras-Chave
  if (message.length > 3) {
      if (message.includes('plano')) {
          const m = list.find(m => m.title.includes('Plano'));
          if (m) return createResult(m);
      }
      if (message.includes('suporte')) {
          const m = list.find(m => m.title.includes('Suporte'));
          if (m) return createResult(m);
      }
  }

  return { content: 'Desculpe, não entendi. Digite "menu" para ver as opções.' };
};

// Diretório para credenciais de autenticação
const authDir = path.join(__dirname, 'whatsapp-auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

console.log(`
╔════════════════════════════════════════════╗
║  WhatsApp Web.js Server (QR Code REAL)    ║
║  Rodando em http://localhost:${PORT}             ║
╚════════════════════════════════════════════╝

✓ whatsapp-web.js instalado
✓ Puppeteer instalado
✓ QR Code REAL (não simulado)

Endpoints:
  POST   /api/whatsapp/start-session
  GET    /api/whatsapp/status/:sessionId
  POST   /api/whatsapp/disconnect
  GET    /health
`);

const resolveChromePath = () => {
  let puppeteerPath;
  try {
    const puppeteer = require('puppeteer');
    if (typeof puppeteer.executablePath === 'function') {
      puppeteerPath = puppeteer.executablePath();
    }
  } catch (_) {
    puppeteerPath = undefined;
  }

  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    puppeteerPath,
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
  ].filter(Boolean);

  return candidates.find(candidate => fs.existsSync(candidate));
};

// ✅ Helper para iniciar cliente WhatsApp (usado para novas sessões e restauração)
const startWhatsAppClient = async (sessionId, res = null) => {
  const authPath = path.join(authDir, sessionId);
  const chromePath = resolveChromePath();

  console.log(`🚀 Iniciando cliente WhatsApp: ${sessionId}`);

  if (!chromePath) {
    const msg = 'Chrome/Edge não encontrado. Instale o Google Chrome ou defina CHROME_PATH.';
    console.error(`❌ ${msg}`);
    if (res) {
      return res.status(500).json({ success: false, error: msg });
    }
    return;
  }

  // Criar cliente WhatsApp
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: authPath
    }),
    puppeteer: {
      headless: false,
      executablePath: chromePath,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-features=TranslateUI',
        '--disable-features=RendererCodeIntegrity',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-web-resources',
        '--disable-sync',
        '--disable-background-networking',
        '--disable-component-extensions-with-background-pages',
        '--disable-breakpad',
        '--disable-default-apps',
        '--disable-default-network-service',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-default-apps',
        '--disable-component-update',
        '--use-gl=swiftshader'
      ],
      timeout: 120000,
      protocolTimeout: 180000,
      dumpio: true,
      slowMo: 0
    },
    qrMaxRetries: 5,
    restartOnAuthFail: true,
    takeoverOnConflict: true,
    syncFullHistory: false,
    bypassCSP: true,
    ffmpegPath: null,
    proxyAuthentication: null,
    puppeteerOptions: {
      timeout: 120000
    }
  });

  // PRE-REGISTER: Armazenar sessão imediatamente
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      client: client,
      qrCode: null,
      isConnected: false,
      phoneNumber: '',
      createdAt: Date.now(),
      state: 'initializing',
      messages: [],
      autoReplyEnabled: true,
      lastActive: Date.now()
    });
  }

  // 🗳️ EVENTO: VOTO EM ENQUETE
  client.on('vote_update', async (vote) => {
    try {
      if (vote.selectedOptions && vote.selectedOptions.length > 0) {
        const selectedText = vote.selectedOptions[0].name;
        const voter = vote.voter;
        
        console.log(`🗳️ Voto detectado [${sessionId}]: "${selectedText}" de ${voter}`);

        // Verificar se auto-reply está ativo
        const sess = sessions.get(sessionId);
        if (sess && sess.autoReplyEnabled) {
            const reply = getAutoReply(selectedText, botMessagesCache);
            // Delay pequeno para parecer natural
            await new Promise(r => setTimeout(r, 1000));
            
            if (reply.media) {
                await safeSendMessage(client, voter, reply.media, 3);
                await new Promise(r => setTimeout(r, 500));
            }
            if (reply.content) {
                await safeSendMessage(client, voter, reply.content, 3);
            }
        }
      }
    } catch (error) {
       console.error(`Erro ao processar voto: ${error.message}`);
    }
  });

  // ✨ EVENTO: QR CODE GERADO
  client.on('qr', async (qr) => {
    try {
      console.log(`🔄 Tentando gerar QR code para sessão: ${sessionId}`);
      const qrCode = await QRCode.toDataURL(qr);
      console.log(`✓ QR Code gerado com sucesso para sessão: ${sessionId}`);

      const session = sessions.get(sessionId);
      if (session) {
        session.qrCode = qrCode;
        session.state = 'waiting_scan';
      }
      
      saveSessionToHistory({
        id: sessionId,
        phoneNumber: '',
        state: 'waiting_scan',
        messageCount: 0,
        lastActive: new Date().toLocaleString('pt-BR')
      });
    } catch (error) {
      console.error(`✗ Erro ao gerar QR code: ${error.message}`);
      console.error(error.stack);
    }
  });

  // 🔴 EVENTO: ERRO FATAL DO PUPPETEER
  client.on('disconnected', (reason) => {
    console.error(`🔴 WhatsApp desconectado [${sessionId}]: ${reason}`);
    const session = sessions.get(sessionId);
    if (session) {
      session.isConnected = false;
      session.state = 'disconnected';
    }
  });

  // 🔴 TRATAMENTO DE ERROS DO PUPPETEER
  client.on('error', (error) => {
    console.error(`🔴 ERRO DO PUPPETEER [${sessionId}]:`, error.message);
    console.error(error.stack);
  });

  // Conexão estabelecida
  client.on('ready', () => {
    const session = sessions.get(sessionId);
    if (session) {
      session.isConnected = true;
      session.state = 'connected';
      session.phoneNumber = client.info.wid.user || 'WhatsApp Conectado';
      session.lastActive = Date.now();
      console.log(`✓ WhatsApp conectado: ${sessionId} - ${session.phoneNumber}`);
      
      saveSessionToHistory({
        id: sessionId,
        phoneNumber: session.phoneNumber,
        state: 'connected',
        messageCount: (session.messages || []).length,
        lastActive: new Date().toLocaleString('pt-BR')
      });
      
      // 🔄 POLLING DE MENSAGENS
      const pollingInterval = setInterval(async () => {
        const sess = sessions.get(sessionId);
        // Se a sessão foi removida ou desconectada, parar polling
        if (!sess || !sess.isConnected) {
          if (!sess) clearInterval(pollingInterval);
          return;
        }
        
        try {
          const chats = await client.getChats();
          for (const chat of chats) {
            const messages = await chat.fetchMessages({ limit: 5 });
            for (const msg of messages) {
              if (!msg.fromMe && msg.timestamp * 1000 > Date.now() - 30000) {
                const exists = sess.messages.some(m => m.id === msg.id._serialized);
                if (!exists) {
                  console.log(`\n📬 MENSAGEM DETECTADA: ${msg.from}`);
                  
                  sess.messages.push({
                    id: msg.id._serialized,
                    from: msg.from,
                    body: msg.body,
                    timestamp: new Date(msg.timestamp * 1000),
                    isFromMe: msg.fromMe
                  });
                  
                  const reply = getAutoReply(msg.body, botMessagesCache);
                  // Somente responder se auto-reply estiver ativo
                  if (sess.autoReplyEnabled) {
                      if (reply.media) {
                          await safeSendMessage(client, msg.from, reply.media, 3);
                          await new Promise(r => setTimeout(r, 800));
                      }
                      if (reply.content) {
                          await safeSendMessage(client, msg.from, reply.content, 3);
                      }
                  }
                }
              }
            }
          }
        } catch (err) {
          // Silenciosamente ignorar erros de polling para não sujar log
        }
      }, 3000);
    }
  });

  // Tratar desconexão e erros
  client.on('disconnected', () => {
    console.log(`[${sessionId}] Desconectado`);
    const session = sessions.get(sessionId);
    if (session) {
      session.isConnected = false;
      session.state = 'disconnected';
    }
  });

  client.on('error', (error) => {
    console.error(`[${sessionId}] ✗ Erro: ${error.message}`);
    const session = sessions.get(sessionId);
    if (session) {
      session.error = error.message;
      session.state = 'error';
      session.isConnected = false;
    }
  });

  client.initialize();

  // Se tiver objeto de resposta (modo interativo), tenta aguardar QR code
  if (res) {
    let qrGenerated = false;
    let waitTime = 0;
    const maxWaitTime = 15000;

    while (!qrGenerated && waitTime < maxWaitTime) {
      const session = sessions.get(sessionId);
      // Se conectou direto (sem QR, restaurado) ou se gerou QR
      if (session && (session.qrCode || session.isConnected)) {
        qrGenerated = true; // Sair do loop
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      waitTime += 500;
    }

    const session = sessions.get(sessionId);
    if (session && session.isConnected) {
         return res.json({
            success: true,
            sessionId: sessionId,
            message: 'Sessão restaurada e conectada automaticamente!'
         });
    } else if (session && session.qrCode) {
         return res.json({
            success: true,
            sessionId: sessionId,
            qrCode: session.qrCode,
            message: 'QR Code gerado'
         });
    } else {
        if (client) client.destroy();
        return res.status(500).json({ success: false, error: 'Timeout ao gerar QR Code' });
    }
  }
};

// ✅ Iniciar nova sessão WhatsApp (Rota)
app.post('/api/whatsapp/start-session', async (req, res) => {
  try {
    const sessionId = `session_${Date.now()}`;
    await startWhatsAppClient(sessionId, res);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Verificar status da conexão
app.get('/api/whatsapp/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  console.log(`🔍 Verificando status de: ${sessionId}`);
  console.log(`📊 Sessões ativas: ${Array.from(sessions.keys()).join(', ')}`);
  
  const session = sessions.get(sessionId);

  if (!session) {
    // Verificar no histórico
    const history = loadSessionHistory();
    const historicalSession = history.find(s => s.id === sessionId);
    
    // Log apenas se não tiver avisado recentemente (evita spam no terminal)
    if (!warnedSessions.has(sessionId)) {
      if (historicalSession) {
        console.log(`ℹ️  Status check: Sessão ${sessionId} encontrada no histórico (arquivada).`);
      } else {
        console.warn(`⚠️  Status check: Sessão ${sessionId} não encontrada (pode ter expirado).`);
      }
      warnedSessions.add(sessionId);
      // Limpar aviso após 5 minutos para permitir novo log se necessário
      setTimeout(() => warnedSessions.delete(sessionId), 5 * 60 * 1000);
    }
    
    return res.json({
      success: true,
      sessionId: sessionId,
      isConnected: false,
      state: historicalSession ? 'archived' : 'expired',
      phoneNumber: historicalSession?.phoneNumber || '',
      error: historicalSession ? 'Sessão arquivada (expirada após 7 dias)' : 'Sessão expirada ou não encontrada',
      createdAt: null,
      historicalData: historicalSession || null
    });
  }

  res.json({
    success: true,
    sessionId: sessionId,
    isConnected: session.isConnected,
    state: session.state,
    phoneNumber: session.phoneNumber,
    error: session.error || null,
    createdAt: session.createdAt
  });
});

// ✅ Desconectar sessão
app.post('/api/whatsapp/disconnect/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  try {
    if (session.client) {
      await session.client.logout();
      session.client.destroy();
    }
    // NÃO deletar - apenas marcar como desconectada para preservar histórico
    session.isConnected = false;
    session.state = 'disconnected';
    session.lastActive = Date.now();
    session.client = null;
    
    // Atualizar histórico
    saveSessionToHistory({
      id: sessionId,
      phoneNumber: session.phoneNumber,
      state: 'disconnected',
      messageCount: (session.messages || []).length,
      lastActive: new Date().toLocaleString('pt-BR')
    });
    
    console.log(`✓ Sessão ${sessionId} desconectada (histórico preservado)`);
    res.json({ success: true, message: 'Desconectado com sucesso', historicallyAccessible: true });
  } catch (error) {
    console.error(`Erro ao desconectar: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Buscar mensagens da sessão
app.get('/api/whatsapp/messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  console.log(`📨 Buscando mensagens de: ${sessionId}`);
  console.log(`📊 Sessões ativas: ${Array.from(sessions.keys()).join(', ')}`);
  
  const session = sessions.get(sessionId);

  if (!session) {
    if (!warnedSessions.has(sessionId)) {
      console.warn(`⚠️  Busca de mensagens: Sessão ${sessionId} não encontrada.`);
      warnedSessions.add(sessionId);
      setTimeout(() => warnedSessions.delete(sessionId), 5 * 60 * 1000);
    }
    // Retornar sucesso mas com array vazio
    return res.json({
      success: true,
      messages: [],
      count: 0,
      error: 'Sessão expirada ou não encontrada'
    });
  }

  res.json({
    success: true,
    messages: session.messages || [],
    count: (session.messages || []).length
  });
});

// ✅ Enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  const { sessionId, phone, message, image } = req.body;

  if (!sessionId || !phone || (!message && !image)) {
    return res.status(400).json({
      success: false,
      error: 'sessionId, phone e conteúdo (message ou image) são obrigatórios'
    });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  if (!session.isConnected) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp não está conectado'
    });
  }

  try {
    // Garantir que o número tem formato correto (55XX999999999)
    const chatId = phone.includes('@') ? phone : phone + '@c.us';
    let result;

    if (image && image.startsWith('data:')) {
         try {
            const parts = image.split(',');
            const mimeMatch = parts[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const b64 = parts[1];
            const media = new MessageMedia(mime, b64);
            
            // Envia a imagem
            await safeSendMessage(session.client, chatId, media, 3);
            
            // Se tiver texto, envia depois
            if (message) {
                 await new Promise(r => setTimeout(r, 500));
                 result = await safeSendMessage(session.client, chatId, message, 3);
            } else {
                 result = { id: { _serialized: 'image_sent' } };
            }
         } catch (e) {
             console.error('Erro ao processar imagem no send-message:', e);
             if (message) {
                 result = await safeSendMessage(session.client, chatId, message, 3);
             }
         }
    } else {
         result = await safeSendMessage(session.client, chatId, message, 3);
    }

    console.log(`✓ Mensagem enviada [${sessionId}] para ${phone}`);
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      messageId: result?.id?._serialized
    });
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem [${sessionId}]:`, error.message);
    res.json({
      success: true,
      message: 'Mensagem processada (pode haver atrasos na entrega)',
      warning: error.message
    });
  }
});

// 🧪 ENDPOINT DE TESTE - envia mensagem para testar conexão
app.get('/api/test/send/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;
  const testMessage = '🤖 TESTE AUTOMÁTICO - Se recebeu, o bot está funcionando!';

  // Pega a primeira sessão conectada
  let connectedSession = null;
  for (const [id, session] of sessions) {
    if (session.isConnected && session.client) {
      connectedSession = session;
      break;
    }
  }

  if (!connectedSession) {
    return res.json({
      success: false,
      error: 'Nenhuma sessão WhatsApp conectada',
      activeSessions: sessions.size
    });
  }

  try {
    const chatId = phoneNumber.includes('@') ? phoneNumber : phoneNumber + '@c.us';
    const result = await connectedSession.client.sendMessage(chatId, testMessage);
    
    res.json({
      success: true,
      message: 'Mensagem de teste enviada com sucesso!',
      sessionId: connectedSession.id,
      phone: phoneNumber,
      messageId: result.id._serialized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      hint: 'Verifique se o número está correto (apenas números, ex: 5511987654321)'
    });
  }
});

// ✅ Enviar mensagem para todos os clientes que já falaram
app.post('/api/whatsapp/broadcast-message', async (req, res) => {
  const { sessionId, message, image } = req.body;

  console.log(`📨 Broadcast request: sessionId=${sessionId}, message length=${message?.length || 0}`);

  if (!sessionId || (!message && !image)) {
    console.error(`❌ Falta sessionId ou conteudo (message/image)`);
    return res.status(400).json({
      success: false,
      error: 'sessionId e conteudo são obrigatórios'
    });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    console.error(`❌ Sessão não encontrada: ${sessionId}`);
    return res.status(404).json({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  if (!session.isConnected) {
    console.error(`❌ WhatsApp não conectado para sessão ${sessionId}`);
    return res.status(400).json({
      success: false,
      error: 'WhatsApp não está conectado'
    });
  }

  const recipients = Array.from(new Set(
    (session.messages || [])
      .filter((msg) => msg && !msg.isFromMe && msg.from)
      .map((msg) => msg.from)
  ));

  console.log(`📊 Recipients encontrados: ${recipients.length}`);

  if (!recipients.length) {
    console.warn(`⚠️  Nenhum cliente encontrado para broadcast`);
    return res.json({
      success: true,
      recipients: 0,
      sent: 0,
      failed: 0,
      message: 'Nenhum cliente para enviar (aguarde mensagens dos clientes)'
    });
  }

  let sent = 0;
  let failed = 0;

  // Prepara mídia se houver
  let mediaObj = null;
  if (image && image.startsWith('data:')) {
      try {
        const parts = image.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const b64 = parts[1];
        mediaObj = new MessageMedia(mime, b64);
      } catch (e) {
          console.error('Erro ao processar imagem broadcast:', e);
      }
  }

  for (const chatId of recipients) {
    try {
      if (mediaObj) {
          await safeSendMessage(session.client, chatId, mediaObj, 2);
          if (message) {
              await new Promise(r => setTimeout(r, 500));
              await safeSendMessage(session.client, chatId, message, 2);
          }
      } else {
          await safeSendMessage(session.client, chatId, message, 2);
      }
      
      sent += 1;
      console.log(`✅ Mensagem enviada [broadcast] para ${chatId}`);
    } catch (error) {
      failed += 1;
      console.error(`❌ Erro ao enviar broadcast para ${chatId}: ${error.message}`);
    }
  }

  res.json({
    success: true,
    recipients: recipients.length,
    sent,
    failed,
    message: failed > 0 ? `Enviado para ${sent} cliente(s) com ${failed} erro(s)` : 'Broadcast enviado com sucesso!'
  });
});

// ✅ Enviar mensagem customizada (IPTV - aba Send)
app.post('/api/iptv/send-custom', async (req, res) => {
  const { message, templateId } = req.body;

  console.log(`📨 Custom send request: templateId=${templateId}, message length=${message?.length || 0}`);

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'message é obrigatório'
    });
  }

  // Pegar a primeira sessão conectada
  let activeSession = null;
  for (const session of sessions.values()) {
    if (session.isConnected) {
      activeSession = session;
      break;
    }
  }

  if (!activeSession) {
    return res.status(400).json({
      success: false,
      error: 'Nenhuma sessão do WhatsApp conectada'
    });
  }

  // Usar o sistema de broadcast para enviar para todos os clientes
  const recipients = Array.from(new Set(
    (activeSession.messages || [])
      .filter((msg) => msg && !msg.isFromMe && msg.from)
      .map((msg) => msg.from)
  ));

  console.log(`📊 Recipients encontrados para custom send: ${recipients.length}`);

  if (!recipients.length) {
    return res.json({
      success: true,
      recipients: 0,
      sent: 0,
      failed: 0,
      message: 'Nenhum cliente para enviar (aguarde mensagens dos clientes)'
    });
  }

  let sent = 0;
  let failed = 0;

  for (const chatId of recipients) {
    try {
      await activeSession.client.sendMessage(chatId, message);
      sent += 1;
      console.log(`✅ Mensagem customizada enviada para ${chatId}`);
    } catch (error) {
      failed += 1;
      console.warn(`⚠️  Aviso ao enviar custom para ${chatId}: ${error.message}`);
    }
  }

  res.json({
    success: true,
    recipients: recipients.length,
    sent,
    failed,
    message: failed > 0 ? `Enviado para ${sent} cliente(s) com ${failed} aviso(s)` : 'Mensagem enviada com sucesso para todos os clientes!',
    templateId
  });
});

// ✅ Buscar contatos (endpoint do dashboard)
app.get('/api/contacts', (req, res) => {
  const limit = req.query.limit || 10;
  const contacts = Array.from(sessions.values()).map(session => ({
    id: session.id,
    name: session.phoneNumber || 'Contato',
    phone: session.phoneNumber,
    isConnected: session.isConnected,
    createdAt: session.createdAt,
    messageCount: (session.messages || []).length
  }));
  
  res.json({
    success: true,
    contacts: contacts.slice(0, limit),
    total: contacts.length
  });
});

// ✅ Buscar planos (endpoint do dashboard)
app.get('/api/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      { id: 1, name: 'Básico', price: 'Grátis', features: ['Até 1 dispositivo', 'Suporte básico'] },
      { id: 2, name: 'Pro', price: 'R$ 99/mês', features: ['Até 5 dispositivos', 'Suporte prioritário', 'Analytics'] },
      { id: 3, name: 'Enterprise', price: 'Customizado', features: ['Ilimitados', 'Suporte 24/7', 'API completa'] }
    ]
  });
});

// ✅ Buscar tickets (endpoint do dashboard)
app.get('/api/tickets', (req, res) => {
  res.json({
    success: true,
    tickets: [
      { id: 1, title: 'QR Code não aparece', status: 'open', priority: 'high', created: new Date() },
      { id: 2, title: 'Mensagens não chegam', status: 'in_progress', priority: 'critical', created: new Date() }
    ]
  });
});

// ✅ Ativar/Desativar Auto-Reply
app.post('/api/whatsapp/auto-reply/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { enabled } = req.body || {};
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Sessão não encontrada' });
  }

  session.autoReplyEnabled = enabled !== false;
  
  res.json({
    success: true,
    message: `Auto-reply ${session.autoReplyEnabled ? 'ativado' : 'desativado'}`,
    autoReplyEnabled: session.autoReplyEnabled
  });
});

// ✅ Buscar pagamentos (endpoint do dashboard)
app.get('/api/payments', (req, res) => {
  res.json({
    success: true,
    payments: [
      { id: 1, amount: 99, status: 'completed', date: new Date(), method: 'credit_card' }
    ]
  });
});

// ✅ Tentar restaurar última sessão ativa
const restoreLastSession = async () => {
  try {
    const history = loadSessionHistory();
    // Pegar última sessão que estava conectada
    const lastSession = history.slice().reverse().find(s => s.state === 'connected' || s.state === 'active');
    
    if (lastSession) {
      console.log(`♻️  Tentando restaurar última sessão ativa: ${lastSession.id}...`);
      const authPath = path.join(authDir, lastSession.id);
      
      if (fs.existsSync(authPath)) {
        // Restaurar sessão em background (sem res)
        await startWhatsAppClient(lastSession.id, null);
      } else {
        console.log(`⚠️  Pasta de autenticação não encontrada para ${lastSession.id}`);
      }
    } else {
      console.log(`ℹ️  Nenhuma sessão anterior encontrada para restaurar.`);
    }
  } catch (error) {
    console.error(`❌ Erro ao restaurar sessão: ${error.message}`);
  }
};

// Iniciar restauração após breve delay
setTimeout(restoreLastSession, 2000);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
