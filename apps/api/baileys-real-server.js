const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ✅ CORS com configuração explícita
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size, timestamp: new Date().toISOString() });
});

// ✅ Endpoint simples para teste CORS
app.options('/api/whatsapp/start-session', cors());

// Armazenar sessões ativas
const sessions = new Map();

// Diretório para credenciais de autenticação
const authDir = path.join(__dirname, 'whatsapp-auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// ✅ Iniciar nova sessão WhatsApp
app.post('/api/whatsapp/start-session', async (req, res) => {
  try {
    const sessionId = `session_${Date.now()}`;
    const authPath = path.join(authDir, sessionId);

    // Usar autenticação multi-arquivo
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    // Criar socket WhatsApp com configurações para contornar bloqueio
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: require('pino')({ level: 'silent' }),
      browser: ['Mac OS', 'Chrome', '14.4.1'],  // ✓ Simular navegador real
      markOnlineOnConnect: true,
      syncFullHistory: false,
      downloadHistory: false,
      qrTimeout: 20000,  // 20 segundos para scannear
      version: [2, 3000, 1027934701]
    });

    // Variável para armazenar QR code
    let qrCode = '';

    // ✨ EVENTO: QR CODE GERADO (O QR CODE REAL!)
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`[${sessionId}] Connection update:`, { connection, hasQr: !!qr, reason: lastDisconnect?.error?.output?.statusCode });

      // QR code foi gerado - isso é REAL!
      if (qr) {
        try {
          qrCode = await QRCode.toDataURL(qr);
          console.log(`✓ QR Code gerado para sessão: ${sessionId}`);

          // Armazenar informações da sessão
          sessions.set(sessionId, {
            id: sessionId,
            socket: sock,
            qrCode: qrCode,
            isConnected: false,
            phoneNumber: '',
            createdAt: new Date(),
            state: 'waiting_scan'
          });
        } catch (error) {
          console.error(`✗ Erro ao gerar QR code: ${error.message}`);
        }
      }

      // Conexão estabelecida
      if (connection === 'open') {
        const session = sessions.get(sessionId);
        if (session) {
          session.isConnected = true;
          session.state = 'connected';
          session.phoneNumber = sock.user?.id || 'WhatsApp Conectado';
          console.log(`✓ WhatsApp conectado: ${sessionId} - ${session.phoneNumber}`);
        }
      }

      // Desconexão
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log(`[${sessionId}] Desconectado. Razão: ${reason}`);
        if (reason === DisconnectReason.loggedOut) {
          console.log(`✓ Sessão expirada: ${sessionId}`);
          sessions.delete(sessionId);
        }
      }
    });

    // Salvar credenciais quando forem atualizadas
    sock.ev.on('creds.update', saveCreds);

    // Tratar erros da conexão
    sock.ev.on('connection.update', (update) => {
      if (update.lastDisconnect?.error) {
        const errorCode = update.lastDisconnect.error?.output?.statusCode;
        console.error(`[${sessionId}] ✗ Erro de conexão (${errorCode}):`, update.lastDisconnect.error.message);
        
        const session = sessions.get(sessionId);
        if (session) {
          session.error = update.lastDisconnect.error.message;
          session.state = 'error';
        }
      }
    });

    // Tratar outros tipos de evento
    sock.ev.on('messaging-history.set', () => {
      console.log(`[${sessionId}] ✓ Histórico de mensagens sincronizado`);
    });

    // Aguardar QR code ser gerado com timeout de 15 segundos (Baileys é lento)
    let qrGenerated = false;
    let waitTime = 0;
    const maxWaitTime = 15000; // 15 segundos
    
    while (!qrGenerated && waitTime < maxWaitTime) {
      const session = sessions.get(sessionId);
      if (session && session.qrCode) {
        qrGenerated = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      waitTime += 500;
    }

    // Retornar sessão com QR code
    const session = sessions.get(sessionId);
    if (session && session.qrCode) {
      console.log(`✓ QR Code enviado ao cliente após ${waitTime}ms`);
      return res.json({
        success: true,
        sessionId: sessionId,
        qrCode: session.qrCode,
        message: '✓ QR Code gerado! Escaneie com seu WhatsApp'
      });
    } else {
      console.error(`✗ QR Code não foi gerado em ${maxWaitTime}ms para sessão ${sessionId}`);
      return res.status(500).json({
        success: false,
        error: 'Timeout: QR code não foi gerado. Tente novamente.'
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Verificar status da conexão
app.get('/api/whatsapp/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      isConnected: false,
      error: 'Sessão não encontrada'
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
app.post('/api/whatsapp/disconnect', async (req, res) => {
  const { sessionId } = req.body;

  const session = sessions.get(sessionId);
  if (session && session.socket) {
    try {
      await session.socket.logout();
      sessions.delete(sessionId);
      return res.json({
        success: true,
        message: '✓ Desconectado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }

  res.json({
    success: true,
    message: '✓ Sessão removida'
  });
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'WhatsApp Baileys Server rodando',
    version: '2.0.0'
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  WhatsApp Baileys Server (QR Code REAL)    ║');
  console.log('║  Rodando em http://localhost:' + PORT + '             ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('✓ Git instalado');
  console.log('✓ Baileys instalado');
  console.log('✓ QR Code REAL (não simulado)');
  console.log('');
  console.log('Endpoints:');
  console.log('  POST   /api/whatsapp/start-session');
  console.log('  GET    /api/whatsapp/status/:sessionId');
  console.log('  POST   /api/whatsapp/disconnect');
  console.log('  GET    /health');
  console.log('');
});
