import { OpenAI } from "@openai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

interface RAGContext {
  question: string;
  relevantDocs: Array<{ title: string; content: string; category: string }>;
}

export class AIService {
  private openaiClient?: OpenAI;
  private geminiClient?: GoogleGenerativeAI;
  private provider: "openai" | "gemini";
  private conversationHistory: Map<string, any[]> = new Map();

  constructor() {
    this.provider = (process.env.AI_PROVIDER || "openai") as "openai" | "gemini";

    if (this.provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY é obrigatório quando AI_PROVIDER=openai");
      }
      this.openaiClient = new OpenAI({ apiKey });
    } else if (this.provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY é obrigatório quando AI_PROVIDER=gemini");
      }
      this.geminiClient = new GoogleGenerativeAI(apiKey);
    }

    logger.info(`🤖 IA Service inicializado com provider: ${this.provider}`);
  }

  /**
   * Buscar documentos relevantes da base de conhecimento (RAG)
   */
  private async searchKnowledgeBase(query: string): Promise<RAGContext["relevantDocs"]> {
    try {
      // Buscar por palavras-chave ou similarity (simplificado)
      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const docs = await prisma.knowledgeBase.findMany({
        where: {
          active: true,
          OR: [
            {
              keywords: {
                hasSome: keywords,
              },
            },
            {
              title: {
                search: keywords.join(" | "),
              },
            },
          ],
        },
        take: 3,
        orderBy: {
          order: "asc",
        },
      });

      return docs.map((doc) => ({
        title: doc.title,
        content: doc.content,
        category: doc.category,
      }));
    } catch (error) {
      logger.warn("⚠️ Erro ao buscar base de conhecimento:", error);
      return [];
    }
  }

  /**
   * Gerar resposta com IA + RAG
   */
  async generateResponse(
    userMessage: string,
    userId: string,
    context?: {
      device?: string;
      stage?: string;
      customPrompt?: string;
    }
  ): Promise<string> {
    try {
      // Buscar contexto de RAG
      const ragDocs = await this.searchKnowledgeBase(userMessage);

      // Manter histórico por usuário
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }
      const history = this.conversationHistory.get(userId)!;

      // Sistema prompt base
      let systemPrompt = `Você é um assistente de atendimento ao cliente para a {{BRAND_NAME}}.
Características:
- Responda sempre em português brasileiro
- Seja educado, amigável e direto
- Respostas curtas (máx 3 linhas) para WhatsApp
- Nunca invente informações sobre preços, condições ou políticas
- Se não tiver certeza, diga que vai verificar com o suporte
- Sempre ofereça menu ou voltar ao menu no final

Contexto do usuário:
- Dispositivo: ${context?.device || "não definido"}
- Estágio: ${context?.stage || "prospect"}`;

      // Adicionar prompt customizado se houver
      if (context?.customPrompt) {
        systemPrompt += `\n\nInstruções personalizadas:\n${context.customPrompt}`;
      }

      // Adicionar base de conhecimento ao contexto
      if (ragDocs.length > 0) {
        systemPrompt += `\n\nBase de conhecimento relevante:\n${ragDocs
          .map((doc) => `\n**${doc.title}** (${doc.category}):\n${doc.content}`)
          .join("\n")}`;
      }

      // Preparar mensagens para IA
      const messages = [
        ...history,
        {
          role: "user" as const,
          content: userMessage,
        },
      ];

      let response: string;

      if (this.provider === "openai") {
        response = await this.generateWithOpenAI(systemPrompt, messages);
      } else {
        response = await this.generateWithGemini(systemPrompt, messages);
      }

      // Adicionar ao histórico (máx 20 turnos = 40 mensagens)
      history.push({ role: "user", content: userMessage });
      history.push({ role: "assistant", content: response });
      if (history.length > 40) {
        history.splice(0, 2);
      }

      this.conversationHistory.set(userId, history);

      return response;
    } catch (error) {
      logger.error("❌ Erro ao gerar resposta com IA:", error);
      return "Desculpe, tive um problema ao processar sua solicitação. Vou transferir para um especialista agora.";
    }
  }

  /**
   * Gerar resposta com OpenAI
   */
  private async generateWithOpenAI(systemPrompt: string, messages: any[]): Promise<string> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client não inicializado");
    }

    const response = await this.openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "";
  }

  /**
   * Gerar resposta com Gemini
   */
  private async generateWithGemini(systemPrompt: string, messages: any[]): Promise<string> {
    if (!this.geminiClient) {
      throw new Error("Gemini client não inicializado");
    }

    const model = this.geminiClient.getGenerativeModel({
      model: "gemini-pro",
      systemInstruction: systemPrompt,
    });

    // Converter para formato do Gemini
    const contents = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    return result.response.text() || "";
  }

  /**
   * Analisar intenção do usuário (para roteamento)
   */
  async analyzeIntent(
    message: string,
    options: string[]
  ): Promise<{ intent: string; confidence: number }> {
    try {
      const prompt = `Analize a mensagem do usuário e identifique qual das seguintes intenções ela representa:
Opções: ${options.join(", ")}

Mensagem: "${message}"

Responda APENAS em JSON: {"intent": "opcao_mais_relevante", "confidence": 0.0-1.0}`;

      let response: string;

      if (this.provider === "openai" && this.openaiClient) {
        const result = await this.openaiClient.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 100,
        });
        response = result.choices[0].message.content || "{}";
      } else if (this.provider === "gemini" && this.geminiClient) {
        const model = this.geminiClient.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        response = result.response.text() || "{}";
      } else {
        throw new Error("IA não inicializada");
      }

      try {
        return JSON.parse(response);
      } catch {
        return { intent: options[0], confidence: 0.5 };
      }
    } catch (error) {
      logger.error("❌ Erro ao analisar intenção:", error);
      return { intent: options[0], confidence: 0.3 };
    }
  }

  /**
   * Limpar histórico do usuário
   */
  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
    logger.info(`🗑️ Histórico limpo para usuário ${userId}`);
  }

  /**
   * Tool-calling: Detectar se precisa chamar uma função
   */
  async shouldCallFunction(
    message: string
  ): Promise<{ shouldCall: boolean; function: string; params: any }> {
    try {
      const functions = ["contratar_plano", "renovar_assinatura", "abrir_ticket"];

      const prompt = `Analize a mensagem e determine se o usuário quer usar uma das funções abaixo.
Funções disponíveis: ${functions.join(", ")}

Mensagem: "${message}"

Responda APENAS em JSON: {"shouldCall": true/false, "function": "nome_funcao", "params": {...}}`;

      let response: string;

      if (this.provider === "openai" && this.openaiClient) {
        const result = await this.openaiClient.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        });
        response = result.choices[0].message.content || "{}";
      } else {
        return { shouldCall: false, function: "", params: {} };
      }

      return JSON.parse(response);
    } catch (error) {
      logger.error("❌ Erro ao detectar função:", error);
      return { shouldCall: false, function: "", params: {} };
    }
  }
}

export const aiService = new AIService();
