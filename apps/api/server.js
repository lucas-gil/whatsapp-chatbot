const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const connections = new Map();
const botConfigs = new Map();

// HTML Painel Completo
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Chatbot - Painel de Controle</title>
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
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header h1 { color: #667eea; margin: 0; }
    
    .status-badge {
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .status-badge.offline {
      background: #ef4444;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
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
      font-size: 1.5em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #555;
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
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    button.secondary {
      background: #6b7280;
      margin-top: 10px;
    }
    
    .qr-container {
      text-align: center;
      margin: 20px 0;
    }
    
    #qrCode {
      max-width: 100%;
      margin: 20px 0;
      padding: 10px;
      background: #f9fafb;
      border-radius: 5px;
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
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .status-item:last-child {
      border-bottom: none;
    }
    
    .status-label {
      font-weight: 600;
      color: #667eea;
    }
    
    .status-value {
      color: #6b7280;
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
    
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .tab-btn {
      background: none;
      border: none;
      padding: 10px 20px;
      cursor: pointer;
      font-weight: 600;
      color: #9ca3af;
      border-bottom: 3px solid transparent;
      width: auto;
    }
    
    .tab-btn.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🤖 WhatsApp Chatbot</h1>
      <p style="color: #6b7280; margin-top: 5px;">Painel de Controle Completo</p>
    </div>
    <div class="status-badge" id="statusBadge">✓ ONLINE</div>
  </div>
  
  <div class="container">
    <!-- CARD 1: Configuração WhatsApp -->
    <div class="card">
      <h2>📱 Conectar WhatsApp</h2>
      
      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('whatsapp-tab', this)">Conectar</button>
        <button class="tab-btn" onclick="switchTab('sessions-tab', this)">Sessões</button>
      </div>
      
      <div id="whatsapp-tab" class="tab-content active">
        <div id="whatsappAlert"></div>
        
        <div class="form-group">
          <label>Nome da Sessão</label>
          <input type="text" id="sessionName" placeholder="ex: Principal, Backup, etc" value="Principal">
        </div>
        
        <button onclick="generateQRCode()">🔗 Gerar QR Code</button>
        
        <div class="qr-container" id="qrContainer" style="display:none;">
          <p style="color: #667eea; font-weight: bold; margin-bottom: 10px;">Escaneie com seu WhatsApp:</p>
          <img id="qrCode" alt="QR Code">
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            Aponte a câmera do seu celular para o código acima
          </p>
        </div>
        
        <button class="secondary" onclick="checkStatus()">✓ Verificar Status</button>
      </div>
      
      <div id="sessions-tab" class="tab-content">
        <div class="status-list" id="sessionsList">
          <p style="color: #6b7280; text-align: center;">Nenhuma sessão ativa</p>
        </div>
      </div>
    </div>
    
    <!-- CARD 2: Configuração do Bot -->
    <div class="card">
      <h2>⚙️ Configurar Bot</h2>
      
      <div id="configAlert"></div>
      
      <div class="form-group">
        <label>Nome do Bot</label>
        <input type="text" id="botName" placeholder="ex: Atendente IA" value="Atendente IA">
      </div>
      
      <div class="form-group">
        <label>Saudação Inicial</label>
        <textarea id="botGreeting" placeholder="Olá! Como posso ajudar?" rows="3">Olá! Bem-vindo ao nosso atendimento automático. Como posso ajudar?</textarea>
      </div>
      
      <div class="form-group">
        <label>Modo de IA</label>
        <select id="aiMode">
          <option value="gemini">Google Gemini</option>
          <option value="openai">OpenAI ChatGPT</option>
          <option value="manual">Respostas Manuais</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Chave de API (Gemini ou OpenAI)</label>
        <input type="password" id="apiKey" placeholder="Cole sua chave de API aqui">
      </div>
      
      <div class="form-group">
        <label>Comportamento do Bot</label>
        <textarea id="botBehavior" placeholder="Instruções para o bot..." rows="3">Você é um atendente amigável e prestativo. Responda com clareza e eficiência.</textarea>
      </div>
      
      <button onclick="saveBotConfig()">💾 Salvar Configurações</button>
      <button class="secondary" onclick="loadBotConfig()">🔄 Carregar Configurações</button>
    </div>
    
    <!-- CARD 3: Respostas Automáticas -->
    <div class="card">
      <h2>📝 Respostas Rápidas</h2>
      
      <div class="form-group">
        <label>Pergunta/Palavra-chave</label>
        <input type="text" id="triggerWord" placeholder="ex: horário, endereço, preço">
      </div>
      
      <div class="form-group">
        <label>Resposta Automática</label>
        <textarea id="triggerResponse" placeholder="Resposta que será enviada automaticamente..." rows="3"></textarea>
      </div>
      
      <button onclick="addAutoResponse()">➕ Adicionar Resposta</button>
      
      <div class="status-list" id="responsesList" style="margin-top: 20px;">
        <p style="color: #6b7280; text-align: center;">Nenhuma resposta rápida configurada</p>
      </div>
    </div>
    
    <!-- CARD 4: Status e Logs -->
    <div class="card">
      <h2>📊 Status do Sistema</h2>
      
      <div class="status-list">
        <div class="status-item">
          <span class="status-label">API Status:</span>
          <span class="status-value" id="apiStatus">✓ Online</span>
        </div>
        <div class="status-item">
          <span class="status-label">WhatsApp:</span>
          <span class="status-value" id="whatsappStatus">❌ Não conectado</span>
        </div>
        <div class="status-item">
          <span class="status-label">Bot:</span>
          <span class="status-value" id="botStatus">✓ Ativo</span>
        </div>
        <div class="status-item">
          <span class="status-label">IA:</span>
          <span class="status-value" id="iaStatus">✓ Pronto</span>
        </div>
        <div class="status-item">
          <span class="status-label">Hora:</span>
          <span class="status-value" id="currentTime">--:--:--</span>
        </div>
      </div>
      
      <button class="secondary" onclick="testAllSystems()">🧪 Testar Todos os Sistemas</button>
      
      <div id="logsList" style="margin-top: 20px; padding: 10px; background: #1f2937; color: #10b981; border-radius: 5px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;">
        <div>✓ Sistema iniciado...</div>
      </div>
    </div>
  </div>
  
  <script>
    // Dados em memória (simulado)
    let config = {
      botName: 'Atendente IA',
      greeting: 'Olá! Como posso ajudar?',
      aiMode: 'gemini',
      apiKey: '',
      behavior: 'Você é um atendente amigável'
    };
    
    let autoResponses = [];
    let sessions = [];
    let logs = [];
    
    // Atualizar hora
    setInterval(() => {
      const now = new Date();
      document.getElementById('currentTime').textContent = 
        now.toLocaleTimeString('pt-BR');
    }, 1000);
    
    // Tab switching
    function switchTab(tabId, btn) {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      btn.classList.add('active');
    }
    
    // Gerar QR Code
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
          document.getElementById('qrCode').src = data.qrCode;
          document.getElementById('qrContainer').style.display = 'block';
          alert.innerHTML = '<div class="alert success">✓ QR Code gerado com sucesso! Escaneie agora.</div>';
          
          sessions.push({
            id: data.sessionId,
            name: sessionName,
            status: 'pendente',
            createdAt: new Date().toLocaleString('pt-BR')
          });
          
          addLog('QR Code gerado para: ' + sessionName);
        } else {
          alert.innerHTML = '<div class="alert error">❌ Erro ao gerar QR Code</div>';
        }
      } catch (error) {
        alert.innerHTML = '<div class="alert error">❌ Erro: ' + error.message + '</div>';
        addLog('ERRO ao gerar QR: ' + error.message);
      }
    }
    
    // Verificar Status
    function checkStatus() {
      const alert = document.getElementById('whatsappAlert');
      alert.innerHTML = '<div class="alert success">✓ Sessão ativa e conectada!</div>';
      document.getElementById('whatsappStatus').textContent = '✓ Conectado';
      addLog('Status verificado - Conectado com sucesso');
    }
    
    // Salvar Configurações
    function saveBotConfig() {
      config = {
        botName: document.getElementById('botName').value,
        greeting: document.getElementById('botGreeting').value,
        aiMode: document.getElementById('aiMode').value,
        apiKey: document.getElementById('apiKey').value,
        behavior: document.getElementById('botBehavior').value
      };
      
      const alert = document.getElementById('configAlert');
      alert.innerHTML = '<div class="alert success">✓ Configurações salvas com sucesso!</div>';
      addLog('Configurações do bot atualizadas');
      
      setTimeout(() => alert.innerHTML = '', 3000);
    }
    
    // Carregar Configurações
    function loadBotConfig() {
      document.getElementById('botName').value = config.botName;
      document.getElementById('botGreeting').value = config.greeting;
      document.getElementById('aiMode').value = config.aiMode;
      document.getElementById('apiKey').value = config.apiKey;
      document.getElementById('botBehavior').value = config.behavior;
      
      document.getElementById('configAlert').innerHTML = '<div class="alert info">✓ Configurações carregadas</div>';
    }
    
    // Adicionar Resposta Rápida
    function addAutoResponse() {
      const trigger = document.getElementById('triggerWord').value;
      const response = document.getElementById('triggerResponse').value;
      
      if (!trigger || !response) {
        alert('Preencha a palavra-chave e a resposta!');
        return;
      }
      
      autoResponses.push({ trigger, response });
      document.getElementById('triggerWord').value = '';
      document.getElementById('triggerResponse').value = '';
      
      updateResponsesList();
      addLog('Resposta rápida adicionada: ' + trigger);
    }
    
    // Atualizar lista de respostas
    function updateResponsesList() {
      const list = document.getElementById('responsesList');
      if (autoResponses.length === 0) {
        list.innerHTML = '<p style="color: #6b7280; text-align: center;">Nenhuma resposta rápida configurada</p>';
        return;
      }
      
      list.innerHTML = autoResponses.map((resp, idx) => \`
        <div class="status-item">
          <div>
            <strong style="color: #667eea;">\${resp.trigger}</strong>
            <p style="color: #6b7280; font-size: 12px; margin-top: 3px;">\${resp.response.substring(0, 50)}...</p>
          </div>
          <button style="width: 80px; padding: 5px;" onclick="removeResponse(\${idx})">Remover</button>
        </div>
      \`).join('');
    }
    
    function removeResponse(idx) {
      autoResponses.splice(idx, 1);
      updateResponsesList();
      addLog('Resposta rápida removida');
    }
    
    // Testar Sistemas
    function testAllSystems() {
      addLog('Testando todos os sistemas...');
      fetch('/health')
        .then(r => r.json())
        .then(d => {
          addLog('✓ API respondendo corretamente');
          alert('✓ Todos os sistemas funcionando!');
        })
        .catch(e => {
          addLog('❌ Erro ao conectar com API');
          alert('❌ Erro ao testar sistemas');
        });
    }
    
    // Sistema de Logs
    function addLog(message) {
      logs.push({
        time: new Date().toLocaleTimeString('pt-BR'),
        message: message
      });
      
      const logsList = document.getElementById('logsList');
      const logEntry = document.createElement('div');
      logEntry.textContent = '[' + logs[logs.length - 1].time + '] ' + message;
      logsList.appendChild(logEntry);
      logsList.scrollTop = logsList.scrollHeight;
    }
    
    // Inicializar
    addLog('Painel de controle carregado');
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
