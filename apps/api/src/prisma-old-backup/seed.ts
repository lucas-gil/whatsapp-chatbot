import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco...");

  // ===== ADMIN =====
  const admin = await prisma.admin.upsert({
    where: { email: "admin@marca.com" },
    update: {},
    create: {
      email: "admin@marca.com",
      password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLm", // "admin123" (bcrypted)
      name: "Administrador",
      role: "admin",
    },
  });
  console.log("✅ Admin criado:", admin.email);

  // ===== PLANOS =====
  const planos = await prisma.plan.createMany({
    data: [
      {
        name: "Teste Grátis",
        description: "Acesso 7 dias à plataforma completa",
        price: 0,
        billingCycle: 7,
        features: JSON.stringify([
          "Acesso total por 7 dias",
          "Suporte básico",
          "Conversão de formatos",
        ]),
        active: true,
        order: 1,
      },
      {
        name: "Básico",
        description: "Plano mensal com acesso essencial",
        price: 2999, // R$ 29,99
        billingCycle: 30,
        features: JSON.stringify([
          "Streaming em HD",
          "1 dispositivo simultâneo",
          "Suporte por email",
          "Catálogo completo",
        ]),
        active: true,
        order: 2,
      },
      {
        name: "Premium",
        description: "Plano mensal com todos os recursos",
        price: 5999, // R$ 59,99
        billingCycle: 30,
        features: JSON.stringify([
          "Streaming em 4K",
          "4 dispositivos simultâneos",
          "Suporte prioritário",
          "Conteúdo exclusivo",
          "Download offline",
        ]),
        active: true,
        order: 3,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Planos criados:", planos.count);

  // ===== RECOMENDAÇÕES POR DISPOSITIVO =====
  const devices = await prisma.deviceRecommendation.createMany({
    data: [
      {
        device: "TV_SMART",
        description: "Smart TVs modernas com Tizen/WebOS",
        instructions:
          "# Instalação em TV Smart\n\n1. Abra a loja de apps\n2. Busque por 'Marca'\n3. Clique em instalar\n4. Abra e faça login",
        apps: JSON.stringify([
          {
            name: "Marca App",
            store_url: "https://...",
            logo_url: "https://...",
          },
          {
            name: "Smart TV Store",
            store_url: "https://...",
            logo_url: "https://...",
          },
        ]),
        images: ["https://...", "https://...", "https://..."],
      },
      {
        device: "SMARTPHONE",
        description: "Celulares Android e iPhone",
        instructions:
          "# Instalação em Smartphone\n\n1. Abra Google Play (Android) ou App Store (iPhone)\n2. Busque 'Marca'\n3. Instale o app\n4. Abra e faça login",
        apps: JSON.stringify([
          {
            name: "Google Play",
            store_url: "https://...",
            logo_url: "https://...",
          },
          { name: "App Store", store_url: "https://...", logo_url: "https://..." },
        ]),
        images: ["https://...", "https://...", "https://..."],
      },
      {
        device: "TV_BOX",
        description: "TV Box, Fire Stick e similares",
        instructions:
          "# Instalação em TV Box\n\n1. Conecte o controle\n2. Vá para App Store/Loja de Apps\n3. Busque 'Marca'\n4. Instale",
        apps: JSON.stringify([
          {
            name: "Amazon Appstore",
            store_url: "https://...",
            logo_url: "https://...",
          },
        ]),
        images: ["https://...", "https://...", "https://..."],
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Recomendações por dispositivo criadas:", devices.count);

  // ===== MENSAGENS PADRÃO =====
  const messages = await prisma.standardMessage.createMany({
    data: [
      {
        key: "welcome_text",
        content:
          "Olá 👋 Bem-vindo à {{BRAND_NAME}}!\n\nSomos a plataforma líder em streaming de conteúdo digital. Temos séries, filmes, documentários e muito mais.\n\n🎁 Você ganhou um acesso TESTE GRÁTIS por 7 dias!\n\nEm qual dispositivo você deseja assistir?",
        type: "interactive_list",
      },
      {
        key: "device_selection",
        content:
          "Perfeito! Escolha seu dispositivo para receber instruções de instalação:",
        type: "interactive_list",
      },
      {
        key: "installation_instructions",
        content:
          "Segue abaixo como instalar em seu {{DEVICE}}:\n\n{{INSTRUCTIONS}}\n\nDepois que instalar, é só enviar um print da tela inicial para confirmarmos.",
        type: "text",
      },
      {
        key: "menu_main",
        content:
          "Acesse agora a {{BRAND_NAME}}! 🎬\n\nO que você gostaria de fazer?",
        type: "interactive_list",
      },
      {
        key: "support_contact",
        content:
          "Desculpe, não consegui entender sua solicitação.\n\nPor favor, escolha uma opção abaixo ou fale com nosso suporte.",
        type: "text",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Mensagens padrão criadas:", messages.count);

  // ===== BASE DE CONHECIMENTO (FAQ) =====
  const faq = await prisma.knowledgeBase.createMany({
    data: [
      {
        title: "Como instalar em Smart TV?",
        content: `
# Passo a Passo - Instalação em Smart TV

## Samsung (Tizen):
1. Acesse a loja de apps
2. Procure por "Marca"
3. Selecione e clique em "Instalar"
4. Abra o app e faça login

## LG (WebOS):
1. Vá para o menu principal
2. Abra "Content Store"
3. Busque "Marca"
4. Instale e abra

## Dúvidas? Fale com suporte
        `,
        category: "instalacao",
        keywords: ["smart tv", "instalação", "samsung", "lg", "tizen", "webos"],
        active: true,
        order: 1,
      },
      {
        title: "Quais são os planos disponíveis?",
        content: `
# Nossos Planos

## Teste Grátis (7 dias)
- Acesso completo por 7 dias
- Sem cobrança
- Cancele quando quiser

## Básico - R$ 29,99/mês
- Streaming em HD
- 1 dispositivo simultâneo
- Suporte por email
- Catálogo completo

## Premium - R$ 59,99/mês
- Streaming em 4K
- 4 dispositivos simultâneos
- Download offline
- Conteúdo exclusivo
- Suporte prioritário

Todos os planos têm período de teste grátis!
        `,
        category: "precos",
        keywords: ["planos", "preço", "assinatura", "valor", "custo"],
        active: true,
        order: 1,
      },
      {
        title: "Como cancelar minha assinatura?",
        content: `
# Como Cancelar

Você pode cancelar sua assinatura a qualquer momento pelo painel.

## Pelo App:
1. Abra Configurações
2. Vá em "Minha Assinatura"
3. Clique em "Cancelar Assinatura"
4. Confirme

## Pelo Painel Web:
1. Acesse seu perfil
2. Clique em "Gerenciar Assinatura"
3. Selecione "Cancelar"

A sua assinatura será cancelada imediatamente.
        `,
        category: "politicas",
        keywords: ["cancelamento", "cancelar", "assinatura"],
        active: true,
        order: 2,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Base de conhecimento criada:", faq.count);

  console.log("✨ Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
