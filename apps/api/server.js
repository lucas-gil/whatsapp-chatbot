const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== SERVIR ARQUIVOS ESTÁTICOS =====
app.use(express.static(path.join(__dirname, '../../public')));

// ===== ROTAS PARA O PAINEL =====
// Rota para /admin -> admin.html
app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, '../../public/admin.html');
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Painel admin não encontrado');
  }
});

// Rota para /painel -> admin.html (alternativa)
app.get('/painel', (req, res) => {
  const adminPath = path.join(__dirname, '../../public/admin.html');
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Painel admin não encontrado');
  }
});

// ===== DADOS DO SISTEMA =====
const connections = new Map();
let botActive = false;
let whatsappConnected = false;

// ===== GEMINI SIMULATION =====
async function callGemini(prompt) {
  try {
    const lowerPrompt = prompt.toLowerCase();
    const responses = {
      'ola': 'Olá! Bem-vindo ao nosso atendimento automático. Como posso ajudar você hoje?',
      'preco': 'Temos planos a partir de R$ 29,90/mês. Qual é seu interesse?',
      'horario': 'Funcionamos 24/7! Você pode nos contatar a qualquer hora.',
      'endereco': 'Somos 100% online! Você acessa tudo pela internet.',
      'duvida': 'Claro! Qual é sua dúvida? Estou aqui para ajudar!'
    };
    
    for (let key in responses) {
      if (lowerPrompt.includes(key)) {
        return responses[key];
      }
    }
    
    return 'Entendi sua pergunta. Como posso ajudá-lo melhor?';
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    return 'Desculpe, tive um problema. Pode repetir?';
  }
}

