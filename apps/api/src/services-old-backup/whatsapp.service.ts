import axios, { AxiosInstance } from "axios";
import { logger } from "@/utils/logger";

interface WhatsAppMessage {
  messaging_product: "whatsapp";
  to: string;
  type: string;
  text?: { body: string };
  image?: { link: string };
  video?: { link: string };
  interactive?: any;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string };
          video?: { id: string; mime_type: string };
          document?: { id: string; mime_type: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id?: string;
        }>;
      };
    }>;
  }>;
}

export class WhatsAppService {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private apiVersion = "v18.0";

  constructor() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      throw new Error(
        "WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID são obrigatórios"
      );
    }

    this.phoneNumberId = phoneId;
    this.client = axios.create({
      baseURL: `https://graph.instagram.com/${this.apiVersion}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Enviar mensagem de texto
   */
  async sendText(to: string, text: string): Promise<{ message_id: string }> {
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text },
      });

      logger.info(`📤 Mensagem de texto enviada para ${to}`);
      return {
        message_id: response.data.messages[0].id,
      };
    } catch (error) {
      logger.error(`❌ Erro ao enviar mensagem para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Enviar mensagem com botões
   */
  async sendButtonMessage(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<{ message_id: string }> {
    try {
      // WhatsApp API permite até 3 botões
      const buttonsLimited = buttons.slice(0, 3);

      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text },
          action: {
            buttons: buttonsLimited.map((btn) => ({
              type: "reply",
              reply: {
                id: btn.id,
                title: btn.title.substring(0, 20), // Limite de 20 chars
              },
            })),
          },
        },
      });

      logger.info(`📤 Mensagem com botões enviada para ${to}`);
      return {
        message_id: response.data.messages[0].id,
      };
    } catch (error) {
      logger.error(`❌ Erro ao enviar botões para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Enviar mensagem com lista
   */
  async sendListMessage(
    to: string,
    text: string,
    options: Array<{ id: string; title: string; description?: string }>
  ): Promise<{ message_id: string }> {
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text },
          action: {
            button: "Selecione",
            sections: [
              {
                title: "Opções",
                rows: options.map((opt) => ({
                  id: opt.id,
                  title: opt.title.substring(0, 24),
                  description: opt.description?.substring(0, 72),
                })),
              },
            ],
          },
        },
      });

      logger.info(`📤 Mensagem com lista enviada para ${to}`);
      return {
        message_id: response.data.messages[0].id,
      };
    } catch (error) {
      logger.error(`❌ Erro ao enviar lista para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Enviar imagem por URL
   */
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ message_id: string }> {
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image: {
          link: imageUrl,
          ...(caption && { caption }),
        },
      });

      logger.info(`📤 Imagem enviada para ${to}`);
      return {
        message_id: response.data.messages[0].id,
      };
    } catch (error) {
      logger.error(`❌ Erro ao enviar imagem para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Enviar vídeo por URL
   */
  async sendVideo(
    to: string,
    videoUrl: string,
    caption?: string
  ): Promise<{ message_id: string }> {
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "video",
        video: {
          link: videoUrl,
          ...(caption && { caption }),
        },
      });

      logger.info(`📤 Vídeo enviado para ${to}`);
      return {
        message_id: response.data.messages[0].id,
      };
    } catch (error) {
      logger.error(`❌ Erro ao enviar vídeo para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Download de mídia do WhatsApp
   */
  async downloadMedia(mediaId: string): Promise<{ url: string }> {
    try {
      const response = await this.client.get(`/${mediaId}`);
      return { url: response.data.url };
    } catch (error) {
      logger.error(`❌ Erro ao fazer download de mídia:`, error);
      throw error;
    }
  }

  /**
   * Validar webhook (verificação GET)
   */
  validateWebhook(
    token: string,
    challenge: string,
    verifyToken: string
  ): string | null {
    if (token !== verifyToken) {
      return null;
    }
    return challenge;
  }

  /**
   * Processar webhook POST (mensagens recebidas)
   */
  parseWebhookPayload(payload: any): Array<{
    from: string;
    type: string;
    text?: string;
    mediaId?: string;
    mediaType?: string;
    interactiveReply?: { id: string; title: string };
  }> {
    const messages: any[] = [];

    payload.entry?.forEach((entry: any) => {
      entry.changes?.forEach((change: any) => {
        change.value.messages?.forEach((msg: any) => {
          const parsed: any = {
            from: msg.from,
            type: msg.type,
            messageId: msg.id,
            timestamp: msg.timestamp,
          };

          if (msg.type === "text") {
            parsed.text = msg.text.body;
          } else if (msg.type === "image") {
            parsed.mediaId = msg.image.id;
            parsed.mediaType = "image";
          } else if (msg.type === "video") {
            parsed.mediaId = msg.video.id;
            parsed.mediaType = "video";
          } else if (msg.type === "interactive") {
            if (msg.interactive.type === "button_reply") {
              parsed.interactiveReply = {
                id: msg.interactive.button_reply.id,
                title: msg.interactive.button_reply.title,
              };
            } else if (msg.interactive.type === "list_reply") {
              parsed.interactiveReply = {
                id: msg.interactive.list_reply.id,
                title: msg.interactive.list_reply.title,
              };
            }
          }

          messages.push(parsed);
        });
      });
    });

    return messages;
  }
}

export const whatsappService = new WhatsAppService();
