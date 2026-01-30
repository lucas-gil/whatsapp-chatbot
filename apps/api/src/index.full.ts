import Fastify from "fastify";
import cors from "@fastify/cors";
import { logger } from "@/utils/logger";
import { env } from "@/config/environment";
import { iptvRoutes } from "@/routes/iptv.routes";

const app = Fastify({
  logger: true,
});

// Middlewares
app.register(cors, {
  origin: true,
});

// Health check
app.get("/health", async (request, reply) => {
  return reply.send({ status: "ok", timestamp: new Date().toISOString() });
});

// Rotas IPTV
app.register(iptvRoutes, { prefix: "/api/iptv" });

// Error handler
// app.setErrorHandler((error, request, reply) => {
//   logger.error("❌ Erro não tratado:", error);
//   reply.code(error.statusCode || 500).send({
//     error: error.message || "Erro interno do servidor",
//   });
// });

// Iniciar servidor
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info(
      `🚀 Servidor rodando em http://localhost:${env.PORT}`
    );
    logger.info(`🌍 API: ${env.API_URL}`);
  } catch (error) {
    logger.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

start();
