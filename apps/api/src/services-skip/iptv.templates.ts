/**
 * Serviço de Templates de Mensagens IPTV
 * Respostas naturais e amigáveis, como um atendente de verdade
 */

export class IPTVMessageTemplates {
  /**
   * BOAS-VINDAS
   */
  static getWelcomeMessage(): string {
    return `Olá! 👋 Bem-vindo ao nosso IPTV Streaming!

Sou a Yasmin, sua assistente digital. 😊

Estou aqui para ajudar você a:
✅ Conhecer nossos planos
✅ Contratar seu acesso
✅ Resolver qualquer dúvida

Como posso te ajudar hoje?`;
  }

  /**
   * MENU PRINCIPAL
   */
  static getMainMenuMessage(): string {
    return `Perfeito! 🎬 Aqui estão as principais opções:

1️⃣ *Contratar um plano* - Conheça nossas ofertas
2️⃣ *Renovar minha assinatura* - Já é cliente?
3️⃣ *Suporte técnico* - Com problema?
4️⃣ *Dúvidas* - Dúvidas sobre IPTV?

Qual você escolhe?`;
  }

  /**
   * APRESENTAÇÃO DE PLANOS
   */
  static getPlansIntroMessage(): string {
    return `Ótimo! 🎁 Vamos lá!

Temos planos para todos os gostos e bolsos. 

Qual tipo de acesso você prefere?`;
  }

  static getPlanDetailsMessage(planName: string, price: string, features: string[]): string {
    const featuresList = features.map((f) => `✅ ${f}`).join("\n");

    return `📺 *${planName}*

💰 R$ ${price}/mês

Inclui:
${featuresList}

Quer contratar? É só me avisar! 😊`;
  }

  static getConfirmationMessage(planName: string, price: string): string {
    return `Perfeito! 🎉 Você selecionou:

*${planName}*
💵 R$ ${price}/mês

É isso mesmo? Vamos finalizar? 👇`;
  }

  /**
   * PAGAMENTO
   */
  static getPaymentOptionsMessage(): string {
    return `Ótimo! 💳 Agora é só escolher como pagar:

🏦 *PIX* - Pague na hora! (5 min de acesso)
💳 *Cartão de Crédito* - Rápido e seguro
📄 *Boleto* - Vence em 3 dias

Qual você prefere?`;
  }

  static getPaymentInstruction(method: string, reference: string): string {
    const instructions = {
      pix: `🏦 *INSTRUÇÕES PIX*

Copie a chave ou escaneie o QR code abaixo:

${reference}

Após pagar, seu acesso será ativado em até 5 minutos! ⏱️

Se não ativar, me avisa que a gente resolve! 💪`,

      credito: `💳 *CARTÃO DE CRÉDITO*

Vou te enviar um link seguro para você preencher os dados.

Seu acesso será ativado na hora! ⚡

${reference}`,

      boleto: `📄 *BOLETO*

Seu boleto foi gerado! 

Você tem 3 dias para pagar.

${reference}

Após o pagamento, seu acesso será ativado em até 24 horas.`,
    };

    return instructions[method as keyof typeof instructions] || "Erro ao processar pagamento";
  }

  /**
   * RENOVAÇÃO
   */
  static getRenovationCheckMessage(planName: string, daysLeft: number): string {
    if (daysLeft > 3) {
      return `✅ Sua assinatura está funcionando perfeitamente!

Plano: *${planName}*
Vence em: ${daysLeft} dias

Deseja renovar agora com desconto especial? 🎁`;
    } else {
      return `⚠️ Ó! Sua assinatura vence em ${daysLeft} dias!

Plano: *${planName}*

Renove agora e não perca nenhum episódio! 📺`;
    }
  }

  static getExpiredSubscriptionMessage(planName: string): string {
    return `😢 Sua assinatura expirou!

Plano: ${planName}

Que tal renovar? Temos umas promoções legais! 

✨ Renove agora e ganhe 7 dias grátis! 🎁`;
  }

