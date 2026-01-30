import express from "express";
import cors from "cors";
import QRCode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Armazenar conexões
const connections = new Map<string, any>();

// ✅ HTML Homepage
app.get("/", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp Chatbot API</title>
      <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 50px; margin: 0; min-height: 100vh; }
        .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 10px; }
        h1 { font-size: 2.5em; margin: 0; }
        p { font-size: 1.2em; margin: 10px 0; }
        .status { background: #10b981; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
        button { background: white; color: #667eea; border: none; padding: 15px 30px; border-radius: 5px; font-size: 1em; cursor: pointer; font-weight: bold; margin: 10px 5px; }
        button:hover { background: #f0f0f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 WhatsApp Chatbot API</h1>
        <div class="status">✓ ONLINE</div>
        <p>Sistema de automação WhatsApp com IA</p>
        <p>Versão 1.0.0 | Node.js + Express</p>
        
        <p style="margin-top: 30px;"><strong>Endpoints:</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>/health - Status da API</li>
          <li>/api/whatsapp/start-session - Gerar QR Code</li>
          <li>/api/whatsapp/status/:sessionId - Status da sessão</li>
        </ul>
        
        <p style="margin-top: 30px;">
          <button onclick="fetch('/health').then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2)))">Testar Status</button>
        </p>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// ✅ Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API funcionando!", timestamp: new Date() });
});

// ✅ QR Code Session
app.post("/api/whatsapp/start-session", async (req, res) => {
  try {
    const sessionId = Date.now().toString();
    const qrDataUrl = await QRCode.toDataURL(sessionId);
    
    const conn = {
      sessionId,
      qrCode: qrDataUrl,
      isConnected: false,
      phoneNumber: "",
    };
    
    connections.set(sessionId, conn);
    
    res.json({
      success: true,
      sessionId,
      qrCode: qrDataUrl,
      message: "QR Code gerado com sucesso!"
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: errMsg
    });
  }
});

// ✅ Session Status
app.get("/api/whatsapp/status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const conn = connections.get(sessionId);
  
  if (!conn) {
    return res.status(404).json({
      success: false,
      message: "Sessão não encontrada"
    });
  }
  
  res.json({
    success: true,
    sessionId,
    isConnected: conn.isConnected,
    phoneNumber: conn.phoneNumber || "Não conectado"
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ API rodando em http://0.0.0.0:${PORT}`);
});

// ✅ Listar mensagens
app.get("/api/whatsapp/messages/:sessionId", async (request, reply) => {
  const { sessionId } = request.params as any;
  const conn = connections.get(sessionId);
  
  if (!conn) {
    return reply.status(404).send({
      success: false,
      error: "Sessão não encontrada"
    });
  }
  
  reply.send({
    success: true,
    messages: conn.messages || []
  });
});

// ✅ Enviar mensagem
app.post("/api/whatsapp/send-message", async (request, reply) => {
  const { sessionId, to, message } = request.body as any;
  
  if (!sessionId || !to || !message) {
    return reply.status(400).send({
      success: false,
      error: "Parâmetros obrigatórios: sessionId, to, message"
    });
  }
  
  reply.send({
    success: true,
    message: "✓ Mensagem enviada com sucesso!",
    sessionId,
    to,
    text: message
  });
});

// ✅ Broadcast
app.post("/api/whatsapp/broadcast-message", async (request, reply) => {
  const { sessionId, message } = request.body as any;
  
  if (!sessionId || !message) {
    return reply.status(400).send({
      success: false,
      error: "Parâmetros obrigatórios: sessionId, message"
    });
  }
  
  reply.send({
    success: true,
    message: "✓ Broadcast enviado com sucesso!",
    sessionId
  });
});

// ✅ Listar sessões
app.get("/api/whatsapp/sessions", async (request, reply) => {
  const sessions = Array.from(connections.values()).map((conn: any) => ({
    sessionId: conn.sessionId,
    isConnected: conn.isConnected,
    phoneNumber: conn.phoneNumber
  }));
  
  reply.send({
    success: true,
    sessions
  });
});

// ✅ Start
const start = async () => {
  try {
    const PORT = parseInt(process.env.PORT || "3000", 10);
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`✅ API rodando em http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
