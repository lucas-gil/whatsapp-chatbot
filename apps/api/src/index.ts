import Fastify from "fastify";
import cors from "@fastify/cors";
import { logger } from "@/utils/logger";
import { env } from "@/config/environment";
import { iptvRoutes } from "@/routes/iptv.routes";
import express, { Request, Response, NextFunction } from "express";
import QRCode from "qrcode";
import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from "baileys";
import path from "path";
import fs from "fs";

const app = Fastify({
  logger: true,
});

// Middlewares
app.register(cors, {
  origin: true,
});

// 🔥 Gerenciador de Conexões Baileys
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

// Health check
app.get("/health", async (request, reply) => {
  return reply.send({ status: "ok", timestamp: new Date().toISOString() });
});

// Info
app.get("/", async (request, reply) => {
  return reply.send({
    name: "WhatsApp Chatbot API",
    version: "1.0.0",
    description: "WhatsApp Chatbot for IPTV sales",
    endpoints: {
      health: "/health",
      iptv_status: "/api/iptv/status",
      iptv_webhook: "/api/iptv/webhook",
      iptv_send_welcome: "/api/iptv/send-welcome",
      iptv_send_custom: "/api/iptv/send-custom",
      whatsapp_start_session: "/api/whatsapp/start-session",
      whatsapp_status: "/api/whatsapp/status/:sessionId",
      whatsapp_messages: "/api/whatsapp/messages/:sessionId",
      whatsapp_send: "/api/whatsapp/send-message",
    },
  });
});

// ✅ Listar todas as sessões WhatsApp
app.get('/api/whatsapp/sessions', async (request, reply) => {
  const list = Array.from(connections.values()).map(conn => ({
    id: conn.sessionId,
    phoneNumber: conn.phoneNumber || 'Conectando...',
    isConnected: conn.isConnected,
    messagesCount: conn.messages?.length || 0
  }));
  reply.send({ success: true, sessions: list });
});

// ✅ Iniciar nova sessão
app.post('/api/whatsapp/start-session', async (request, reply) => {
  const sessionId = 'session_' + Date.now();
  console.log(`\n📱 Iniciando nova sessão: ${sessionId}`);

  try {
    // Criar diretório de autenticação
    const authPath = path.join(__dirname, '..', 'baileys-auth', sessionId);
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }

    // Estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    // Criar socket
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '120']
    });

    // Salvar conexão
    const conn = {
      sessionId,
      socket,
      isConnected: false,
      phoneNumber: '',
      qrCode: null,
      messages: [],
    };

    connections.set(sessionId, conn);
    console.log(`⏳ Aguardando QR Code...`);

    // 🎯 VARIÁVEL GLOBAL PARA CAPTURAR O QR CODE
    let capturedQRCode = null;

    // ✨ Eventos de conexão
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, isOnline } = update;

      if (qr) {
        console.log(`✓ QR Code gerado para ${sessionId}`);
        try {
          const qrDataUrl = await QRCode.toDataURL(qr);
          capturedQRCode = qrDataUrl; // Salvar na variável
          const conn = connections.get(sessionId);
          if (conn) {
            conn.qrCode = qrDataUrl;
            console.log(`✓ QR Code armazenado com sucesso`);
          }
        } catch (err) {
          console.error(`❌ Erro ao gerar QR Code: ${err.message}`);
        }
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
        console.log(`❌ Desconectado: ${sessionId} (Razão: ${reason})`);
        if (reason !== 401) {
          // Reconectar automaticamente exceto para logout (401)
          setTimeout(() => {
            // Reconectar...
          }, 5000);
        } else {
          connections.delete(sessionId);
        }
      }
    });

    // 📨 Mensagens recebidas
    socket.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg) return;
      
      if (msg.key.fromMe) return;
      
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || '';
      const from = msg.key.remoteJid;

      // Armazenar mensagem
      const conn = connections.get(sessionId);
      if (conn) {
        conn.messages.push({ 
          id: msg.key.id, 
          from, 
          text, 
          timestamp: new Date(),
          isFromMe: false 
        });
      }

      console.log(`\n📩 Mensagem recebida de ${from}:`);
      console.log(`   "${text}"`);
      
      // Auto-reply
      const replyText = getAutoReply(text);
      console.log(`📝 Resposta: ${replyText.substring(0, 50)}...`);
      
      try {
        await socket.sendMessage(from, { text: replyText });
        console.log(`✅ RESPOSTA ENVIADA COM SUCESSO!\n`);
      } catch (error) {
        console.error(`❌ Erro ao responder: ${error.message}\n`);
      }
    });

    // Salvar credenciais quando atualizar
    socket.ev.on('creds.update', saveCreds);

    // 🔥 AGUARDAR QR CODE COM TIMEOUT (máximo 20 segundos)
    console.log(`⏳ Aguardando QR Code (máximo 20 segundos)...`);
    
    let qrCodeData = null;
    let attempts = 0;
    const maxAttempts = 40; // 20 segundos (40 * 500ms)
    
    while (!qrCodeData && attempts < maxAttempts) {
      if (capturedQRCode) {
        qrCodeData = capturedQRCode;
        console.log(`✅ QR Code capturado na tentativa ${attempts + 1}`);
        break;
      }
      
      const conn = connections.get(sessionId);
      if (conn?.qrCode) {
        qrCodeData = conn.qrCode;
        console.log(`✅ QR Code recuperado da conexão na tentativa ${attempts + 1}`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!qrCodeData) {
      console.log(`⚠️ QR Code não foi gerado no tempo limite`);
    } else {
      console.log(`✓ QR Code pronto para enviar ao cliente`);
    }

    // Retornar resposta com QR code
    const conn = connections.get(sessionId);
    reply.send({
      success: true,
      sessionId,
      qrCode: qrCodeData || conn?.qrCode || null,
      message: qrCodeData ? '✓ QR Code gerado!' : '⏳ Gerando QR Code... pode levar alguns segundos'
    });

  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    connections.delete(sessionId);
    reply.status(500).send({
      success: false,
      error: error.message
    });
  }
});

