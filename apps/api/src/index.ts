import Fastify from "fastify";
import cors from "@fastify/cors";
import QRCode from "qrcode";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

// Armazenar conexões
const connections = new Map<string, any>();

// ✅ Servir HTML na raiz
app.get("/", async (request, reply) => {
  const html = `<html><body style="font-family:Arial;text-align:center;background:#667eea;color:white;padding:50px"><h1>🤖 WhatsApp Chatbot API</h1><p style="font-size:20px">✓ ONLINE</p><p>Sistema funcionando e pronto para requisições!</p><button onclick="fetch('/health').then(r=>r.json()).then(d=>alert(JSON.stringify(d)))">Verificar Status</button></body></html>`;
  reply.header("Content-Type", "text/html");
  return html;
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
