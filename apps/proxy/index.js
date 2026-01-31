const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;

// Proxy para API
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' }
}));

// Proxy para Admin (tudo mais)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  ws: true
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Proxy Express rodando na porta ${PORT}`);
  console.log('📍 /api -> localhost:3000');
  console.log('📍 /* -> localhost:3001');
});
