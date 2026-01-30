const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

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

let currentQRCode = '';
let isConnected = false;
let clientPhone = '';
let clientInitialized = false;

// Criar diretório de autenticação
const authPath = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(authPath)) {
  fs.mkdirSync(authPath, { recursive: true });
}

// Inicializar cliente WhatsApp
console.log('🔄 Inicializando cliente WhatsApp...');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'iptv-bot',
    dataPath: authPath
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ],
    executablePath: undefined // Usar padrão do sistema
  }
});

// Quando gera QR code
client.on('qr', async (qr) => {
  console.log('📱 QR Code gerado!');
  currentQRCode = qr;
  isConnected = false;
  
  try {
    // Gerar imagem do QR code
    const qrImage = await QRCode.toDataURL(qr, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('✓ QR Code convertido para imagem');
  } catch (err) {
    console.error('❌ Erro ao gerar imagem QR:', err.message);
  }
});

// Quando conecta com sucesso
client.on('ready', () => {
  console.log('✅ Cliente WhatsApp conectado!');
  isConnected = true;
  currentQRCode = '';
  
  // Obter informações do número
  const info = client.info;
  if (info && info.wid) {
    clientPhone = info.wid.user;
    console.log(`📱 Telefone conectado: +${clientPhone}`);
  }
});

// Quando desconecta
client.on('disconnected', (reason) => {
  console.log('❌ Cliente desconectado:', reason);
  isConnected = false;
  clientPhone = '';
});

// Erros
client.on('error', (error) => {
  console.error('⚠️ Erro no cliente WhatsApp:', error.message);
});

// Inicializar cliente
client.initialize().catch(err => {
  console.error('❌ Erro ao inicializar cliente:', err.message);
});

// Endpoint para obter QR code
app.get('/api/whatsapp/qrcode', async (req, res) => {
  try {
    if (!clientInitialized && currentQRCode === '') {
      return res.status(503).json({
        error: 'Cliente ainda está inicializando',
        message: 'Por favor, aguarde alguns segundos e tente novamente',
        status: 'initializing'
      });
    }

    if (isConnected) {
      return res.json({
        qrCode: null,
        sessionId: 'iptv-bot',
        isConnected: true,
        phone: clientPhone,
        message: '✓ Já conectado ao WhatsApp!',
        status: 'connected'
      });
    }

    if (currentQRCode === '') {
      return res.status(503).json({
        error: 'QR code ainda não foi gerado',
        message: 'O QR code será exibido em alguns segundos',
        status: 'waiting'
      });
    }

    // Converter QR code para imagem
    const qrImage = await QRCode.toDataURL(currentQRCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      qrCode: qrImage,
      sessionId: 'iptv-bot',
      isConnected: false,
      phone: null,
      expiresIn: 120000,
      message: '✓ QR Code real gerado! Escaneie com seu WhatsApp',
      status: 'ready'
    });

  } catch (error) {
    console.error('❌ Erro ao gerar QR code:', error);
    res.status(500).json({
      error: 'Erro ao gerar QR code',
      details: error.message
    });
  }
});

// Endpoint para verificar status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    isConnected: isConnected,
    phone: clientPhone,
    qrCodeReady: currentQRCode !== '',
    status: isConnected ? 'connected' : (currentQRCode ? 'ready' : 'initializing')
  });
});

// Endpoint para desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    if (isConnected) {
      await client.logout();
      isConnected = false;
      clientPhone = '';
      currentQRCode = '';
      res.json({ success: true, message: 'Desconectado com sucesso' });
    } else {
      res.status(400).json({ error: 'Cliente não está conectado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    whatsappStatus: isConnected ? 'connected' : 'disconnected'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Chatbot API',
    version: '1.0.0',
    description: 'WhatsApp Chatbot for IPTV sales',
    whatsappStatus: isConnected ? 'connected' : 'disconnected',
    phone: clientPhone || 'not connected',
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
  clientInitialized = true;
});

process.on('SIGTERM', () => {
  console.log('🛑 Servidor encerrado');
  process.exit(0);
});