  /**
   * SUPORTE TÉCNICO
   */
  static getSupportMenu(): string {
    return `Sem problema! 🛠️ Vamos resolver isso rápido.

Qual é a sua dúvida?

❌ *Não conecta ao app*
⚠️ *Está travando/lento*
❓ *Não consigo fazer login*
🔌 *Outro problema técnico*

Me conta aí! 👂`;
  }

  static getSupportResponse(category: string): string {
    const responses = {
      conexao: `Deixa comigo! 🔧

Aqui estão os passos para resolver:

1️⃣ Saia da sua conta
2️⃣ Feche o app completamente
3️⃣ Abra novamente e faça login
4️⃣ Deixa carregar uns 30 segundos

Se o problema persistir, me avisa que vou conectar você com nosso especialista técnico! 👨‍💼`,

      travamento: `Que chato! 😟

Algumas coisas que podem resolver:

🔄 Atualize o app na loja
📱 Reinicie seu celular/aparelho
🗑️ Limpe o cache do app
📡 Verifique sua internet (mínimo 5Mbps)

Melhorou? Conta pra mim! 😊`,

      login: `Sem problema! 🔑

Esqueceu a senha? Não se preocupa:

1️⃣ Clique em "Esqueci minha senha"
2️⃣ Confirme seu email
3️⃣ Crie uma nova senha

Ainda com dúvida? Posso chamar o time técnico! 💪`,

      outro: `Vou ajudar, sim! 💯

Me descreve melhor qual é o problema que você tá tendo? Quanto mais detalhes, melhor! 👍`,
    };

    return responses[category as keyof typeof responses] || responses.outro;
  }

  static getSupportTicketCreated(ticketId: string): string {
    return `✅ Seu chamado foi registrado com sucesso!

🆔 *Número do chamado:* #${ticketId}

Nossa equipe técnica vai entrar em contato em até 2 horas! 

Enquanto isso, estou por aqui se precisar de mais algo! 😊`;
  }

  /**
   * FAQ - PERGUNTAS FREQUENTES
   */
  static getFAQMenu(): string {
    return `Ótimo! 📚 Aqui estão as dúvidas mais comuns:

📱 *Quais aparelhos funcionam?*
💎 *Qual plano escolher?*
👥 *Posso compartilhar minha senha?*
📺 *Quantas telas simultâneas?*
🌍 *Funciona no exterior?*
📥 *Como cancelar?*

Qual dessas te interessa?`;
  }

  static getFAQAnswer(question: string): string {
    const answers = {
      dispositivos: `📱 *APARELHOS COMPATÍVEIS*

Funciona em praticamente tudo! 📺

✅ Smart TV (Samsung, LG, TCL, etc)
✅ Fire Stick / Roku
✅ Android / iPhone
✅ Notebook / Computador
✅ TV Box / Chromecast

A qualidade varia conforme o aparelho, mas em todos você vai ter uma ótima experiência!

Qual você usa? 👀`,

      plano: `💎 *COMO ESCOLHER O MELHOR PLANO*

Depende do que você quer assistir:

🎬 *Básico* (R$ 9,90)
- Filmes e séries
- 1 tela simultânea

📺 *Padrão* (R$ 19,90)
- Tudo do básico + canais ao vivo
- 2 telas simultâneas

⭐ *Premium* (R$ 29,90)
- Tudo! Filmes, séries, canais, esportes
- 4 telas simultâneas + 4K

Qual se encaixa melhor com você? 🤔`,

      compartilhar: `👥 *COMPARTILHAMENTO DE CONTA*

Sim, você pode compartilhar!

✅ Até 4 telas simultâneas (depende do plano)
✅ Pode ser família ou amigos
⚠️ Cada plano tem seu limite

*Dica:* Só tome cuidado pra não dividir com muita gente, tá? 😉

Ficou claro? Algo mais? ✨`,

      telas: `📺 *QUANTAS TELAS POSSO USAR?*

Depende do plano que você escolher:

🎬 *Básico* → 1 tela
📺 *Padrão* → 2 telas
⭐ *Premium* → 4 telas

Pode assistir filmes em um lugar e séries em outro!

Perfeito pra casa cheia! 🏠`,

      exterior: `🌍 *FUNCIONA NO EXTERIOR?*

Boa pergunta! 🤔

✅ *Sim!* Funciona em qualquer lugar do mundo
📡 Desde que você tenha internet
🔒 Sua conta fica segura

Viajando pra fora? Aproveita pra maratonar! 🌴`,

      cancelamento: `🚫 *COMO CANCELAR*

Sem problema, é moleza!

1️⃣ Me avisa aqui no chat
2️⃣ Você continua com acesso até a data de vencimento
3️⃣ Após vencer, sua conta é desativada

Sem cobrança surpresa! ✅

Mas antes, me diz: por qual motivo? Talvez a gente resolva! 😟`,
    };

    return answers[question as keyof typeof answers] || "Dúvida não encontrada. Me descreve melhor! 👂";
  }

