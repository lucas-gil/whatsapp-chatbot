import { PrismaClient } from "@prisma/client";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();
const MP = require("mercadopago");

export class MercadoPagoService {
  private accessToken: string;
  private publicKey: string;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
    this.publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || "";

    if (!this.accessToken || !this.publicKey) {
      logger.warn("⚠️ Mercado Pago não configurado. Pagamentos desabilitados.");
      return;
    }

    MP.configure({
      access_token: this.accessToken,
    });

    logger.info("✅ Mercado Pago inicializado");
  }

  /**
   * Criar preferência de pagamento (gera link de checkout)
   */
  async createPreference(
    planId: string,
    planName: string,
    price: number, // em centavos
    contactPhone: string,
    contactName?: string
  ): Promise<{ checkoutUrl: string; preferenceId: string }> {
    try {
      const preference = {
        items: [
          {
            title: planName,
            unit_price: price / 100, // Converter para reais
            quantity: 1,
            currency_id: "BRL",
          },
        ],
        payer: {
          phone: { area_code: "55", number: contactPhone },
          ...(contactName && { name: contactName }),
        },
        back_urls: {
          success: `${process.env.API_URL}/payment/success`,
          failure: `${process.env.API_URL}/payment/failure`,
          pending: `${process.env.API_URL}/payment/pending`,
        },
        notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
        external_reference: `plan_${planId}`,
        binary_mode: true, // Só aceita pagamentos completos
      };

      const response = await MP.preference.create(preference);

      logger.info(
        `💳 Preferência de pagamento criada: ${response.body.id}`
      );

      return {
        preferenceId: response.body.id,
        checkoutUrl: response.body.init_point,
      };
    } catch (error) {
      logger.error("❌ Erro ao criar preferência MP:", error);
      throw error;
    }
  }

  /**
   * Verificar status de pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    statusDetail: string;
    amount: number;
  }> {
    try {
      const response = await MP.payment.findById(paymentId);

      return {
        status: response.body.status,
        statusDetail: response.body.status_detail,
        amount: response.body.transaction_amount,
      };
    } catch (error) {
      logger.error("❌ Erro ao verificar pagamento:", error);
      throw error;
    }
  }

  /**
   * Processar webhook de pagamento
   */
  async processWebhook(
    data: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { action, data: paymentData } = data;

      if (action !== "payment.created" && action !== "payment.updated") {
        return { success: true, message: "Ação ignorada" };
      }

      const paymentId = paymentData.id;
      const paymentStatus = await this.getPaymentStatus(paymentId);

      logger.info(`📊 Webhook MP recebido: ${paymentId} - ${paymentStatus.status}`);

      if (paymentStatus.status === "approved") {
        // Pagamento aprovado - atualizar assinatura
        const payment = await prisma.payment.upsert({
          where: { mercadopagoId: paymentId },
          create: {
            mercadopagoId: paymentId,
            amount: paymentStatus.amount,
            status: "approved",
            paymentMethod: "mercadopago",
          },
          update: {
            status: "approved",
          },
        });

        logger.info(`✅ Pagamento aprovado: ${paymentId}`);

        return {
          success: true,
          message: "Pagamento processado com sucesso",
        };
      } else if (paymentStatus.status === "rejected") {
        await prisma.payment.upsert({
          where: { mercadopagoId: paymentId },
          create: {
            mercadopagoId: paymentId,
            amount: paymentStatus.amount,
            status: "rejected",
            paymentMethod: "mercadopago",
          },
          update: {
            status: "rejected",
          },
        });

        logger.warn(`❌ Pagamento rejeitado: ${paymentId}`);
        return {
          success: true,
          message: "Pagamento rejeitado",
        };
      }

      return { success: true, message: "Status pendente" };
    } catch (error) {
      logger.error("❌ Erro ao processar webhook MP:", error);
      return { success: false, message: "Erro ao processar webhook" };
    }
  }

  /**
   * Gerar link de pagamento por QR Code (PIX)
   */
  async createPixPayment(
    planId: string,
    planName: string,
    price: number,
    contactPhone: string
  ): Promise<{ checkoutUrl: string; qrCode?: string }> {
    try {
      // Usar preferência normal (MP oferece PIX como opção)
      return await this.createPreference(planId, planName, price, contactPhone);
    } catch (error) {
      logger.error("❌ Erro ao criar pagamento PIX:", error);
      throw error;
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();
