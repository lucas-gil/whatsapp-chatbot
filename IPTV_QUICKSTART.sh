#!/bin/bash

# 🎬 ChatBot IPTV - Quick Start
# Script para inicializar o chatbot

echo "╔══════════════════════════════════════════════════╗"
echo "║   🤖 ChatBot IPTV - Bem-vindo!                 ║"
echo "║   Seu vendedor de IPTV no WhatsApp 24h         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado"
    echo "Execute este script na raiz do projeto"
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo ""
echo "🔧 Configurando banco de dados..."
cd apps/api
npx prisma migrate dev --name init

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   🚀 Próximos Passos:                            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Adicione suas variáveis de ambiente:"
echo "   - Crie um arquivo .env na pasta apps/api"
echo "   - Use .env.example como referência"
echo ""
echo "2️⃣  Configure o WhatsApp Cloud API:"
echo "   - Acesse: https://developers.facebook.com/"
echo "   - Crie uma app e gere um access token"
echo "   - Preencha as variáveis de ambiente"
echo ""
echo "3️⃣  Configure os planos IPTV:"
echo "   - Acesse o Admin em: http://localhost:3001"
echo "   - Vá para 'Planos' e crie seus planos"
echo "   - Exemplo: Básico (R$9,90), Premium (R$29,90)"
echo ""
echo "4️⃣  Teste o chatbot:"
echo "   - Inicie o servidor: npm run dev"
echo "   - Envie uma mensagem 'oi' para seu WhatsApp"
echo "   - Comece a vender! 🎉"
echo ""
echo "📚 Documentação completa:"
echo "   - IPTV_CHATBOT.md - Guia técnico"
echo "   - EXEMPLOS_CONVERSAS.md - Exemplos reais"
echo ""
echo "💬 Suporte:"
echo "   - GitHub Issues: [seu-repo]"
echo "   - Email: suporte@iptvstreaming.com"
echo ""
echo "Boa sorte! 🚀"