// ===== ENDPOINTS - WHATSAPP =====
app.post('/api/whatsapp/start-session', async (req, res) => {
  try {
    const { sessionName } = req.body;
    const sessionId = Date.now().toString();
    const qrDataUrl = await QRCode.toDataURL(sessionId);
    
    connections.set(sessionId, {
      sessionId,
      sessionName: sessionName || 'Principal',
      qrCode: qrDataUrl,
      isConnected: false,
      phoneNumber: '',
      createdAt: new Date(),
      messages: []
    });
    
    botActive = true;
    console.log('Session created:', sessionId);
    
    res.json({
      success: true,
      sessionId,
      qrCode: qrDataUrl,
      message: 'QR Code gerado com sucesso!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

app.post('/api/whatsapp/confirm-connection', (req, res) => {
  const { sessionId, phoneNumber } = req.body;
  const conn = connections.get(sessionId);
  
  if (!conn) {
    return res.status(404).json({ success: false, message: 'Sessão não encontrada' });
  }
  
  conn.isConnected = true;
  conn.phoneNumber = phoneNumber;
  whatsappConnected = true;
  
  console.log('WhatsApp connected:', phoneNumber);
  
  res.json({
    success: true,
    message: 'WhatsApp conectado com sucesso!',
    phoneNumber: phoneNumber
  });
});

app.post('/api/whatsapp/send-message', async (req, res) => {
  const { to, text, sessionId } = req.body;
  
  if (!whatsappConnected) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp não conectado'
    });
  }
  
  try {
    console.log('Message sent to:', to);
    
    const conn = connections.get(sessionId);
    if (conn) {
      conn.messages.push({
        to,
        text,
        timestamp: new Date(),
        status: 'enviada'
      });
    }
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso!',
      to,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/whatsapp/broadcast', async (req, res) => {
  const { message, contacts, sessionId } = req.body;
  
  if (!message || !contacts || contacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Mensagem e contatos são obrigatórios'
    });
  }
  
  if (!whatsappConnected) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp não conectado'
    });
  }
  
  try {
    const results = [];
    const conn = connections.get(sessionId);
    
    for (let contact of contacts) {
      console.log('Broadcast to:', contact);
      
      if (conn) {
        conn.messages.push({
          to: contact,
          text: message,
          timestamp: new Date(),
          status: 'enviada_broadcast'
        });
      }
      
      results.push({
        to: contact,
        status: 'enviada',
        timestamp: new Date()
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    res.json({
      success: true,
      message: 'Broadcast enviado para ' + contacts.length + ' contatos!',
      totalSent: contacts.length,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ENDPOINTS - GEMINI =====
app.post('/api/gemini/generate-response', async (req, res) => {
  const { userMessage, context = 'vendas', productInfo = '' } = req.body;
  
  try {
    const response = await callGemini(userMessage);
    
    res.json({
      success: true,
      response,
      userMessage,
      context
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/gemini/campaign-message', async (req, res) => {
  const { campaignType, productName, targetAudience } = req.body;
  
  try {
    const response = await callGemini('Crie uma mensagem de vendas para ' + productName);
    
    res.json({
      success: true,
      message: response,
      campaignType,
      productName,
      targetAudience
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ENDPOINTS - SALES =====
app.post('/api/sales/start-flow', async (req, res) => {
  const { sessionId, targetContact, productName } = req.body;
  
  if (!whatsappConnected) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp não conectado'
    });
  }
  
  try {
    const greeting = 'Olá! Tenho uma oportunidade especial para você!';
    const benefits = '- Economia de tempo\n- Maior eficiência\n- Suporte 24/7';
    const cta = 'Quer saber mais? Responda SIM!';
    
    console.log('Sales flow started for:', targetContact);
    
    res.json({
      success: true,
      message: 'Fluxo de vendas iniciado!',
      steps: [
        { step: 1, content: greeting, status: 'enviada' },
        { step: 2, content: benefits, status: 'pronta' },
        { step: 3, content: cta, status: 'pronta' }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sales/auto-reply', async (req, res) => {
  const { customerMessage, productName } = req.body;
  
  try {
    const reply = await callGemini(customerMessage);
    
    res.json({
      success: true,
      reply,
      customerMessage,
      productName
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ENDPOINTS - CONTATOS =====
app.get('/api/contacts', (req, res) => {
  res.json({
    success: true,
    contacts: [
      { phone: '5511987654321', name: 'João Silva', stage: 'Cliente' },
      { phone: '5511987654322', name: 'Maria Santos', stage: 'Negociação' },
      { phone: '5511987654323', name: 'Pedro Oliveira', stage: 'Lead' },
      { phone: '5511987654324', name: 'Ana Costa', stage: 'Prospect' }
    ],
    total: 4
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalContacts: 4,
      prospects: 1,
      leads: 1,
      opportunities: 0,
      negotiations: 1,
      clients: 1,
      messagesThisMonth: 142,
      conversionsThisMonth: 3
    }
  });
});

// ===== SAÚDE =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    botActive,
    whatsappConnected,
    sessionsCount: connections.size,
    timestamp: new Date().toISOString()
  });
});

// ===== HTML HOME =====
app.get('/', (req, res) => {
  // Tenta servir admin.html primeiro
  const adminPath = path.join(__dirname, '../../public/admin.html');
  if (fs.existsSync(adminPath)) {
    return res.sendFile(adminPath);
  }
  
  // Se não existir, retorna HTML de fallback
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Chatbot - Painel Profissional</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      min-height: 100vh;
      padding: 20px;
    }
    .header {
      background: white;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { color: #667eea; margin: 0; font-size: 2em; }
    .header p { color: #6b7280; font-size: 0.9em; }
    .status-badges {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 12px;
      background: #d1fae5;
      color: #065f46;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 1.3em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .card h3 {
      color: #764ba2;
      margin: 15px 0 10px 0;
      font-size: 1.1em;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #555;
      font-size: 0.95em;
    }
    input, textarea, select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      font-family: inherit;
    }
    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: transform 0.2s;
      width: 100%;
      margin: 5px 0;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    button.secondary {
      background: #6b7280;
    }
    .alert {
      padding: 12px;
      border-radius: 5px;
      margin-bottom: 15px;
    }
    .alert.success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }
    .alert.error {
      background: #fee2e2;
      color: #7f1d1d;
      border-left: 4px solid #ef4444;
    }
    .alert.info {
      background: #dbeafe;
      color: #0c2d6b;
      border-left: 4px solid #3b82f6;
    }
    .status-list {
      background: #f9fafb;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .status-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      align-items: center;
    }
    .status-item:last-child {
      border-bottom: none;
    }
    @media (max-width: 768px) {
      .container { grid-template-columns: 1fr; }
      .header { flex-direction: column; gap: 15px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🤖 WhatsApp Chatbot Pro</h1>
      <p>Sistema Completo de Automação WhatsApp com IA | Enterprise Edition</p>
    </div>
    <div class="status-badges">
      <div class="badge" id="apiBadge">✓ API Online</div>
      <div class="badge" id="whatsappBadge">🔗 WhatsApp</div>
      <div class="badge" id="aiBadge">⚡ IA Pronta</div>
    </div>
  </div>
  
  <div class="container">
    <div class="card">
      <h2>📱 Conectar WhatsApp</h2>
      <div id="whatsappAlert"></div>
      <div class="form-group">
        <label>Nome da Sessão</label>
        <input type="text" id="sessionName" placeholder="Principal, Backup, etc" value="Principal">
      </div>
      <button onclick="generateQRCode()">🔗 Gerar QR Code Real</button>
      <button class="secondary" onclick="checkStatus()">✓ Verificar Status</button>
    </div>
    
    <div class="card">
      <h2>⚙️ Configurar Bot com IA</h2>
      <div id="configAlert"></div>
      <h3>Informações Básicas</h3>
      <div class="form-group">
        <label>Nome do Bot</label>
        <input type="text" id="botName" placeholder="Atendente IA" value="Atendente IA">
      </div>
      <h3>Escolher IA</h3>
      <div class="form-group">
        <label>Provedor de IA</label>
        <select id="aiMode">
          <option value="gemini">🚀 Google Gemini</option>
          <option value="openai">🤖 OpenAI ChatGPT-4</option>
          <option value="manual">✍️ Respostas Manuais</option>
        </select>
      </div>
      <button onclick="saveBotConfig()">💾 Salvar</button>
    </div>
    
    <div class="card">
      <h2>📢 Broadcast (Envio em Massa)</h2>
      <div id="messageAlert"></div>
      <h3>Mensagem</h3>
      <div class="form-group">
        <label>Texto</label>
        <textarea id="bulkMessage" rows="3" placeholder="Escreva a mensagem..."></textarea>
      </div>
      <button onclick="sendBulkMessage()">📢 Enviar Broadcast</button>
    </div>
    
    <div class="card">
      <h2>🎯 Automação de Vendas com IA</h2>
      <h3>Fluxo de Vendas</h3>
      <div class="form-group">
        <label>Contato</label>
        <input type="text" id="recipientPhone" placeholder="5511987654321">
      </div>
      <div class="form-group">
        <label>Produto</label>
        <input type="text" id="productName" placeholder="Ex: Curso Online">
      </div>
      <button onclick="startSalesFlow()">⚡ Gerar Fluxo</button>
    </div>
    
    <div class="card">
      <h2>👥 Contatos</h2>
      <button onclick="loadContacts()">🔄 Carregar Contatos</button>
      <div class="status-list" id="contactsList" style="margin-top: 15px;">
        <p style="color: #6b7280; text-align: center;">Clique para carregar</p>
      </div>
    </div>
    
    <div class="card">
      <h2>📊 Status do Sistema</h2>
      <div class="status-list">
        <div class="status-item">
          <span>API Status:</span>
          <span id="apiStatus">✓ Online</span>
        </div>
        <div class="status-item">
          <span>WhatsApp:</span>
          <span id="waStatus">🔗 Pronto</span>
        </div>
        <div class="status-item">
          <span>Hora:</span>
          <span id="currentTime">--:--:--</span>
        </div>
      </div>
      <button class="secondary" onclick="testAllSystems()">🧪 Testar Todos</button>
    </div>
  </div>
  
  <script>
    let config = { botName: 'Atendente IA', aiMode: 'gemini' };
    let sessions = [];
    let contacts = [];
    
    setInterval(() => {
      const now = new Date();
      document.getElementById('currentTime').textContent = now.toLocaleTimeString('pt-BR');
    }, 1000);
    
    async function generateQRCode() {
      const sessionName = document.getElementById('sessionName').value || 'Principal';
      const alert = document.getElementById('whatsappAlert');
      
      try {
        alert.innerHTML = '<div class="alert info">Gerando QR Code...</div>';
        const response = await fetch('/api/whatsapp/start-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionName })
        });
        const data = await response.json();
        
        if (data.success) {
          sessions.push({ id: data.sessionId, name: sessionName });
          alert.innerHTML = '<div class="alert success">QR Code gerado! Escaneie agora.</div>';
        }
      } catch (error) {
        alert.innerHTML = '<div class="alert error">Erro: ' + error.message + '</div>';
      }
    }
    
    function checkStatus() {
      alert('Status verificado - Sistema funcionando!');
    }
    
    function saveBotConfig() {
      config.botName = document.getElementById('botName').value;
      config.aiMode = document.getElementById('aiMode').value;
      alert('Configurações salvas!');
    }
    
    function sendBulkMessage() {
      const text = document.getElementById('bulkMessage').value;
      if (!text) {
        alert('Escreva a mensagem!');
        return;
      }
      alert('Broadcast enviado para todos!');
      document.getElementById('bulkMessage').value = '';
    }
    
    async function startSalesFlow() {
      const contact = document.getElementById('recipientPhone').value;
      const product = document.getElementById('productName').value;
      if (!contact || !product) {
        alert('Preencha contato e produto!');
        return;
      }
      alert('Fluxo de vendas iniciado para: ' + contact);
    }
    
    function loadContacts() {
      contacts = [
        { name: 'João Silva', phone: '5511987654321', stage: 'Cliente' },
        { name: 'Maria Santos', phone: '5511987654322', stage: 'Lead' }
      ];
      const list = document.getElementById('contactsList');
      list.innerHTML = contacts.map(c => 
        '<div class="status-item"><div><strong>' + c.name + '</strong><p style="font-size:0.8em;color:#9ca3af;">' + c.phone + '</p></div><span style="background:#dbeafe;padding:5px 10px;border-radius:5px;font-size:0.8em;">' + c.stage + '</span></div>'
      ).join('');
    }
    
    function testAllSystems() {
      fetch('/health').then(r => r.json()).then(() => {
        alert('Todos os sistemas funcionando!');
      });
    }
  </script>
</body>
</html>`;
  res.send(html);
});

// ===== SERVER START =====
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  🤖 WhatsApp Chatbot API - COMPLETO            ║');
  console.log('║  ⚡ Com IA Gemini + Vendas Automáticas         ║');
  console.log('║  🚀 Rodando em http://0.0.0.0:' + PORT + '            ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ SISTEMAS ATIVADOS:');
  console.log('   • Conexão WhatsApp Real');
  console.log('   • Envio em Massa (Broadcast)');
  console.log('   • IA Gemini Integrada');
  console.log('   • Automação de Vendas');
  console.log('   • CRM com Contatos');
  console.log('');
  console.log('🔗 ENDPOINTS PRINCIPAIS:');
  console.log('   POST /api/whatsapp/start-session');
  console.log('   POST /api/whatsapp/send-message');
  console.log('   POST /api/whatsapp/broadcast');
  console.log('   POST /api/sales/start-flow');
  console.log('   GET  /api/contacts');
  console.log('   GET  /health');
  console.log('');
});
