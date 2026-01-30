const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const connections = new Map();

// HTML Homepage
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Chatbot API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { 
      max-width: 600px; 
      background: rgba(0,0,0,0.2); 
      padding: 50px; 
      border-radius: 10px;
      text-align: center;
    }
    h1 { font-size: 2.5em; margin-bottom: 20px; }
    .status { 
      background: #10b981; 
      padding: 10px 20px; 
      border-radius: 20px; 
      display: inline-block; 
      margin: 20px 0;
      font-weight: bold;
    }
    button { 
      background: white; 
      color: #667eea; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 5px; 
      cursor: pointer; 
      font-weight: bold;
      margin-top: 20px;
    }
    button:hover { background: #f0f0f0; }
    ul { text-align: left; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 WhatsApp Chatbot API</h1>
    <div class="status">✓ ONLINE</div>
    <p>Sistema de automação WhatsApp com IA</p>
    <p>Versão 1.0.0 | Node.js + Express</p>
    
    <p style="margin-top: 30px;"><strong>Endpoints:</strong></p>
    <ul>
      <li>GET /health - Status da API</li>
      <li>POST /api/whatsapp/start-session - Gerar QR Code</li>
      <li>GET /api/whatsapp/status/:sessionId - Status da sessão</li>
    </ul>
    
    <button onclick="testHealth()">Testar Status</button>
  </div>
  
  <script>
    function testHealth() {
      fetch('/health')
        .then(r => r.json())
        .then(d => alert(JSON.stringify(d, null, 2)))
        .catch(e => alert('Erro: ' + e.message));
    }
  </script>
</body>
</html>`;
  res.send(html);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando!', timestamp: new Date() });
});

// Start Session
app.post('/api/whatsapp/start-session', async (req, res) => {
  try {
    const sessionId = Date.now().toString();
    const qrDataUrl = await QRCode.toDataURL(sessionId);
    
    connections.set(sessionId, {
      sessionId,
      qrCode: qrDataUrl,
      isConnected: false,
      phoneNumber: ''
    });
    
    res.json({
      success: true,
      sessionId,
      qrCode: qrDataUrl,
      message: 'QR Code gerado com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Session Status
app.get('/api/whatsapp/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conn = connections.get(sessionId);
  
  if (!conn) {
    return res.status(404).json({
      success: false,
      message: 'Sessão não encontrada'
    });
  }
  
  res.json({
    success: true,
    sessionId,
    isConnected: conn.isConnected,
    phoneNumber: conn.phoneNumber || 'Não conectado'
  });
});

app.listen(PORT, () => {
  console.log(`✅ API rodando em http://0.0.0.0:${PORT}`);
});
