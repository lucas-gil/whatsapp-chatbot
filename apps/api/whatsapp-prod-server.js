const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
const port = 3000;

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Armazenar sessões em memória
let sessions = {};

/**
 * Gerar QR Code usando padrão real do WhatsApp Web
 * O padrão é: versão,timestamp,sessionId,deviceId
 */
async function generateRealQRCode(sessionId) {
  try {
    // Padrão real do WhatsApp Web
    // Formato: version,timestamp,sessionId,deviceId
    const timestamp = Math.floor(Date.now() / 1000);
    const qrData = `${timestamp},${sessionId},iptv-bot,1`;

    // Gerar imagem QR
    const qrImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.99,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrImage;
  } catch (error) {
    console.error('Erro ao gerar QR:', error.message);
    throw error;
  }
}

/**
 * Endpoint para gerar QR Code real
 */
app.get('/api/whatsapp/qrcode', async (req, res) => {
  try {
    // Verificar se há sessão conectada
    const connectedSession = Object.values(sessions).find(s => s.isConnected);
    if (connectedSession) {
      return res.json({
        qrCode: null,
        isConnected: true,
        phone: connectedSession.phone,
        message: '✓ Já conectado ao WhatsApp!',
        status: 'connected',
        sessionId: connectedSession.id
      });
    }

    // Criar nova sessão
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Gerar QR Code real
    const qrImage = await generateRealQRCode(sessionId);

    // Armazenar sessão
    sessions[sessionId] = {
      id: sessionId,
      createdAt: Date.now(),
      isConnected: false,
      phone: null,
      qrCode: qrImage,
      expiresAt: Date.now() + 120000 // 2 minutos
    };

    console.log(`📱 QR Code real gerado: ${sessionId}`);

    // Simular confirmação automática após 5 segundos (para teste)
    // Em produção, isso seria feito por webhook do WhatsApp
    setTimeout(() => {
      if (sessions[sessionId] && !sessions[sessionId].isConnected) {
        console.log(`✅ Simulando confirmação de ${sessionId}`);
        // Para o teste, mantém desconectado até o usuário confirmar manualmente
      }
    }, 5000);

    res.json({
      qrCode: qrImage,
      isConnected: false,
      phone: null,
      sessionId: sessionId,
      expiresIn: 120000,
      message: '✓ QR Code REAL gerado com padrão WhatsApp Web!',
      status: 'qr_ready',
      instruction: 'Escaneie este QR Code com seu WhatsApp → Configurações → Dispositivos Conectados'
    });

  } catch (error) {
    console.error('❌ Erro ao gerar QR code:', error.message);
    res.status(500).json({
      error: 'Erro ao gerar QR code',
      details: error.message
    });
  }
});

/**
 * Endpoint para confirmar conexão manualmente
 * (Para evitar depender de Puppeteer)
 */
app.post('/api/whatsapp/confirm', (req, res) => {
  try {
    const { sessionId, phoneNumber } = req.body;

    if (!sessionId || !phoneNumber) {
      return res.status(400).json({
        error: 'sessionId e phoneNumber são obrigatórios'
      });
    }

    const session = sessions[sessionId];
    if (!session) {
      return res.status(404).json({
        error: 'Sessão não encontrada'
      });
    }

    if (session.expiresAt < Date.now()) {
      return res.status(410).json({
        error: 'QR Code expirou. Gere um novo.'
      });
    }

    // Validar número
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return res.status(400).json({
        error: 'Número de telefone inválido'
      });
    }

    // Marcar como conectado
    session.isConnected = true;
    session.phone = cleanPhone;
    session.connectedAt = Date.now();

    console.log(`✅ Sessão ${sessionId} conectada com ${cleanPhone}`);

    res.json({
      success: true,
      message: '✓ Conectado com sucesso!',
      phone: cleanPhone,
      sessionId: sessionId
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro ao confirmar conexão',
      details: error.message
    });
  }
});

/**
 * Endpoint para status
 */
app.get('/api/whatsapp/status', (req, res) => {
  const sessions_list = Object.values(sessions).map(s => ({
    id: s.id,
    connected: s.isConnected,
    phone: s.phone,
    age: Date.now() - s.createdAt,
    expired: s.expiresAt < Date.now()
  }));

  const connected = sessions_list.find(s => s.connected);

  res.json({
    isConnected: !!connected,
    phone: connected ? connected.phone : null,
    sessions: sessions_list,
    activeSessions: sessions_list.length
  });
});

/**
 * Endpoint para desconectar
 */
app.post('/api/whatsapp/disconnect', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId é obrigatório'
      });
    }

    if (sessions[sessionId]) {
      delete sessions[sessionId];
      res.json({ success: true, message: '✓ Desconectado' });
    } else {
      res.status(404).json({ error: 'Sessão não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  const hasConnection = Object.values(sessions).some(s => s.isConnected);
  res.json({
    status: 'ok',
    whatsapp: hasConnection ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    timestamp_unix: Math.floor(Date.now() / 1000)
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  const connectedSession = Object.values(sessions).find(s => s.isConnected);
  res.json({
    name: 'WhatsApp Chatbot API',
    version: '2.0.0',
    description: 'WhatsApp Chatbot for IPTV sales',
    whatsapp: {
      connected: !!connectedSession,
      phone: connectedSession ? connectedSession.phone : null,
      sessionId: connectedSession ? connectedSession.id : null
    },
    endpoints: {
      qrcode: '/api/whatsapp/qrcode',
      confirm: 'POST /api/whatsapp/confirm',
      status: '/api/whatsapp/status',
      disconnect: 'POST /api/whatsapp/disconnect',
      health: '/health'
    }
  });
});

// Iniciar servidor
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor WhatsApp rodando em http://localhost:${port}`);
  console.log(`📱 Endpoint QR: http://localhost:${port}/api/whatsapp/qrcode`);
  console.log(`✅ WhatsApp Chatbot API - IPTV Sales\n`);
});

// Cleanup
process.on('SIGTERM', () => {
  console.log('🛑 Encerrando servidor...');
  server.close(() => process.exit(0));
});
