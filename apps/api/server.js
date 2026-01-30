const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../../public')));

// ===== BANCO DE DADOS EM MEMÓRIA =====
const db = {
  contacts: [],
  conversations: [],
  campaigns: [],
  mediaFiles: {},
  config: {
    whatsappPhone: '',
    whatsappToken: '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiPrompt: 'Você é um vendedor persuasivo de serviços IPTV. Seja amigável, profissional e sempre ofereça a melhor solução.',
    automatedMessages: {
      welcome: 'Olá! 👋 Bem-vindo. Como posso ajudá-lo?',
      reminder: 'Olá! Gostaríamos de lembrar sobre sua fatura pendente.',
      promotion: 'Temos uma promoção especial para você!',
    }
  },
  sessions: new Map(),
};

// ===== FUNÇÕES AUXILIARES =====
async function callGemini(userMessage, customPrompt = '') {
  try {
    const prompt = customPrompt || db.config.geminiPrompt;
    
    // Simular resposta Gemini (depois integra real)
    const responses = {
      'oi': 'Olá! Bem-vindo ao nosso serviço de IPTV premium. Temos os melhores planos com qualidade 4K!',
      'preco': 'Oferecemos planos a partir de R$ 49,90/mês. Qual seria melhor para você?',
      'como funciona': 'Nossa plataforma é simples: você escolhe o plano, faz o pagamento e já tem acesso aos melhores canais!',
      'default': 'Entendi sua pergunta. Posso oferecer nosso melhor plano que te daria acesso a mais de 1000 canais!'
    };

    const key = Object.keys(responses).find(k => userMessage.toLowerCase().includes(k));
    return responses[key] || responses['default'];
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    return 'Desculpe, tive um problema. Pode repetir?';
  }
}

// ===== ROTAS DE SAÚDE =====
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '✅ API rodando!' });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'WhatsApp Chatbot API v2.0',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      whatsapp: '/api/whatsapp/*',
      messages: '/api/messages/*',
      contacts: '/api/contacts/*',
      campaigns: '/api/campaigns/*',
      ai: '/api/ai/*',
      media: '/api/media/*'
    }
  });
});

