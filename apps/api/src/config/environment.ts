import "dotenv/config";

export const env = {
  // App
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000"),
  API_URL: process.env.API_URL || "http://localhost:3000",

  // WhatsApp
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || "",
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",

  // IA
  AI_PROVIDER: (process.env.AI_PROVIDER || "openai") as "openai" | "gemini",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4-turbo",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",

  // Mercado Pago
  MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
  MERCADO_PAGO_PUBLIC_KEY: process.env.MERCADO_PAGO_PUBLIC_KEY || "",

  // Banco de Dados
  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // Admin
  ADMIN_SECRET: process.env.ADMIN_SECRET || "admin123",
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-key",

  // Notificações
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",

  // Storage
  STORAGE_TYPE: process.env.STORAGE_TYPE || "local",
  S3_BUCKET: process.env.S3_BUCKET || "",
  S3_REGION: process.env.S3_REGION || "",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || "",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || "",

  // Marca
  BRAND_NAME: process.env.BRAND_NAME || "Sua Marca",
  BRAND_LOGO_URL: process.env.BRAND_LOGO_URL || "",
  BRAND_DESCRIPTION: process.env.BRAND_DESCRIPTION || "",
  DEMO_VIDEO_URL: process.env.DEMO_VIDEO_URL || "",

  // Logs
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
