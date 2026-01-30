import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
// import { iptvFlowService } from "@/services/iptv.flow.service";
import { logger } from "@/utils/logger";

export async function iptvRoutes(fastify: FastifyInstance) {
  /**
   * POST /webhook
   * Receber mensagens do WhatsApp e processar
   */
  fastify.post("/webhook", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = request.body as any;

      if (payload.object === "whatsapp_business_account") {
        for (const entry of payload.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value;

            if (value.messages) {
              for (const message of value.messages) {
                const phone = message.from;
                
                if (message.type === "text") {
                  const text = message.text?.body || "";
                  logger.info(`📩 Mensagem recebida de ${phone}: ${text}`);
                  // await iptvFlowService.processMessage(phone, text);
                } else if (message.type === "interactive") {
                  const interactive = message.interactive;
                  let buttonId = "";
                  let buttonTitle = "";

                  if (interactive.type === "button_reply") {
                    buttonId = interactive.button_reply?.id || "";
                    buttonTitle = interactive.button_reply?.title || "";
                  } else if (interactive.type === "list_reply") {
                    buttonId = interactive.list_reply?.id || "";
                    buttonTitle = interactive.list_reply?.title || "";
                  }

                  if (buttonId && buttonTitle) {
                    logger.info(`🔘 Clique recebido de ${phone}: ${buttonTitle}`);
                    // await iptvFlowService.processButtonClick(phone, buttonId, buttonTitle);
                  }
                }
              }
            }

            if (value.statuses) {
              for (const status of value.statuses) {
                logger.info(`📊 Status: ${status.status} para mensagem ${status.id}`);
              }
            }
          }
        }
      }

      return reply.send({ success: true });
    } catch (error) {
      logger.error("Erro ao processar webhook:", error);
      return reply.code(500).send({ success: false, error: "Erro ao processar webhook" });
    }
  });

  /**
   * POST /send-welcome
   * Enviar mensagem de boas-vindas manual
   */
  fastify.post("/send-welcome", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phone } = request.body as { phone: string };
      if (!phone) {
        return reply.code(400).send({ success: false, error: "Phone é obrigatório" });
      }

      logger.info(`👋 Enviando boas-vindas para ${phone}`);
      // await iptvFlowService.processMessage(phone, "oi");
      
      return reply.send({ success: true, message: "Boas-vindas enviadas" });
    } catch (error) {
      logger.error("Erro ao enviar boas-vindas:", error);
      return reply.code(500).send({ success: false, error: "Erro ao enviar mensagem" });
    }
  });

  /**
   * POST /send-custom
   * Enviar mensagem customizada
   */
  fastify.post("/send-custom", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phone, message } = request.body as { phone: string; message: string };
      if (!phone || !message) {
        return reply.code(400).send({ success: false, error: "Phone e message são obrigatórios" });
      }

      logger.info(`💬 Enviando mensagem customizada para ${phone}`);
      
      return reply.send({ success: true, message: "Mensagem enviada" });
    } catch (error) {
      logger.error("Erro ao enviar mensagem customizada:", error);
      return reply.code(500).send({ success: false, error: "Erro ao enviar mensagem" });
    }
  });

  /**
   * GET /status
   * Status do chatbot
   */
  fastify.get("/status", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send({
        status: "🟢 Online",
        timestamp: new Date().toISOString(),
        features: [
          "Boas-vindas automáticas",
          "Menu principal com opções",
          "Contratação de planos",
          "Renovação de assinatura",
          "Suporte técnico",
          "FAQ",
          "Pagamento com PIX/Cartão/Boleto",
        ],
      });
    } catch (error) {
      logger.error("Erro ao obter status:", error);
      return reply.code(500).send({ success: false, error: "Erro ao obter status" });
    }
  });

  logger.info("✅ Rotas IPTV registradas com sucesso");
}

