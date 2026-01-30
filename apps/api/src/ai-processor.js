// Integração de IA nas respostas automáticas do WhatsApp
const { generateAIResponse, getProductData } = require('./gemini-config');

/**
 * Processa uma mensagem de cliente e gera resposta inteligente com IA
 * @param {string} messageContent - Conteúdo da mensagem do cliente
 * @param {object} sessionData - Dados da sessão
 * @returns {Promise<string>} - Resposta gerada pela IA
 */
async function processMessageWithAI(messageContent, sessionData = {}) {
  try {
    // Limpar mensagem
    const cleanedMessage = messageContent
      .trim()
      .substring(0, 500); // Limitar a 500 caracteres

    if (!cleanedMessage) return null;

    console.log(`🤖 [IA] Processando: "${cleanedMessage.substring(0, 50)}..."`);

    // Gerar resposta com IA
    const aiResponse = await generateAIResponse(cleanedMessage, getProductData());

    if (!aiResponse) {
      console.warn('⚠️ [IA] Nenhuma resposta gerada');
      return null;
    }

    // Limitar resposta a 1000 caracteres (limite do WhatsApp)
    const limitedResponse = aiResponse.substring(0, 1000);

    console.log(`✅ [IA] Resposta gerada com sucesso`);
    return limitedResponse;
  } catch (error) {
    console.error(`❌ [IA] Erro ao processar com IA:`, error.message);
    return null;
  }
}

/**
 * Middleware para usar IA em respostas automáticas
 * Integra com a função existente de auto-reply
 */
function getAutoReplyWithAI(messageContent, botMessages, productData) {
  // Primeiro tenta encontrar uma resposta pré-configurada
  for (const msg of botMessages) {
    if (messageContent.includes(msg.trigger)) {
      return {
        content: msg.content,
        media: msg.media || null
      };
    }
  }

  // Se não encontrar, retorna null para que seja processado por IA
  return null;
}

module.exports = {
  processMessageWithAI,
  getAutoReplyWithAI
};
