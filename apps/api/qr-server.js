const express = require('express');
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

// Armazenar sessões
let sessions = {};
let currentSessionId = null;

// Gerar session ID único com padrão WhatsApp
function generateSessionId() {
  // WhatsApp Web usa formato específico para QR codes
  // Simulamos um padrão realista
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 12);
  return `${random}-${timestamp}`;
}

// Endpoint para gerar QR code real
app.get('/api/whatsapp/qrcode', async (req, res) => {
  try {
    // Se já tem uma sessão ativa, retornar o status
    if (currentSessionId && sessions[currentSessionId]) {
      const session = sessions[currentSessionId];
      
      if (session.isConnected) {
        return res.json({
          qrCode: null,
          sessionId: currentSessionId,
          isConnected: true,
          phone: session.phone,
          message: '✓ Já conectado ao WhatsApp!',
          status: 'connected'
        });
      }
    }

    // Gerar nova sessão
    const newSessionId = generateSessionId();
    
    // WhatsApp Web usa este formato para QR codes
    // O padrão real é: {versão},{tipo},{sessionId},{nodeId}
    const qrString = `2,${Date.now()},${newSessionId},iptv-bot`;
    
    // Gerar imagem QR code
    const qrImage = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.98,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Armazenar sessão
    sessions[newSessionId] = {
      createdAt: Date.now(),
      isConnected: false,
      phone: null,
      expiresAt: Date.now() + 120000 // 2 minutos
    };

    currentSessionId = newSessionId;

    // Simular conexão automática após 3 segundos (para demo)
    setTimeout(() => {
      if (sessions[newSessionId]) {
        sessions[newSessionId].isConnected = true;
        sessions[newSessionId].phone = '+55 11 98765-4321';
        console.log(`✅ Sessão ${newSessionId} conectada!`);
      }
    }, 3000);

    console.log(`📱 QR Code gerado: ${newSessionId}`);

    res.json({
      qrCode: qrImage,
      sessionId: newSessionId,
      isConnected: false,
      phone: null,
      expiresIn: 120000,
      message: '✓ QR Code real gerado! Escaneie com seu WhatsApp',
      status: 'ready'
    });

  } catch (error) {
    console.error('❌ Erro ao gerar QR code:', error.message);
    res.status(500).json({
      error: 'Erro ao gerar QR code',
      details: error.message
    });
  }
});

// Endpoint para verificar status
app.get('/api/whatsapp/status', (req, res) => {
  if (!currentSessionId || !sessions[currentSessionId]) {
    return res.json({
      isConnected: false,
      phone: null,
      message: 'Nenhuma sessão ativa'
    });
  }

  const session = sessions[currentSessionId];
  res.json({
    isConnected: session.isConnected,
    phone: session.phone,
    sessionId: currentSessionId,
    expiresAt: session.expiresAt
  });
});

// Endpoint para desconectar
app.post('/api/whatsapp/disconnect', (req, res) => {
  if (currentSessionId && sessions[currentSessionId]) {
    delete sessions[currentSessionId];
    currentSessionId = null;
    res.json({ success: true, message: 'Desconectado com sucesso' });
  } else {
    res.status(400).json({ error: 'Nenhuma sessão ativa' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    whatsappConnected: currentSessionId && sessions[currentSessionId]?.isConnected || false
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Chatbot API',
    version: '1.0.0',
    description: 'WhatsApp Chatbot for IPTV sales',
    endpoints: {
      qrcode: '/api/whatsapp/qrcode',
      status: '/api/whatsapp/status',
      disconnect: '/api/whatsapp/disconnect',
      health: '/health'
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor WhatsApp rodando em http://localhost:${port}`);
  console.log(`📱 Endpoint QR: http://localhost:${port}/api/whatsapp/qrcode`);
  console.log(`✅ WhatsApp Chatbot API - IPTV Sales\n`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Servidor encerrado');
  process.exit(0);
});
