const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

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
let clientReady = false;
let whatsappClient = null;
let lastQRTime = 0;

const authPath = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(authPath)) {
  fs.mkdirSync(authPath, { recursive: true });
}

console.log('🔄 Iniciando WhatsApp Client...\n');

// Criar cliente com configuração otimizada para Windows
try {
  whatsappClient = new Client({
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
        '--disable-web-resources',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-plugins',
        '--disable-images',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--enable-automation',
        '--disable-device-discovery-notifications',
      ],
      dumpio: false,
      timeout: 60000
    }
  });

  // QR Code event
  whatsappClient.on('qr', async (qr) => {
    const now = Date.now();
    lastQRTime = now;
    currentQRCode = qr;
    isConnected = false;
    
    console.log(`📱 QR Code gerado em ${new Date().toLocaleTimeString('pt-BR')}`);
  });

  // Ready event
  whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp Client PRONTO!');
    clientReady = true;
    isConnected = true;
    currentQRCode = '';
    
    const info = whatsappClient.info;
    if (info && info.wid) {
      clientPhone = info.wid.user;
      console.log(`📱 Conectado com: +${clientPhone}\n`);
    }
  });

  // Disconnected event
  whatsappClient.on('disconnected', (reason) => {
    console.log(`⚠️ Desconectado: ${reason}`);
    isConnected = false;
    clientReady = false;
    clientPhone = '';
  });

  // Error event
  whatsappClient.on('error', (error) => {
    console.error(`❌ Erro WhatsApp: ${error.message}`);
  });

  // Inicializar
  console.log('⏳ Aguardando inicialização do navegador...');
  whatsappClient.initialize().catch(err => {
    console.error(`⚠️ Erro na inicialização: ${err.message}`);
    console.log('💡 Dica: Se persistir, tente deletar a pasta .wwebjs_auth');
  });

} catch (error) {
  console.error(`❌ Erro ao criar cliente: ${error.message}`);
}

// Endpoint QR Code
app.get('/api/whatsapp/qrcode', async (req, res) => {
  try {
    // Se já está conectado
    if (isConnected && clientPhone) {
      return res.json({
        qrCode: null,
        isConnected: true,
        phone: clientPhone,
        message: '✓ Já conectado ao WhatsApp!',
        status: 'connected'
      });
    }

    // Se tem QR code disponível
    if (currentQRCode) {
      try {
        const qrImage = await QRCode.toDataURL(currentQRCode, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.98,
          margin: 2,
          width: 300,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        return res.json({
          qrCode: qrImage,
          isConnected: false,
          phone: null,
          message: '✓ QR Code REAL gerado! Escaneie com WhatsApp',
          status: 'qr_ready',
          age: Date.now() - lastQRTime
        });
      } catch (err) {
        console.error('Erro ao converter QR:', err.message);
      }
    }

    // Aguardando QR code
    res.status(202).json({
      qrCode: null,
      isConnected: false,
      phone: null,
      message: '⏳ Gerando QR Code real...',
      status: 'initializing',
      clientReady: clientReady
    });

  } catch (error) {
    console.error('Erro no endpoint:', error.message);
    res.status(500).json({
      error: 'Erro ao obter QR code',
      details: error.message
    });
  }
});

// Endpoint status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    isConnected: isConnected,
    phone: clientPhone,
    qrReady: currentQRCode !== '',
    clientReady: clientReady,
    status: isConnected ? 'connected' : (currentQRCode ? 'scanning' : 'initializing')
  });
});

// Endpoint desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    if (whatsappClient) {
      await whatsappClient.logout();
      isConnected = false;
      clientPhone = '';
      res.json({ success: true, message: 'Desconectado' });
    } else {
      res.status(400).json({ error: 'Cliente não disponível' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Chatbot API',
    version: '1.0.0',
    whatsapp: {
      connected: isConnected,
      ready: clientReady,
      phone: clientPhone || 'não conectado'
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📱 QR Code endpoint: http://localhost:${port}/api/whatsapp/qrcode\n`);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Encerrando...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});
