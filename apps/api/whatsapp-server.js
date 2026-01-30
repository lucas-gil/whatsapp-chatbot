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

// Inicializar cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'iptv-bot',
    dataPath: path.join(__dirname, '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Quando gera QR code
client.on('qr', (qr) => {
  console.log('📱 QR Code gerado!');
  currentQRCode = qr;
  
  // Gerar imagem do QR code
  QRCode.toDataURL(qr, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    width: 300,
  }).then(url => {
    currentQRCode = url;
  });
});

// Quando conecta
client.on('ready', () => {
  console.log('✅ WhatsApp conectado com sucesso!');
  isConnected = true;
  currentQRCode = '';
  
  // Obter número do telefone
  const info = client.info;
  clientPhone = info?.phone?.number || 'Desconhecido';
  console.log(`📞 Telefone: ${clientPhone}`);
});

// Quando desconecta
client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp desconectado:', reason);
  isConnected = false;
  currentQRCode = '';
});

// Erro
client.on('error', (error) => {
  console.error('Erro:', error);
});

// Inicializar cliente
client.initialize();

// Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '🚀 WhatsApp Chatbot API is running!'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Chatbot API',
    version: '1.0.0',
    description: 'WhatsApp Chatbot for IPTV sales',
    whatsapp: {
      isConnected,
      phone: clientPhone
    }
  });
});

// Obter QR code
app.get('/api/whatsapp/qrcode', (req, res) => {
  if (!currentQRCode) {
    return res.status(400).json({ 
      error: 'QR Code não disponível',
      status: isConnected ? 'connected' : 'generating'
    });
  }
  
  res.json({ 
    qrCode: currentQRCode,
    isConnected,
    phone: clientPhone
  });
});

// Status da conexão
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    isConnected,
    phone: clientPhone,
    hasQRCode: !!currentQRCode
  });
});

// Desconectar
app.post('/api/whatsapp/disconnect', (req, res) => {
  client.destroy();
  isConnected = false;
  currentQRCode = '';
  clientPhone = '';
  
  res.json({ message: 'WhatsApp desconectado' });
});

// Enviar mensagem (teste)
app.post('/api/whatsapp/send', (req, res) => {
  const { phone, message } = req.body;
  
  if (!isConnected) {
    return res.status(400).json({ error: 'WhatsApp não conectado' });
  }
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
  }
  
  // Formatar número (remover caracteres especiais)
  const chatId = phone.replace(/\D/g, '') + '@c.us';
  
  client.sendMessage(chatId, message)
    .then(() => {
      res.json({ success: true, message: 'Mensagem enviada' });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor WhatsApp rodando em http://localhost:${port}`);
  console.log(`📱 WhatsApp Web Integration - IPTV Sales`);
  console.log(`🔗 Acesse http://localhost:${port}/api/whatsapp/qrcode para o QR code`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Servidor encerrado');
  client.destroy();
  process.exit(0);
});
