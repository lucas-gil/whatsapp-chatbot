#!/usr/bin/env node

/**
 * 🚀 WhatsApp Chatbot API - Servidor HTTP Puro
 * Node.js puro, sem dependências externas
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'webhook_token_seguro_123';

// Dados simulados (em produção seria um banco de dados)
const contacts = [
  {
    id: '1',
    phone: '5511987654321',
    name: 'João Silva',
    email: 'joao@example.com',
    device: 'TV_SMART',
    status: 'prospect',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    phone: '5511912345678',
    name: 'Maria Santos',
    email: 'maria@example.com',
    device: 'SMARTPHONE',
    status: 'lead',
    createdAt: new Date().toISOString()
  }
];

// Função para responder JSON
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Função para responder texto
function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(text);
}

// Servidor HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ===== HEALTH CHECK =====
  if (pathname === '/health' && method === 'GET') {
    return sendJSON(res, 200, {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  // ===== API HOME =====
  if (pathname === '/api' && method === 'GET') {
    return sendJSON(res, 200, {
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
  }

  // ===== WEBHOOK WHATSAPP (GET - Validação) =====
  if (pathname === '/webhook/whatsapp' && method === 'GET') {
    const verifyToken = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (verifyToken === WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook validado com sucesso');
      return sendText(res, 200, challenge);
    } else {
      console.error('❌ Token de webhook inválido');
      return sendText(res, 403, 'Forbidden');
    }
  }

  // ===== WEBHOOK WHATSAPP (POST - Receber mensagens) =====
  if (pathname === '/webhook/whatsapp' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log('📱 Mensagem WhatsApp recebida:', JSON.stringify(payload, null, 2));

        if (payload.object) {
          if (payload.entry &&
              payload.entry[0].changes &&
              payload.entry[0].changes[0].value.messages &&
              payload.entry[0].changes[0].value.messages[0]) {

            const from = payload.entry[0].changes[0].value.messages[0].from;
            const msgBody = payload.entry[0].changes[0].value.messages[0].text?.body || 'sem texto';

            console.log(`\n📨 Nova mensagem de ${from}:\n"${msgBody}"\n`);
          }
          return sendText(res, 200, 'EVENT_RECEIVED');
        }
      } catch (e) {
        console.error('Erro ao processar webhook:', e.message);
      }
      return sendText(res, 404, 'event not found');
    });
    return;
  }

  // ===== API: Enviar mensagem =====
  if (pathname === '/api/message' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`📤 Enviando mensagem para ${data.to}: "${data.text}"`);

        return sendJSON(res, 200, {
          success: true,
          to: data.to,
          message: data.text,
          timestamp: new Date().toISOString(),
          status: 'queued'
        });
      } catch (e) {
        return sendJSON(res, 400, { error: 'Corpo inválido' });
      }
    });
    return;
  }

  // ===== API: Listar contatos =====
  if (pathname === '/api/contacts' && method === 'GET') {
    return sendJSON(res, 200, {
      contacts: contacts,
      total: contacts.length
    });
  }

  // ===== API: Informações do contato =====
  if (pathname.match(/^\/api\/contacts\/[^\/]+$/) && method === 'GET') {
    const id = pathname.split('/')[3];
    const contact = contacts.find(c => c.id === id);

    if (contact) {
      return sendJSON(res, 200, {
        ...contact,
        conversations: []
      });
    }
    return sendJSON(res, 404, { error: 'Contato não encontrado' });
  }

  // ===== API: Planos =====
  if (pathname === '/api/plans' && method === 'GET') {
    return sendJSON(res, 200, {
      plans: [
        {
          id: '1',
          name: 'Básico',
          description: 'Plano básico para iniciantes',
          price: 2999,
          billingCycle: 30,
          features: ['Até 10 contatos', 'Chat ilimitado', 'Suporte por email'],
          active: true
        },
        {
          id: '2',
          name: 'Pro',
          description: 'Plano profissional com mais recursos',
          price: 9999,
          billingCycle: 30,
          features: ['Até 100 contatos', 'Chat ilimitado', 'Automações', 'Suporte prioritário'],
          active: true
        }
      ]
    });
  }

  // ===== API: Tickets =====
  if (pathname === '/api/tickets' && method === 'GET') {
    return sendJSON(res, 200, {
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
  }

  // ===== Página de Setup/Configuração =====
  if (pathname === '/setup') {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../public/setup.html');
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Erro ao carregar setup:', filePath, err.message);
        return sendJSON(res, 500, { error: 'Erro ao carregar página: ' + err.message });
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // ===== Servir arquivos estáticos =====
  if (pathname === '/' || pathname === '/admin.html') {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../public/admin.html');
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Erro ao carregar arquivo:', filePath, err.message);
        return sendJSON(res, 500, { error: 'Erro ao carregar página: ' + err.message });
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // ===== 404 =====
  return sendJSON(res, 404, { error: 'Rota não encontrada' });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🚀 WhatsApp Chatbot API Iniciado com Sucesso         ║
║                                                            ║
║  📊 Server: http://localhost:${PORT}                          ║
║  🖥️  Admin:  http://localhost:${PORT}                         ║
║  📱 Webhook: http://localhost:${PORT}/webhook/whatsapp    ║
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
  GET  /                          - Admin Dashboard
  `);
});

// Tratamento de sinais
process.on('SIGTERM', () => {
  console.log('\n📴 Servidor encerrado');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📴 Servidor encerrado');
  process.exit(0);
});
