import { PrismaClient, Conversation, Contact } from "@prisma/client";
import { logger } from "@/utils/logger";
import { whatsappService } from "./whatsapp.service";
import { aiService } from "./ai.service";
import IPTVMessageTemplates from "./iptv.templates";

const prisma = new PrismaClient();

export type IPTVConversationStep =
  | "welcome"
  | "main_menu"
  | "contratacao_menu"
  | "plano_selecionado"
  | "renovacao_verificacao"
  | "renovacao_pagamento"
  | "suporte_menu"
  | "suporte_detalhes"
  | "faq_menu"
  | "finalizado";

interface StepContext {
  conversation: Conversation & { contact: Contact };
  userMessage: string;
  userChoice?: string;
}

export class IPTVFlowService {
  /**
   * Processar mensagem do usuário para fluxo IPTV
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
        logger.info(`✨ Novo cliente IPTV: ${phone}`);
      }

      // 2. Encontrar ou criar conversa
      let conversation = await prisma.conversation.findFirst({
        where: { contactId: contact.id },
        include: { contact: true },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { contactId: contact.id, step: "welcome" },
          include: { contact: true },
        });

        // Iniciar fluxo de boas-vindas
        await this.navigateStep(
          { conversation, userMessage: message },
          "welcome"
        );
        return;
      }

      // 3. Salvar mensagem do usuário
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "user",
          type: "text",
          content: message,
        },
      });

      // 4. Processar comando global
      if (this.isGlobalCommand(message)) {
        await this.handleGlobalCommand(conversation, message);
        return;
      }

      // 5. Navegar pelo step atual
      await this.navigateStep(
        { conversation, userMessage: message },
        conversation.step as IPTVConversationStep
      );
    } catch (error) {
      logger.error(`❌ Erro ao processar mensagem de ${phone}:`, error);
      await whatsappService.sendText(
        phone,
        "❌ Desculpa, ocorreu um erro. Tente novamente em alguns instantes."
      );
    }
  }

  /**
   * Processar clique em botão
   */
  async processButtonClick(phone: string, buttonId: string, buttonTitle: string): Promise<void> {
    try {
      let contact = await prisma.contact.findUnique({
        where: { phone },
      });

      if (!contact) {
        await whatsappService.sendText(phone, "Sua sessão expirou. Digite 'oi' para começar.");
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

      // Processar cliques de FAQ especificamente
      if (buttonId.startsWith("faq_")) {
        await this.handleFAQClick(conversation, buttonId);
        return;
      }

      // Processar cliques de suporte
      if (buttonId.startsWith("problema_")) {
        await this.handleSupportResultClick(conversation, buttonId);
        return;
      }

      // Processar cliques de pagamento
      if (buttonId.includes("payment")) {
        await this.handlePaymentClick(conversation, buttonId);
        return;
      }

      // Navegar baseado no button_id
      await this.navigateStep(
        {
          conversation,
          userMessage: buttonTitle,
          userChoice: buttonId,
        },
        conversation.step as IPTVConversationStep
      );
    } catch (error) {
      logger.error(`❌ Erro ao processar botão de ${phone}:`, error);
    }
  }

  /**
   * Processar clique em resposta de FAQ
   */
  private async handleFAQClick(
    conversation: Conversation & { contact: Contact },
    faqId: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    const faqAnswer = IPTVMessageTemplates.getFAQAnswer(faqId.replace("faq_", ""));
    await whatsappService.sendText(phone, faqAnswer);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Oferecer mais opções
    await whatsappService.sendButtonMessage(
      phone,
      "Ficou com mais dúvida? 🤔",
      [
        { id: "faq_mais", title: "📚 Mais perguntas" },
        { id: "suporte", title: "🛠️ Chamar suporte" },
        { id: "voltar_menu", title: "🏠 Menu principal" },
      ]
    );
  }

  /**
   * Processar resultado do suporte (problema resolvido ou não)
   */
  private async handleSupportResultClick(
    conversation: Conversation & { contact: Contact },
    resultId: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    if (resultId === "problema_resolvido") {
      await whatsappService.sendText(
        phone,
        `✅ Que legal! Fico feliz que resolvemos! 🎉

Se tiver mais dúvidas, é só me chamar!

Um grande abraço! 💙`
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.stepMainMenu(conversation);
    } else {
      // Problema ainda persiste
      await whatsappService.sendText(
        phone,
        `Entendi! 😟 Vou chamar nosso time especializado pra te ajudar!

Um momentinho... 📞`
      );

      // Criar ticket com prioridade alta
      const ticket = await prisma.ticket.create({
        data: {
          contactId: conversation.contact.id,
          category: "erro_tecnico",
          priority: "high",
          status: "open",
          subject: "Problema técnico persistente",
          description: `Usuário relata que o problema não foi resolvido com as soluções automáticas.`,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const ticketMessage = IPTVMessageTemplates.getSupportTicketCreated(ticket.id);
      await whatsappService.sendText(phone, ticketMessage);

      await this.stepMainMenu(conversation);
    }
  }

  /**
   * Processar clique em opção de pagamento
   */
  private async handlePaymentClick(
    conversation: Conversation & { contact: Contact },
    paymentId: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    const methodMap: Record<string, string> = {
      pix_payment: "pix",
      credito_payment: "credito",
      boleto_payment: "boleto",
    };

    const paymentMethod = methodMap[paymentId] || "pix";

    // Simular geração de pagamento (em produção, integrar com Mercado Pago)
    const paymentReference = this.generatePaymentReference(paymentMethod);

    const paymentInstruction = IPTVMessageTemplates.getPaymentInstruction(
      paymentMethod,
      paymentReference
    );

    await whatsappService.sendText(phone, paymentInstruction);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Confirmação de pagamento
    await whatsappService.sendButtonMessage(
      phone,
      "Já pagou? 💳",
      [
        { id: "pagamento_confirmado", title: "✅ Sim, paguei!" },
        { id: "mudar_pagamento", title: "🔄 Trocar método" },
      ]
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        step: "renovacao_pagamento",
        stepData: { paymentMethod, paymentReference },
      },
    });
  }

  /**
   * Gerar referência de pagamento simulada
   */
  private generatePaymentReference(method: string): string {
    const timestamp = Date.now();
    if (method === "pix") {
      return `00020126360014br.gov.bcb.brcode0136123e4567-e12b-12d1-a456-426614174000520400005303986540510.005802BR5913FULANO DE TAL6009SAO PAULO62410503***63041D3F`;
    } else if (method === "boleto") {
      return `12345.67890 12345.678901 12345.678901 1 12345678901234`;
    } else {
      return `https://payment.gateway.com/pay/${timestamp}`;
    }
  }

  /**
   * Verificar se é comando global
   */
  private isGlobalCommand(message: string): boolean {
    const commands = ["menu", "suporte", "voltar", "cancelar", "ajuda", "home"];
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

    if (msg.includes("menu") || msg.includes("home")) {
      await this.stepMainMenu(conversation);
    } else if (msg.includes("suporte") || msg.includes("ajuda")) {
      await this.stepSuporteMenu(conversation);
    } else if (msg.includes("voltar")) {
      await this.stepMainMenu(conversation);
    } else if (msg.includes("cancelar")) {
      await whatsappService.sendText(
        conversation.contact.phone,
        "Operação cancelada. 👋 Digite 'menu' para voltar ao menu principal."
      );
    }
  }

  /**
   * Navegar pelo state machine
   */
  private async navigateStep(
    context: StepContext,
    currentStep: IPTVConversationStep
  ): Promise<void> {
    switch (currentStep) {
      case "welcome":
        await this.stepWelcome(context.conversation);
        break;

      case "main_menu":
        await this.stepMainMenu(context.conversation);
        break;

      case "contratacao_menu":
        await this.stepContratacaoMenu(
          context.conversation,
          context.userChoice || context.userMessage
        );
        break;

      case "plano_selecionado":
        await this.stepPlanoSelecionado(
          context.conversation,
          context.userChoice || context.userMessage
        );
        break;

      case "renovacao_verificacao":
        await this.stepRenovacaoVerificacao(context.conversation);
        break;

      case "renovacao_pagamento":
        await this.stepRenovacaoPagamento(
          context.conversation,
          context.userChoice || context.userMessage
        );
        break;

      case "suporte_menu":
        await this.stepSuporteMenu(context.conversation);
        break;

      case "suporte_detalhes":
        await this.stepSuporteDetalhes(
          context.conversation,
          context.userChoice || context.userMessage
        );
        break;

      case "faq_menu":
        await this.stepFAQMenu(context.conversation);
        break;

      default:
        await this.stepMainMenu(context.conversation);
    }
  }

  /**
   * STEP 1: Bem-vindo ao chatbot IPTV
   */
  private async stepWelcome(conversation: Conversation & { contact: Contact }): Promise<void> {
    const phone = conversation.contact.phone;

    // Mensagem de boas-vindas natural
    const welcomeMessage = IPTVMessageTemplates.getWelcomeMessage();
    await whatsappService.sendText(phone, welcomeMessage);

    // Oferecer menu principal após 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.stepMainMenu(conversation);

    logger.info(`👋 Boas-vindas enviadas para ${phone}`);
  }

  /**
   * STEP 2: Menu principal
   */
  private async stepMainMenu(
    conversation: Conversation & { contact: Contact }
  ): Promise<void> {
    const phone = conversation.contact.phone;

    const mainMenuMessage = IPTVMessageTemplates.getMainMenuMessage();

    await whatsappService.sendListMessage(
      phone,
      mainMenuMessage,
      [
        { id: "contratar", title: "💎 Contratar um plano" },
        { id: "renovar", title: "♻️ Renovar minha assinatura" },
        { id: "suporte", title: "🛠️ Suporte técnico" },
        { id: "faq", title: "❓ Dúvidas frequentes" },
      ]
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "main_menu" },
    });
  }

  /**
   * STEP 3: Menu de contratação
   */
  private async stepContratacaoMenu(
    conversation: Conversation & { contact: Contact },
    choice: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    if (choice !== "contratar") {
      await this.stepMainMenu(conversation);
      return;
    }

    // Mensagem de apresentação
    const introMessage = IPTVMessageTemplates.getPlansIntroMessage();
    await whatsappService.sendText(phone, introMessage);

    // Buscar planos
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

    if (plans.length === 0) {
      await whatsappService.sendText(
        phone,
        "Desculpa, nenhum plano disponível no momento. Tente novamente mais tarde! 😢"
      );
      await this.stepMainMenu(conversation);
      return;
    }

    // Aguardar um pouco antes de mostrar planos
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Criar opções de planos
    const planOptions = plans.map((plan) => ({
      id: `plan_${plan.id}`,
      title: `${plan.name} - R$ ${(plan.price / 100).toFixed(2)}/mês`,
      description: plan.description?.substring(0, 50) || "Plano completo",
    }));

    await whatsappService.sendListMessage(
      phone,
      "Escolhe aí o plano que combina com você:",
      planOptions
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "contratacao_menu" },
    });