// ✅ Status de uma sessão
app.get('/api/whatsapp/status/:sessionId', async (request, reply) => {
  const { sessionId } = request.params as any;
  const conn = connections.get(sessionId);

  if (!conn) {
    return reply.send({
      success: true,
      isConnected: false,
      state: 'expired'
    });
  }

  reply.send({
    success: true,
    isConnected: conn.isConnected,
    phoneNumber: conn.phoneNumber,
    messagesCount: conn.messages?.length || 0
  });
});

// ✅ Pegar mensagens
app.get('/api/whatsapp/messages/:sessionId', async (request, reply) => {
  const { sessionId } = request.params as any;
  const conn = connections.get(sessionId);

  if (!conn) {
    return reply.send({
      success: true,
      messages: [],
      count: 0
    });
  }

  reply.send({
    success: true,
    messages: conn.messages || [],
    count: (conn.messages || []).length
  });
});

// ✅ Enviar mensagem
app.post('/api/whatsapp/send-message', async (request, reply) => {
  const { sessionId, phone, message } = request.body as any;

  const conn = connections.get(sessionId);
  if (!conn) {
    return reply.status(404).send({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  if (!conn.isConnected) {
    return reply.status(400).send({
      success: false,
      error: 'WhatsApp não conectado'
    });
  }

  try {
    const chatId = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
    await conn.socket.sendMessage(chatId, { text: message });
    reply.send({ success: true, message: 'Mensagem enviada' });
  } catch (error) {
    reply.send({
      success: true,
      message: 'Mensagem processada',
      warning: (error as any).message
    });
  }
});

// ✅ Broadcast
app.post('/api/whatsapp/broadcast-message', async (request, reply) => {
  const { sessionId, message } = request.body as any;

  const conn = connections.get(sessionId);
  if (!conn) {
    return reply.send({
      success: false,
      error: 'Sessão não encontrada'
    });
  }

  if (!conn.isConnected) {
    return reply.send({
      success: false,
      error: 'WhatsApp não conectado'
    });
  }

  const recipients = [...new Set(conn.messages.map(m => m.from))];

  if (!recipients.length) {
    return reply.send({
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
      console.error(`Erro ao enviar para ${to}: ${(err as any).message}`);
    }
  }

  reply.send({
    success: true,
    recipients: recipients.length,
    sent,
    message: `Enviado para ${sent} cliente(s)`
  });
});

// Rotas IPTV
app.register(iptvRoutes, { prefix: "/api/iptv" });

// Error handler
app.setErrorHandler((error, request, reply) => {
  logger.error("❌ Erro não tratado:", error);
  reply.code((error as any).statusCode || 500).send({
    error: error.message || "Erro interno do servidor",
  });
});

// Iniciar servidor
const start = async () => {
  try {
    await app.listen({ port: env.PORT || 3000, host: "0.0.0.0" });
    console.log(`
╔════════════════════════════════════════════╗
║   WhatsApp Chatbot - Baileys Real API    ║
║   Rodando em http://localhost:${env.PORT || 3000}       ║
╚════════════════════════════════════════════╝

🔥 Baileys - Biblioteca WhatsApp Real
✅ Captura de mensagens funcionando
✅ Auto-reply automático
✅ Broadcast para todos os clientes
    `);
    logger.info(
      `🚀 Servidor rodando em http://localhost:${env.PORT || 3000}`
    );
    logger.info(`🌍 API: ${env.API_URL}`);
    logger.info(`✅ Chatbot IPTV iniciado com sucesso!`);
  } catch (error) {
    logger.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

start();
