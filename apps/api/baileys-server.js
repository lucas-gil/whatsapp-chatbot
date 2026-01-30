const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 🔥 Gerenciador de Conexões
const connections = new Map();

// 📝 Mensagens padrão do bot
const defaultBotMessages = [
  {
    id: 'msg-1',
    title: 'Boas Vindas',
    content: '👋 Olá! Bem-vindo ao nosso serviço de IPTV. Como posso ajudá-lo?',
  },
  {
    id: 'msg-2',
    title: 'Planos',
    content: '💰 Oferecemos 3 planos:\n• Basic (R$49,90)\n• Plus (R$79,90)\n• Premium (R$129,90)',
  },
  {
    id: 'msg-3',
    title: 'Suporte',
    content: '🆘 Estamos aqui para ajudar! Qual é o seu problema?',
  }
];

// 🤖 Gerar resposta automática
const getAutoReply = (text) => {
  const msg = (text || '').toLowerCase();
  
  if (msg.includes('oi') || msg.includes('olá') || msg.includes('opa') || msg.includes('e aí')) {
    return defaultBotMessages[0].content;
  }
  if (msg.includes('plano') || msg.includes('preço') || msg.includes('valor') || msg.includes('custa')) {
    return defaultBotMessages[1].content;
  }
  if (msg.includes('suporte') || msg.includes('ajuda') || msg.includes('problema') || msg.includes('dúvida')) {
    return defaultBotMessages[2].content;
  }
  
  return '🤖 Olá! Obrigado por entrar em contato!\n\nEscreva:\n• "planos" para conhecer nossos pacotes\n• "suporte" para falar com o atendimento';
};

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connectionsActive: connections.size });
});

// ✅ Listar todas as sessões
app.get('/api/whatsapp/sessions', (req, res) => {
  const list = Array.from(connections.values()).map(conn => ({
    id: conn.sessionId,
    phoneNumber: conn.phoneNumber || 'Conectando...',
    isConnected: conn.isConnected,
    messagesCount: conn.messages?.length || 0
  }));
  res.json({ success: true, sessions: list });
});

