const http = require('http');

const hostname = '0.0.0.0';
const port = 3000;

const server = http.createServer((req, res) => {
  // Adicionar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Lidar com preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: '🚀 WhatsApp Chatbot API is running!'
    }));
  } else if (req.url === '/') {
    res.end(JSON.stringify({
      name: 'WhatsApp Chatbot API',
      version: '1.0.0',
      description: 'WhatsApp Chatbot for IPTV sales',
      endpoints: {
        health: '/health',
        webhook: '/webhook',
        plans: '/plans',
        send: '/send-message',
        contacts: '/api/contacts',
        payments: '/api/payments'
      }
    }));
  } else if (req.url.startsWith('/api/contacts')) {
    res.end(JSON.stringify({
      success: true,
      data: [
        { id: 1, name: 'João Silva', phone: '5511987654321', status: 'active' },
        { id: 2, name: 'Maria Santos', phone: '5511987654322', status: 'active' }
      ]
    }));
  } else if (req.url.startsWith('/api/payments')) {
    res.end(JSON.stringify({
      success: true,
      data: []
    }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(port, hostname, () => {
  console.log(`🚀 Servidor rodando em http://${hostname}:${port}`);
  console.log(`✅ WhatsApp Chatbot API - IPTV Sales`);
  console.log(`📱 Acesse http://localhost:${port} para mais detalhes`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Servidor encerrado');
  server.close();
});
