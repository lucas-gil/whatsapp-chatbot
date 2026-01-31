const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');

// Criar proxy reverso
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true
});

// Server na porta 80 que redireciona para 3001
const server = http.createServer((req, res) => {
  // Se for /api, redireciona para API (3000)
  if (req.url.startsWith('/api')) {
    proxy.web(req, res, { target: 'http://localhost:3000' });
  } else {
    // Tudo mais vai para Admin (3001)
    proxy.web(req, res, { target: 'http://localhost:3001' });
  }
});

proxy.on('error', (err, req, res) => {
  res.writeHead(502, { 'Content-Type': 'text/plain' });
  res.end('Erro ao conectar ao servidor');
});

server.listen(80, '0.0.0.0', () => {
  console.log('✅ Proxy reverso rodando na porta 80');
  console.log('📍 /api -> localhost:3000');
  console.log('📍 /* -> localhost:3001');
});
