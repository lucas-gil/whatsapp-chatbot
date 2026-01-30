import { PrismaClient, Conversation, Contact } from "@prisma/client";
import { logger } from "@/utils/logger";
import { whatsappService } from "./whatsapp.service";
import { aiService } from "./ai.service";

const prisma = new PrismaClient();

export type ConversationStep =
  | "welcome"
  | "device_selection"
  | "installation_instructions"
  | "awaiting_installation_proof"
  | "installation_confirmed"
  | "main_menu"
  | "contratar_menu"
  | "renovacao"
  | "suporte"
  | "finalizado";

interface StepContext {
  conversation: Conversation & { contact: Contact };
  userMessage: string;
  userChoice?: string;
}

export class FlowService {
  /**
   * Processar mensagem do usuário pelo state machine
   */
  async processMessage(phone: string, message: string): Promise<void> {
    try {
      // 1. Encontrar ou criar contato
      let contact = await prisma.contact.findUnique({
        where: { phone },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: { phone },
        });
        logger.info(`✨ Novo contato criado: ${phone}`);
      }

      // 2. Encontrar ou criar conversa
      let conversation = await prisma.conversation.findFirst({
        where: { contactId: contact.id },
        include: { contact: true },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            contactId: contact.id,
            step: "welcome",
          },
          include: { contact: true },
        });
      }

      // 3. Salvar mensagem recebida
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "user",
          type: "text",
          content: message,
        },
      });

      // 4. Processar comando global ou navegar estado
      if (this.isGlobalCommand(message)) {
        await this.handleGlobalCommand(conversation, message);
        return;
      }

      // 5. Navegar pelo estado da conversa
      await this.navigateStep(
        {
          conversation,
          userMessage: message,
        },
        conversation.step as ConversationStep
      );
    } catch (error) {
      logger.error(`❌ Erro ao processar mensagem de ${phone}:`, error);
      await whatsappService.sendText(phone, "Desculpe, tive um erro. Tentaremos novamente.");
    }
  }

  /**
   * Processar seleção de botão/lista
   */
  async processInteractiveReply(
    phone: string,
    buttonId: string,
    buttonTitle: string
  ): Promise<void> {
    try {
      const contact = await prisma.contact.findUnique({
        where: { phone },
      });

      if (!contact) {
        await whatsappService.sendText(phone, "Sua sessão expirou. Envie 'oi' para começar.");
        return;
      }

      let conversation = await prisma.conversation.findFirst({
        where: { contactId: contact.id },
        include: { contact: true },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { contactId: contact.id, step: "welcome" },
          include: { contact: true },
        });
      }

      // Salvar resposta
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "user",
          type: "interactive_button",
          content: buttonTitle,
          metadata: { button_id: buttonId },
        },
      });

      // Navegar baseado no button_id
      await this.navigateStep(
        {
          conversation,
          userMessage: buttonTitle,
          userChoice: buttonId,
        },
        conversation.step as ConversationStep
      );
    } catch (error) {
      logger.error(`❌ Erro ao processar botão de ${phone}:`, error);
    }
  }

  /**
   * Verificar se é comando global
   */
  private isGlobalCommand(message: string): boolean {
    const commands = ["menu", "suporte", "voltar", "cancelar", "humano", "ajuda"];
    return commands.some((cmd) => message.toLowerCase().includes(cmd));
  }

  /**
   * Lidar com comandos globais
   */
  private async handleGlobalCommand(
    conversation: Conversation & { contact: Contact },
    message: string
  ): Promise<void> {
    const msg = message.toLowerCase();

    if (msg.includes("menu")) {
      await this.stepMainMenu(conversation);
    } else if (msg.includes("suporte") || msg.includes("humano")) {
      await this.stepSupport(conversation);
    } else if (msg.includes("voltar")) {
      await this.stepMainMenu(conversation);
    } else if (msg.includes("cancelar")) {
      await whatsappService.sendText(
        conversation.contact.phone,
        "Até logo! 👋 Digite 'oi' a qualquer momento para voltar."
      );
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { step: "finalizado" },
      });
    }
  }

  /**
   * Navegar pelo state machine
   */
  private async navigateStep(
    context: StepContext,
    currentStep: ConversationStep
  ): Promise<void> {
    switch (currentStep) {
      case "welcome":
        await this.stepWelcome(context.conversation);
        break;

      case "device_selection":
        await this.stepDeviceSelection(
          context.conversation,
          context.userChoice || context.userMessage
        );
        break;

      case "installation_instructions":
        await this.stepInstallationCheck(context.conversation, context.userMessage);
        break;

      case "awaiting_installation_proof":
        await this.stepAwaitingProof(context.conversation, context.userMessage);
        break;

      case "main_menu":
        await this.stepMainMenu(context.conversation);
        break;

      case "contratar_menu":
        await this.stepContratarMenu(
          context.conversation,
          context.userChoice || context.userMessage
        );
        break;

      case "renovacao":
        await this.stepRenovacao(context.conversation, context.userMessage);
        break;

      case "suporte":
        await this.stepSupport(context.conversation);
        break;

      default:
        await this.stepMainMenu(context.conversation);
    }
  }

  /**
   * STEP 1: Bem-vindo
   */
  private async stepWelcome(conversation: Conversation & { contact: Contact }): Promise<void> {
    const phone = conversation.contact.phone;

    // Enviar vídeo demonstrativo
    const videoUrl = process.env.DEMO_VIDEO_URL || "https://...";
    if (videoUrl !== "https://...") {
      try {
        await whatsappService.sendVideo(
          phone,
          videoUrl,
          "🎬 Veja como funciona nossa plataforma"
        );
      } catch (error) {
        logger.warn("⚠️ Erro ao enviar vídeo:", error);
      }
    }

    // Oferecer seleção de dispositivo com botões
    const devices = [
      { id: "tv_smart", title: "📺 TV SMART" },
      { id: "smartphone", title: "📱 SMARTPHONE" },
      { id: "tv_box", title: "📦 TV BOX / FIRE STICK" },
      { id: "notebook", title: "💻 NOTEBOOK" },
      { id: "outros", title: "❓ OUTROS" },
    ];

    await whatsappService.sendListMessage(
      phone,
      '🎁 Você ganhou um teste grátis 7 dias! 🥳\n\nEm qual dispositivo você deseja usar?',
      devices
    );

    // Atualizar estado
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "device_selection" },
    });

    logger.info(`👋 Bem-vindo enviado para ${phone}`);
  }

  /**
   * STEP 2: Seleção de dispositivo
   */
  private async stepDeviceSelection(
    conversation: Conversation & { contact: Contact },
    deviceChoice: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    // Mapear choice para dispositivo
    const deviceMap: Record<string, string> = {
      tv_smart: "TV_SMART",
      smartphone: "SMARTPHONE",
      tv_box: "TV_BOX",
      notebook: "NOTEBOOK",
      outros: "OUTROS",
    };

    const device = deviceMap[deviceChoice] || "OUTROS";

    if (device === "OUTROS") {
      await whatsappService.sendText(
        phone,
        "🤔 Entendi! Vou conectar você com nosso suporte para ajudar na instalação."
      );
      await this.stepSupport(conversation);
      return;
    }

    // Salvar dispositivo do contato
    await prisma.contact.update({
      where: { id: conversation.contact.id },
      data: { device },
    });

    // Buscar recomendações do dispositivo
    const recommendation = await prisma.deviceRecommendation.findUnique({
      where: { device },
    });

    if (recommendation) {
      // Enviar imagens dos apps
      const images = (recommendation.images as string[]) || [];
      for (const imgUrl of images.slice(0, 3)) {
        try {
          await whatsappService.sendImage(phone, imgUrl);
        } catch (error) {
          logger.warn("⚠️ Erro ao enviar imagem:", error);
        }
      }

      // Enviar instruções
      const instructions = recommendation.instructions
        .replace(/^#+ /gm, "")
        .replace(/\n\n/g, "\n")
        .substring(0, 1000); // Limitar tamanho

      await whatsappService.sendText(
        phone,
        `📱 **Instruções para ${device}:**\n\n${instructions}\n\nDepois que instalar, envie uma foto/print da tela inicial para confirmarmos!`
      );
    }

    // Oferecer botões de ação
    await whatsappService.sendButtonMessage(
      phone,
      "Pronto! Já instalou o app?",
      [
        { id: "instalei", title: "✅ SIM, INSTALEI" },
        { id: "nao_consegui", title: "❌ NÃO CONSEGUI" },
        { id: "duvida", title: "❓ TENHO DÚVIDA" },
      ]
    );

    // Atualizar estado
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        step: "installation_instructions",
        stepData: { device },
      },
    });

    logger.info(`📱 Instruções enviadas para ${device}`);
  }

  /**
   * STEP 3: Verificar instalação
   */
  private async stepInstallationCheck(
    conversation: Conversation & { contact: Contact },
    userChoice: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    if (userChoice.includes("instalei") || userChoice.toLowerCase() === "sim") {
      // Pedir print
      await whatsappService.sendText(
        phone,
        "Ótimo! 🎉\n\nAgora envie uma foto/print da tela inicial do app para confirmarmos seu acesso."
      );

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { step: "awaiting_installation_proof" },
      });
    } else if (
      userChoice.includes("nao_consegui") ||
      userChoice.toLowerCase().includes("não")
    ) {
      // Pedir detalhe do erro
      await whatsappService.sendButtonMessage(
        phone,
        "Qual foi o problema?",
        [
          { id: "nao_achei", title: "🔍 Não achei na loja" },
          { id: "nao_abre", title: "❌ App não abre" },
          { id: "travando", title: "⚠️ Travando/lento" },
          { id: "outro_erro", title: "❓ Outro erro" },
        ]
      );

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { step: "suporte" },
      });
    } else if (userChoice.includes("duvida")) {
      // IA para responder dúvida
      const aiResponse = await aiService.generateResponse(userChoice, phone, {
        device: conversation.contact.device || undefined,
        stage: "installing",
      });

      await whatsappService.sendText(phone, aiResponse);
    }
  }

  /**
   * STEP 4: Aguardando comprovante de instalação
   */
  private async stepAwaitingProof(
    conversation: Conversation & { contact: Contact },
    message: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    // Em um cenário real, aqui trataria imagem
    // Simulando: assumimos que foi recebida uma imagem

    const supportChannel = process.env.TELEGRAM_CHAT_ID;
    logger.info(`📸 Comprovante recebido de ${phone}. Encaminhando para suporte...`);

    // Notificar suporte (via Telegram, email, etc)
    // TODO: implementar notificação

    await whatsappService.sendText(
      phone,
      "✅ Recebido!\n\nNosso suporte vai revisar e confirmar seu acesso em breve. Aguarde!"
    );

    // Atualizar contato como "aguardando suporte"
    await prisma.contact.update({
      where: { id: conversation.contact.id },
      data: { status: "lead" },
    });

    // Criar ticket para suporte
    await prisma.ticket.create({
      data: {
        contactId: conversation.contact.id,
        category: "instalacao",
        priority: "normal",
        subject: "Comprovante de instalação recebido",
        description: `Usuário enviou comprovante de instalação para ${conversation.contact.device}`,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "main_menu" },
    });
  }

  /**
   * STEP 5: Menu principal
   */
  private async stepMainMenu(
    conversation: Conversation & { contact: Contact }
  ): Promise<void> {
    const phone = conversation.contact.phone;

    await whatsappService.sendListMessage(
      phone,
      "🎬 Bem-vindo! O que você gostaria de fazer?",
      [
        { id: "contratar", title: "💎 CONTRATAR PLANO" },
        { id: "renovar", title: "♻️ RENOVAÇÃO" },
        { id: "suporte", title: "🛠️ SUPORTE TÉCNICO" },
        { id: "faq", title: "❓ DÚVIDAS" },
      ]
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "main_menu" },
    });
  }

  /**
   * STEP 6: Menu de contratação
   */
  private async stepContratarMenu(
    conversation: Conversation & { contact: Contact },
    choice: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    if (choice === "contratar") {
      // Buscar planos
      const plans = await prisma.plan.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      });

      const planOptions = plans.map((plan) => ({
        id: `plan_${plan.id}`,
        title: `${plan.name} - R$ ${(plan.price / 100).toFixed(2)}/mês`,
        description: plan.description.substring(0, 50),
      }));

      await whatsappService.sendListMessage(
        phone,
        "Escolha um plano:",
        planOptions
      );

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { step: "contratar_menu" },
      });
    }
  }

  /**
   * STEP 7: Renovação
   */
  private async stepRenovacao(
    conversation: Conversation & { contact: Contact },
    message: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    // Buscar assinatura ativa/expirada
    const subscription = await prisma.subscription.findFirst({
      where: { contactId: conversation.contact.id },
      include: { plan: true },
    });

    if (!subscription) {
      await whatsappService.sendText(
        phone,
        "Você não tem uma assinatura ativa. Deseja contratar um novo plano?"
      );
      await this.stepMainMenu(conversation);
      return;
    }

    if (subscription.status === "active") {
      await whatsappService.sendText(
        phone,
        `✅ Sua assinatura está ativa até ${subscription.expiresAt?.toLocaleDateString(
          "pt-BR"
        )}.`
      );
    } else if (subscription.status === "expired") {
      await whatsappService.sendText(
        phone,
        `Sua assinatura expirou em ${subscription.expiresAt?.toLocaleDateString(
          "pt-BR"
        )}.\n\nDeseja renovar?`
      );

      // Gerar link de pagamento
      // TODO: integrar Mercado Pago
    }
  }

  /**
   * STEP 8: Suporte
   */
  private async stepSupport(
    conversation: Conversation & { contact: Contact }
  ): Promise<void> {
    const phone = conversation.contact.phone;

    await whatsappService.sendButtonMessage(
      phone,
      "Como posso ajudar? Selecione a categoria:",
      [
        { id: "cat_instalacao", title: "📱 Instalação" },
        { id: "cat_erro", title: "❌ Erro técnico" },
        { id: "cat_pagamento", title: "💳 Pagamento" },
        { id: "cat_outro", title: "❓ Outro" },
      ]
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "suporte" },
    });
  }
}

export const flowService = new FlowService();