    logger.info(`📋 Planos apresentados para ${phone}`);
  }

  /**
   * STEP 4: Plano selecionado - Confirmação e checkout
   */
  private async stepPlanoSelecionado(
    conversation: Conversation & { contact: Contact },
    choice: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    // Extrair ID do plano
    const planId = choice.replace("plan_", "");

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      await whatsappService.sendText(phone, "Opa! Plano não encontrado. Tenta de novo? 😅");
      await this.stepContratacaoMenu(conversation, "contratar");
      return;
    }

    // Mostrar detalhes do plano
    const features = (plan.features as string[]) || ["Acesso completo"];
    const planDetailsMessage = IPTVMessageTemplates.getPlanDetailsMessage(
      plan.name,
      (plan.price / 100).toFixed(2),
      features
    );
    await whatsappService.sendText(phone, planDetailsMessage);

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Confirmação
    const confirmationMessage = IPTVMessageTemplates.getConfirmationMessage(
      plan.name,
      (plan.price / 100).toFixed(2)
    );

    await whatsappService.sendButtonMessage(phone, confirmationMessage, [
      { id: `confirm_plan_${planId}`, title: "✅ Confirmar" },
      { id: "voltar_planos", title: "🔙 Voltar" },
    ]);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        step: "plano_selecionado",
        stepData: { selectedPlanId: planId, planPrice: plan.price },
      },
    });

    logger.info(`💎 Plano ${plan.name} selecionado por ${phone}`);
  }

  /**
   * STEP 5: Renovação - Verificar assinatura
   */
  private async stepRenovacaoVerificacao(
    conversation: Conversation & { contact: Contact }
  ): Promise<void> {
    const phone = conversation.contact.phone;

    // Buscar assinatura
    const subscription = await prisma.subscription.findFirst({
      where: { contactId: conversation.contact.id },
      include: { plan: true },
    });

    if (!subscription) {
      await whatsappService.sendText(
        phone,
        "ℹ️ Você ainda não possui uma assinatura ativa.\n\nDeseja contratar um novo plano?"
      );

      await whatsappService.sendButtonMessage(phone, "Escolha:", [
        { id: "contratar", title: "💎 CONTRATAR PLANO" },
        { id: "voltar_menu", title: "🔙 VOLTAR" },
      ]);

      await this.stepMainMenu(conversation);
      return;
    }

    if (subscription.status === "active") {
      const expiryDate = subscription.expiresAt?.toLocaleDateString("pt-BR") || "data desconhecida";

      await whatsappService.sendText(
        phone,
        `✅ Sua assinatura está *ATIVA*!\n\nPlano: ${subscription.plan.name}\nVencimento: ${expiryDate}\n\nDeseja renovar agora?`
      );

      await whatsappService.sendButtonMessage(phone, "", [
        { id: "confirmar_renovacao", title: "♻️ RENOVAR AGORA" },
        { id: "voltar_menu", title: "🔙 VOLTAR" },
      ]);
    } else if (subscription.status === "expired") {
      const expiredDate = subscription.expiresAt?.toLocaleDateString("pt-BR") || "data desconhecida";

      await whatsappService.sendText(
        phone,
        `⏰ Sua assinatura *EXPIROU* em ${expiredDate}.\n\nRenove agora para não perder acesso!`
      );

      await whatsappService.sendButtonMessage(phone, "", [
        { id: "confirmar_renovacao", title: "♻️ RENOVAR AGORA" },
        { id: "voltar_menu", title: "🔙 VOLTAR" },
      ]);
    } else {
      await whatsappService.sendText(
        phone,
        "ℹ️ Sua assinatura foi cancelada.\n\nDeseja contratar um novo plano?"
      );
      await this.stepContratacaoMenu(conversation, "contratar");
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        step: "renovacao_verificacao",
        stepData: { subscriptionId: subscription.id },
      },
    });
  }

  /**
   * STEP 6: Renovação - Pagamento
   */
  private async stepRenovacaoPagamento(
    conversation: Conversation & { contact: Contact },
    choice: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    if (choice !== "confirmar_renovacao") {
      await this.stepMainMenu(conversation);
      return;
    }

    // Aguardar processamento
    await whatsappService.sendText(phone, IPTVMessageTemplates.getWaitingMessage());
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Buscar dados da assinatura
    const subscription = await prisma.subscription.findFirst({
      where: { contactId: conversation.contact.id },
      include: { plan: true },
    });

    if (!subscription) {
      await whatsappService.sendText(phone, "❌ Assinatura não encontrada.");
      await this.stepMainMenu(conversation);
      return;
    }

    // Mostrar opções de pagamento
    const paymentMessage = IPTVMessageTemplates.getPaymentOptionsMessage();
    await whatsappService.sendListMessage(phone, paymentMessage, [
      { id: "pix_payment", title: "🏦 PIX - Pague na hora!" },
      { id: "credito_payment", title: "💳 Cartão de Crédito" },
      { id: "boleto_payment", title: "📄 Boleto" },
    ]);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        step: "renovacao_pagamento",
        stepData: { subscriptionId: subscription.id },
      },
    });

    logger.info(`💳 Iniciando renovação para ${phone}`);
  }

  /**
   * STEP 7: Suporte - Menu de categorias
   */
  private async stepSuporteMenu(
    conversation: Conversation & { contact: Contact }
  ): Promise<void> {
    const phone = conversation.contact.phone;

    const supportMessage = IPTVMessageTemplates.getSupportMenu();

    await whatsappService.sendListMessage(phone, supportMessage, [
      { id: "suporte_erro", title: "❌ Não conecta ao app" },
      { id: "suporte_lentidao", title: "⚠️ Está travando/lento" },
      { id: "suporte_login", title: "❓ Não consigo fazer login" },
      { id: "suporte_outros", title: "🔌 Outro problema técnico" },
    ]);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "suporte_menu" },
    });
  }

  /**
   * STEP 8: Suporte - Detalhe do problema
   */
  private async stepSuporteDetalhes(
    conversation: Conversation & { contact: Contact },
    choice: string
  ): Promise<void> {
    const phone = conversation.contact.phone;

    // Mapear categoria para ticket
    const categoryMap: Record<string, string> = {
      suporte_erro: "erro_tecnico",
      suporte_lentidao: "erro_tecnico",
      suporte_login: "erro_tecnico",
      suporte_outros: "outro",
      suporte_duvida_tecnica: "outro",
    };

    const category = categoryMap[choice] || "outro";

    // Dar uma solução rápida baseada no problema
    const supportResponse = IPTVMessageTemplates.getSupportResponse(
      choice.replace("suporte_", "")
    );
    await whatsappService.sendText(phone, supportResponse);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Perguntar se resolveu
    await whatsappService.sendButtonMessage(
      phone,
      "O problema foi resolvido? 😊",
      [
        { id: "problema_resolvido", title: "✅ Sim, resolveu!" },
        { id: "problema_persiste", title: "❌ Não, ainda tem problema" },
      ]
    );

    // Criar ticket de suporte
    await prisma.ticket.create({
      data: {
        contactId: conversation.contact.id,
        category: category as any,
        priority: "normal",
        status: "open",
        subject: `Suporte: ${choice}`,
        description: `Usuário reportou um problema via WhatsApp`,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "suporte_detalhes" },
    });

    logger.info(`🎫 Ticket de suporte criado para ${phone}`);
  }

  /**
   * STEP 9: FAQ - Perguntas frequentes
   */
  private async stepFAQMenu(
    conversation: Conversation & { contact: Contact }
  ): Promise<void> {
    const phone = conversation.contact.phone;

    const faqMessage = IPTVMessageTemplates.getFAQMenu();

    await whatsappService.sendListMessage(phone, faqMessage, [
      { id: "faq_dispositivos", title: "📱 Quais aparelhos funcionam?" },
      { id: "faq_qual_melhor", title: "💎 Qual plano escolher?" },
      { id: "faq_compartilhar", title: "👥 Posso compartilhar minha senha?" },
      { id: "faq_telas", title: "📺 Quantas telas simultâneas?" },
    ]);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: "faq_menu" },
    });
  }
}

export const iptvFlowService = new IPTVFlowService();