// ===== ROTAS WHATSAPP =====
app.post('/api/whatsapp/generate-qr', (req, res) => {
  const sessionId = Date.now().toString();
  db.sessions.set(sessionId, {
    id: sessionId,
    status: 'pending',
    createdAt: new Date(),
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${sessionId}`
  });

  res.json({
    success: true,
    sessionId,
    qrCode: db.sessions.get(sessionId).qrCode,
    message: '✅ QR Code gerado!'
  });
});

app.post('/api/whatsapp/connect', (req, res) => {
  const { sessionId, phone } = req.body;
  const session = db.sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Sessão não encontrada' });
  }

  session.status = 'connected';
  session.phone = phone;

  res.json({
    success: true,
    message: '✅ WhatsApp conectado com sucesso!',
    phone
  });
});

app.get('/api/whatsapp/status/:sessionId', (req, res) => {
  const session = db.sessions.get(req.params.sessionId);

  if (!session) {
    return res.json({ connected: false, status: 'not_found' });
  }

  res.json({
    connected: session.status === 'connected',
    status: session.status,
    phone: session.phone || null,
    sessionId: session.id
  });
});

// ===== ROTAS DE CONTATOS =====
app.get('/api/contacts', (req, res) => {
  res.json({
    success: true,
    total: db.contacts.length,
    contacts: db.contacts
  });
});

app.post('/api/contacts', (req, res) => {
  const { name, phone, status = 'active' } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Telefone é obrigatório' });
  }

  const contact = {
    id: Date.now().toString(),
    name: name || 'Sem nome',
    phone,
    status,
    createdAt: new Date()
  };

  db.contacts.push(contact);

  res.json({
    success: true,
    message: '✅ Contato adicionado!',
    contact
  });
});

// ===== ROTAS DE MENSAGENS =====
app.post('/api/messages/send', (req, res) => {
  const { to, text, sessionId, type = 'text', mediaUrl = '' } = req.body;

  if (!to || !text) {
    return res.status(400).json({ success: false, error: 'Campos obrigatórios faltando' });
  }

  const message = {
    id: Date.now().toString(),
    to,
    text,
    type, // text, image, audio, document
    mediaUrl,
    timestamp: new Date(),
    status: 'sent',
    sessionId
  };

  db.conversations.push(message);

  res.json({
    success: true,
    message: '✅ Mensagem enviada!',
    data: message
  });
});

app.post('/api/messages/broadcast', (req, res) => {
  const { text, contacts, delay = 1000, type = 'text', mediaUrl = '' } = req.body;

  if (!text || !contacts || contacts.length === 0) {
    return res.status(400).json({ success: false, error: 'Dados inválidos' });
  }

  const results = [];

  contacts.forEach((contact, index) => {
    setTimeout(() => {
      const message = {
        id: Date.now().toString() + index,
        to: contact,
        text,
        type,
        mediaUrl,
        timestamp: new Date(),
        status: 'sent',
        isBroadcast: true
      };

      db.conversations.push(message);
      results.push(message);
    }, delay * index);
  });

  res.json({
    success: true,
    message: `✅ Broadcast iniciado para ${contacts.length} contatos!`,
    totalContacts: contacts.length,
    estimatedTime: `${(delay * contacts.length) / 1000}s`,
    results
  });
});

// ===== ROTAS DE IA =====
app.post('/api/ai/generate-response', async (req, res) => {
  const { userMessage, customPrompt = '' } = req.body;

  try {
    const response = await callGemini(userMessage, customPrompt);

    res.json({
      success: true,
      userMessage,
      response,
      source: 'gemini-ai',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ai/configure-prompt', (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt é obrigatório' });
  }

  db.config.geminiPrompt = prompt;

  res.json({
    success: true,
    message: '✅ Prompt configurado com sucesso!',
    prompt: db.config.geminiPrompt
  });
});

// ===== ROTAS DE MÍDIA =====
app.post('/api/media/upload', (req, res) => {
  const { file, type, name } = req.body;

  if (!file || !type) {
    return res.status(400).json({ success: false, error: 'Arquivo e tipo são obrigatórios' });
  }

  const mediaId = Date.now().toString();
  db.mediaFiles[mediaId] = {
    id: mediaId,
    name: name || `file-${mediaId}`,
    type, // image, audio, document
    file,
    createdAt: new Date()
  };

  res.json({
    success: true,
    message: '✅ Arquivo enviado!',
    mediaId,
    mediaUrl: `/api/media/${mediaId}`
  });
});

app.get('/api/media/:id', (req, res) => {
  const media = db.mediaFiles[req.params.id];

  if (!media) {
    return res.status(404).json({ success: false, error: 'Mídia não encontrada' });
  }

  res.json({
    success: true,
    media
  });
});

// ===== ROTAS DE CAMPANHAS =====
app.post('/api/campaigns/create', (req, res) => {
  const { name, message, contacts, scheduledTime = '', type = 'promotional' } = req.body;

  if (!name || !message || !contacts) {
    return res.status(400).json({ success: false, error: 'Dados incompletos' });
  }

  const campaign = {
    id: Date.now().toString(),
    name,
    message,
    contacts: Array.isArray(contacts) ? contacts : [contacts],
    type, // promotional, reminder, payment
    scheduledTime,
    status: scheduledTime ? 'scheduled' : 'ready',
    createdAt: new Date()
  };

  db.campaigns.push(campaign);

  res.json({
    success: true,
    message: '✅ Campanha criada!',
    campaign
  });
});

app.post('/api/campaigns/:id/send', (req, res) => {
  const campaign = db.campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campanha não encontrada' });
  }

  campaign.status = 'sent';
  campaign.sentAt = new Date();

  res.json({
    success: true,
    message: `✅ Campanha enviada para ${campaign.contacts.length} contatos!`,
    campaign
  });
});

app.get('/api/campaigns', (req, res) => {
  res.json({
    success: true,
    total: db.campaigns.length,
    campaigns: db.campaigns
  });
});

// ===== ROTAS DE CONFIGURAÇÃO =====
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: {
      ...db.config,
      geminiApiKey: db.config.geminiApiKey ? '***' : 'não configurado'
    }
  });
});

app.post('/api/config/update', (req, res) => {
  const { whatsappPhone, whatsappToken, geminiApiKey, geminiPrompt } = req.body;

  if (whatsappPhone) db.config.whatsappPhone = whatsappPhone;
  if (whatsappToken) db.config.whatsappToken = whatsappToken;
  if (geminiApiKey) db.config.geminiApiKey = geminiApiKey;
  if (geminiPrompt) db.config.geminiPrompt = geminiPrompt;

  res.json({
    success: true,
    message: '✅ Configurações atualizadas!',
    config: db.config
  });
});

// ===== ROTAS DE ESTATÍSTICAS =====
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalContacts: db.contacts.length,
      activeConversations: db.conversations.filter(m => {
        const age = Date.now() - new Date(m.timestamp).getTime();
        return age < 3600000; // Últimas 1 hora
      }).length,
      totalMessages: db.conversations.length,
      totalCampaigns: db.campaigns.length,
      sentCampaigns: db.campaigns.filter(c => c.status === 'sent').length
    }
  });
});

// ===== ERROR HANDLING =====
app.use((req, res) => {
  res.status(404).json({ success: false, error: '❌ Endpoint não encontrado' });
});

// ===== SERVER START =====
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  🤖 WhatsApp Chatbot API v2.0          ║
║  ✅ Servidor rodando em porta ${PORT}         ║
║  📱 Com IA Gemini + Mensagens em Massa ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando...');
  server.close(() => process.exit(0));
});

module.exports = app;