// ✅ Iniciar nova sessão
app.post('/api/whatsapp/start-session', async (req, res) => {
  const sessionId = 'session_' + Date.now();
  console.log(`\n📱 Iniciando nova sessão: ${sessionId}`);

  try {
    // Criar diretório de autenticação
    const authPath = path.join(__dirname, 'baileys-auth', sessionId);
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }

    // Usar Baileys
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    let socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['Chrome', 'Windows', '10'],
      syncFullHistory: false,
      retryRequestDelayMs: 10,
      maxMsgsInMemory: 100,
      markOnlineOnConnect: true,
    });

    // Armazenar conexão
    connections.set(sessionId, {
      sessionId,
      socket,
      isConnected: false,
      phoneNumber: '',
      messages: [],
      qrCode: null,
      createdAt: new Date()
    });

    console.log(`⏳ Aguardando QR Code...`);

    // ✨ Eventos de conexão
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, isOnline } = update;

      if (qr) {
        console.log(`✓ QR Code gerado para ${sessionId}`);
        const qrDataUrl = await QRCode.toDataURL(qr);
        const conn = connections.get(sessionId);
        if (conn) conn.qrCode = qrDataUrl;
      }

      if (connection === 'open') {
        console.log(`✅ WhatsApp conectado: ${sessionId}`);
        const conn = connections.get(sessionId);
        if (conn) {
          conn.isConnected = true;
          conn.phoneNumber = socket.user?.id?.split(':')[0] || 'Conectado';
          console.log(`   Telefone: ${conn.phoneNumber}`);
        }
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log(`❌ Desconectado: ${sessionId} (Código: ${reason})`);
        connections.delete(sessionId);
        socket.end();
      }
    });

    // ✨ CAPTURAR MENSAGENS RECEBIDAS
    socket.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg) return;

      console.log(`\n📬 MENSAGEM RECEBIDA!`);
      console.log(`   De: ${msg.key.remoteJid}`);
      console.log(`   Texto: ${msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[média]'}`);

      const conn = connections.get(sessionId);
      if (!conn) return;

      // Só responder para mensagens de clientes (não do bot)
      if (msg.key.fromMe) {
        console.log(`   (Mensagem do próprio bot, ignorando)\n`);
        return;
      }

      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const from = msg.key.remoteJid;

      // Armazenar mensagem
      conn.messages.push({
        id: msg.key.id,
        from,
        text,
        timestamp: new Date()
      });

      // 🤖 RESPONDER AUTOMATICAMENTE
      const replyText = getAutoReply(text);
      try {
        console.log(`🤖 Gerando resposta automática...`);
        console.log(`📝 Resposta: ${replyText.substring(0, 50)}...`);
        
        await socket.sendMessage(from, { text: replyText });
        
        console.log(`✅ RESPOSTA ENVIADA COM SUCESSO!\n`);
      } catch (error) {
        console.error(`❌ Erro ao responder: ${error.message}\n`);
      }
    });

    // Salvar credenciais quando atualizar
    socket.ev.on('creds.update', saveCreds);

    // 🔥 AGUARDAR QR CODE SER GERADO (máximo 10 segundos)
    let qrCodeData = null;
    let attempts = 0;
    const maxAttempts = 20; // 10 segundos (20 * 500ms)
    
    while (!qrCodeData && attempts < maxAttempts) {
      const conn = connections.get(sessionId);
      if (conn?.qrCode) {
        qrCodeData = conn.qrCode;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    // Retornar resposta com QR code (ou sem, se ainda não foi gerado)
    const conn = connections.get(sessionId);
    res.json({
      success: true,
      sessionId,
      qrCode: qrCodeData || conn?.qrCode || null,
      message: qrCodeData ? '✓ QR Code gerado!' : '⏳ Gerando QR Code... pode levar alguns segundos'
    });

  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    connections.delete(sessionId);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Pegar QR Code de uma sessão
app.get('/api/whatsapp/qr/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conn = connections.get(sessionId);

  if (!conn) {
    return res.json({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  if (conn.isConnected) {
    return res.json({
      success: true,
      isConnected: true,
      message: 'Já conectado'
    });
  }

  if (!conn.qrCode) {
    return res.json({
      success: false,
      error: 'QR Code ainda não gerado'
    });
  }

  res.json({
    success: true,
    qrCode: conn.qrCode,
    isConnected: false
  });
});

// ✅ Status de uma sessão
app.get('/api/whatsapp/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conn = connections.get(sessionId);

  if (!conn) {
    return res.json({
      success: true,
      isConnected: false,
      state: 'expired'
    });
  }

  res.json({
    success: true,
    isConnected: conn.isConnected,
    phoneNumber: conn.phoneNumber,
    messagesCount: conn.messages?.length || 0
  });
});

// ✅ Pegar mensagens
app.get('/api/whatsapp/messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conn = connections.get(sessionId);

  if (!conn) {
    return res.json({
      success: true,
      messages: [],
      count: 0
    });
  }

  res.json({
    success: true,
    messages: conn.messages || [],
    count: (conn.messages || []).length
  });
});

// ✅ Enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  const { sessionId, phone, message } = req.body;

  const conn = connections.get(sessionId);
  if (!conn) {
    return res.status(404).json({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  if (!conn.isConnected) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp não conectado'
    });
  }

  try {
    const chatId = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    await conn.socket.sendMessage(chatId, { text: message });
    res.json({ success: true, message: 'Mensagem enviada' });
  } catch (error) {
    res.json({
      success: true,
      message: 'Mensagem processada',
      warning: error.message
    });
  }
});

// ✅ Broadcast
app.post('/api/whatsapp/broadcast-message', async (req, res) => {
  const { sessionId, message } = req.body;

  const conn = connections.get(sessionId);
  if (!conn) {
    return res.json({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  if (!conn.isConnected) {
    return res.json({
      success: false,
      error: 'WhatsApp não conectado'
    });
  }

  const recipients = [...new Set(conn.messages.map(m => m.from))];

  if (!recipients.length) {
    return res.json({
      success: true,
      recipients: 0,
      sent: 0,
      message: 'Nenhum cliente para enviar'
    });
  }

  let sent = 0;
  for (const to of recipients) {
    try {
      await conn.socket.sendMessage(to, { text: message });
      sent++;
      console.log(`✓ Broadcast enviado para: ${to}`);
    } catch (err) {
      console.error(`Erro ao enviar para ${to}: ${err.message}`);
    }
  }

  res.json({
    success: true,
    recipients: recipients.length,
    sent,
    message: `Enviado para ${sent} cliente(s)`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   WhatsApp Chatbot - Baileys Real API    ║
║   Rodando em http://localhost:${PORT}       ║
╚════════════════════════════════════════════╝

🔥 Baileys - Biblioteca WhatsApp Real
✅ Captura de mensagens funcionando
✅ Auto-reply automático
✅ Broadcast para todos os clientes

  `);
});

module.exports = app;
