import crypto from "crypto";
import { logger } from "./logger";

/**
 * Validar assinatura do webhook do WhatsApp
 */
export function validateWhatsAppSignature(
  payload: string,
  signature: string
): boolean {
  const token = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!token) {
    logger.warn("⚠️ WHATSAPP_WEBHOOK_VERIFY_TOKEN não definido");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", token)
    .update(payload)
    .digest("hex");

  return `sha256=${hash}` === signature;
}

/**
 * Gerar link de pagamento Mercado Pago
 */
export async function generateMercadoPagoLink(
  planId: string,
  planName: string,
  price: number,
  email: string
): Promise<string> {
  // TODO: integrar SDK Mercado Pago
  // Placeholder
  return `https://mercadopago.com/pay?id=${planId}`;
}

/**
 * Notificar suporte via Telegram
 */
export async function notifySupportTelegram(
  message: string,
  metadata?: any
): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!chatId || !botToken) {
    logger.warn("⚠️ Telegram não configurado");
    return;
  }

  try {
    const text = `${message}\n\n${
      metadata ? JSON.stringify(metadata, null, 2) : ""
    }`;

    // TODO: implementar notificação Telegram
    logger.info(`📢 Mensagem de suporte preparada para Telegram`);
  } catch (error) {
    logger.error("❌ Erro ao notificar Telegram:", error);
  }
}

/**
 * Limpar número de telefone (deixar apenas dígitos)
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Formatar número para WhatsApp (com código país)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const clean = sanitizePhone(phone);

  // Se já tem 55 no início (Brasil)
  if (clean.startsWith("55")) {
    return clean;
  }

  // Se tem 11 ou 21 (DDD), adicionar 55
  if (clean.length === 11 || clean.length === 10) {
    return `55${clean}`;
  }

  // Assumir que é Brasil
  return `55${clean}`;
}
