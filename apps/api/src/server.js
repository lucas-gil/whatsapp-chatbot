#!/usr/bin/env node

/**
 * 🚀 WhatsApp Chatbot API - Versão Simplificada
 * Servidor Express em vez de Fastify para melhor compatibilidade
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===== API HOME =====
app.get('/api', (req, res) => {
  res.json({
    name: 'WhatsApp Chatbot API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      info: 'GET /api',
      messages: 'POST /api/message',
      webhook: 'POST /webhook/whatsapp',
      contacts: 'GET /api/contacts'
    }
  });
});

// ===== WEBHOOK WHATSAPP (GET - Validação) =====
app.get('/webhook/whatsapp', (req, res) => {
  const verifyToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'webhook_token_seguro_123';
  
  if (verifyToken === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook validado com sucesso');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Token de webhook inválido');
    res.status(403).send('Forbidden');
  }
});

// ===== WEBHOOK WHATSAPP (POST - Receber mensagens) =====
app.post('/webhook/whatsapp', (req, res) => {
  console.log('📱 Mensagem WhatsApp recebida:', JSON.stringify(req.body, null, 2));
  
  const body = req.body;
  
  // Validar estrutura da mensagem
  if (body.object) {
    if (body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]) {
      
      const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body.entry[0].changes[0].value.messages[0].from; // sender's number
      const msgBody = body.entry[0].changes[0].value.messages[0].text?.body || 'sem texto';
      
      console.log(`\n📨 Nova mensagem de ${from}:\n"${msgBody}"\n`);
      
      // Responder com sucesso
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('event not found');
    }
  } else {
    res.status(404).send('object not found');
  }
});

// ===== API: Enviar mensagem =====
app.post('/api/message', (req, res) => {
  const { to, text } = req.body;
  
  console.log(`📤 Enviando mensagem para ${to}: "${text}"`);
  
  // Resposta simulada
  res.json({
    success: true,
    to,
    message: text,
    timestamp: new Date().toISOString(),
    status: 'queued'
  });
});

// ===== API: Listar contatos =====
app.get('/api/contacts', (req, res) => {
  res.json({
    contacts: [
      {
        id: '1',
        phone: '5511987654321',
        name: 'João Silva',
        status: 'prospect',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        phone: '5511912345678',
        name: 'Maria Santos',
        status: 'lead',
        createdAt: new Date().toISOString()
      }
    ],
    total: 2
  });
});

// ===== API: Informações do contato =====
app.get('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    id,
    phone: '5511987654321',
    name: 'João Silva',
    email: 'joao@example.com',
    device: 'TV_SMART',
    status: 'prospect',
    createdAt: new Date().toISOString(),
    conversations: []
  });
});

// ===== API: Planos =====
app.get('/api/plans', (req, res) => {
  res.json({
    plans: [
      {
        id: '1',
        name: 'Básico',
        description: 'Plano básico para iniciantes',
        price: 2999, // R$ 29,99
        billingCycle: 30,
        features: ['Até 10 contatos', 'Chat ilimitado', 'Suporte por email'],
        active: true
      },
      {
        id: '2',
        name: 'Pro',
        description: 'Plano profissional com mais recursos',
        price: 9999, // R$ 99,99
        billingCycle: 30,
        features: ['Até 100 contatos', 'Chat ilimitado', 'Automações', 'Suporte prioritário'],
        active: true
      }
    ]
  });
});

// ===== API: Tickets de suporte =====
app.get('/api/tickets', (req, res) => {
  res.json({
    tickets: [
      {
        id: '1',
        category: 'instalacao',
        priority: 'normal',
        status: 'open',
        subject: 'Dúvida sobre instalação',
        createdAt: new Date().toISOString()
      }
    ],
    total: 1
  });
});

// ===== Servir arquivos estáticos (front-end) =====
app.use(express.static(join(__dirname, '../../public')));

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ===== ERRO 500 =====
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🚀 WhatsApp Chatbot API Iniciado com Sucesso         ║
║                                                            ║
║  📊 Server: http://localhost:${PORT}                          ║
║  📱 Webhook: http://localhost:${PORT}/webhook/whatsapp    ║
║  🖥️  Admin:  http://localhost:3001                         ║
║                                                            ║
║  ✅ Sistema pronto para receber mensagens WhatsApp!       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  console.log(`
Endpoints disponíveis:
  GET  /health                    - Health check
  GET  /api                       - Informações da API
  POST /webhook/whatsapp          - Receber/validar webhook
  POST /api/message               - Enviar mensagem
  GET  /api/contacts              - Listar contatos
  GET  /api/contacts/:id          - Detalhe do contato
  GET  /api/plans                 - Listar planos
  GET  /api/tickets               - Listar tickets
  `);
});

// ===== TRATAMENTO DE SINAIS =====
process.on('SIGTERM', () => {
  console.log('\n📴 Servidor encerrado');
  process.exit(0);
});