  /**
   * MENSAGENS GERAIS
   */
  static getErrorMessage(): string {
    return `Opa! 🤔 Ocorreu um erro aí.

Tenta novamente ou me chama um colega! 

Um minutinho... 👨‍💼`;
  }

  static getWaitingMessage(): string {
    return `Deixa eu processar aqui um segundinho... ⏳

Um momentinho! 😊`;
  }

  static getSuccessMessage(): string {
    return `Perfeito! ✅ Tudo certo por aqui!

Qualquer dúvida é só chamar! 😊`;
  }

  static getHumanTransferMessage(): string {
    return `Deixa eu chamar meu gerente aqui...

Ele é muito bom, você vai gostar! 👨‍💼

Um segundinho só... 📞`;
  }

  /**
   * MENSAGENS PROMOCIONAIS
   */
  static getPromoMessage(): string {
    return `🎉 *PROMOÇÃO ESPECIAL PRA VOCÊ!* 🎉

Aproveita esse desconto por tempo limitado:

✨ 1º Mês com 50% de desconto!
✨ Sem taxa de instalação!
✨ 7 dias grátis pra testar!

Corre que estou com fila aqui! 😄

Quer aproveitar?`;
  }

  static getBirthdayPromoMessage(name: string): string {
    return `🎂 *Parabéns, ${name}!* 🎂

Seu dia é especial e merece uma surpresa!

🎁 15% de desconto na renovação
🎁 Um mês grátis em qualquer plano
🎁 Acesso vip ao suporte

Aproveita só você! 💝`;
  }

  /**
   * AGRADECIMENTO
   */
  static getThankYouMessage(): string {
    return `Obrigada por escolher a gente! 💙

Você acabou de se juntar a milhares de clientes satisfeitos!

Qualquer dúvida ou problema, é só chamar:
📲 Me manda uma mensagem
📞 Fone: (11) 1234-5678
💬 Chat: 24h por dia!

Bora aproveitar! 🎬`;
  }

  /**
   * FOLLOW-UP
   */
  static getFollowUpMessage(days: number): string {
    if (days === 1) {
      return `Opa! 👋 Tudo bem aí com você?

Como tá a experiência com nosso IPTV? Tá achando legal?

Alguma dúvida? É só chamar! 😊`;
    } else if (days === 7) {
      return `E aí, ${days} dias de acesso! 🎉

Já descobriu uns conteúdos legais? 📺

Feedback: como tá sendo sua experiência?

Quer sugerir algo? Me manda mensagem! 💬`;
    } else {
      return `Opa! Tudo OK por aí? 😊

Qualquer problema é só falar!

Estou por aqui 24h pra ajudar! 💪`;
    }
  }

  /**
   * RETORNO PÓS-COMPRA
   */
  static getPostPurchaseMessage(): string {
    return `🎬 *Seu acesso está ativo!* 🎬

Parabéns! Você já pode começar a aproveitar!

📱 *Download do app:*
iOS: App Store
Android: Google Play
Web: streaming.iptv.com.br

🎯 *Primeiros passos:*
1️⃣ Faça login
2️⃣ Escolha um conteúdo
3️⃣ Aproveite! 🍿

Divirta-se! 🎉`;
  }
}

export default IPTVMessageTemplates;
