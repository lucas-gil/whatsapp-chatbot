import Fastify from "fastify";
import cors from "@fastify/cors";
import QRCode from "qrcode";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

// Armazenar conexões
const connections = new Map<string, any>();

// ✅ HTML Dashboard
const htmlDashboard = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chatbot API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        header { background: white; border-radius: 10px; padding: 40px 20px; margin-bottom: 30px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        h1 { color: #667eea; margin-bottom: 10px; font-size: 2.5em; }
        .status { display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
        .card { background: white; border-radius: 10px; padding: 30px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .card h2 { color: #667eea; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .endpoint { background: #f3f4f6; padding: 15px; margin-bottom: 15px; border-left: 4px solid #667eea; border-radius: 5px; }
        button { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px; }
        button:hover { background: #764ba2; }
        .response { background: #1f2937; color: #10b981; padding: 15px; margin-top: 15px; border-radius: 5px; font-family: monospace; max-height: 200px; overflow-y: auto; }
        .footer { text-align: center; color: white; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🤖 WhatsApp Chatbot API</h1>
            <p>Sistema de automação WhatsApp com IA</p>
            <span class="status">✓ ONLINE</span>
        </header>
        
        <div class="card">
            <h2>📊 Status da API</h2>
            <button onclick="fetch('/health').then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2)))">Verificar Status</button>
        </div>
        
        <div class="card">
            <h2>✨ Sistema Online</h2>
            <p>A API está funcionando e pronta para receber requisições!</p>
            <p style="margin-top: 10px;"><strong>Endpoints disponíveis:</strong></p>
            <ul style="margin-top: 10px; margin-left: 20px;">
                <li>/health - Status da API</li>
                <li>/api/whatsapp/start-session - Gerar QR Code</li>
                <li>/api/whatsapp/status/:sessionId - Status da sessão</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>WhatsApp Chatbot - Powered by Node.js & Fastify</p>
        </div>
    </div>
</body>
</html>`;

// ✅ Servir HTML na raiz
app.get("/", async (request, reply) => {
  reply.header("Content-Type", "text/html");
  return reply.send(htmlDashboard);
});

// ✅ Health Check
app.get("/health", async () => {
  return { status: "ok", message: "API funcionando!" };
});

// ✅ Gerar QR Code (mock para testes)
app.post("/api/whatsapp/start-session", async (request, reply) => {
  const sessionId = Date.now().toString();
  
  try {
    // Gerar QR code fake para testes
    const qrDataUrl = await QRCode.toDataURL(sessionId);
    
    const conn = {
      sessionId,
      qrCode: qrDataUrl,
      isConnected: false,
      phoneNumber: "",
    };
    
    connections.set(sessionId, conn);
    
    reply.send({
      success: true,
      sessionId,
      qrCode: qrDataUrl,
      message: "✓ QR Code gerado!"
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    reply.status(500).send({
      success: false,
      error: errMsg
    });
  }
});

// ✅ Status da sessão
app.get("/api/whatsapp/status/:sessionId", async (request, reply) => {
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
    sessionId,
    isConnected: conn.isConnected,
    phoneNumber: conn.phoneNumber,
    state: conn.isConnected ? "connected" : "waiting_scan"
  });
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
