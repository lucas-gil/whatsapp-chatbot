const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando!' });
});

app.get('/', (req, res) => {
  const adminPath = path.join(__dirname, '../../public/admin.html');
  if (fs.existsSync(adminPath)) {
    return res.sendFile(adminPath);
  }
  res.json({ message: 'WhatsApp Chatbot API Online' });
});

app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, '../../public/admin.html');
  if (fs.existsSync(adminPath)) {
    return res.sendFile(adminPath);
  }
  res.status(404).json({ error: 'Admin not found' });
});

app.get('/painel', (req, res) => {
  const adminPath = path.join(__dirname, '../../public/admin.html');
  if (fs.existsSync(adminPath)) {
    return res.sendFile(adminPath);
  }
  res.status(404).json({ error: 'Painel not found' });
});

// API Endpoints
app.post('/api/whatsapp/start-session', (req, res) => {
  res.json({ success: true, sessionId: Date.now(), message: 'Session started' });
});

app.get('/api/whatsapp/status/:sessionId', (req, res) => {
  res.json({ success: true, isConnected: false });
});

app.post('/api/whatsapp/send-message', (req, res) => {
  res.json({ success: true, message: 'Message sent' });
});

app.get('/api/contacts', (req, res) => {
  res.json({ success: true, contacts: [] });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API rodando em porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido');
  server.close(() => process.exit(0));
});

module.exports = app;
