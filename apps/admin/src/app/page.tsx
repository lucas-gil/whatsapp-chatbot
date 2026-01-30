"use client";

import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Settings,
  Zap,
  BarChart3,
  Lock,
  Smartphone,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              IPTV Chatbot
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 font-medium text-white hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            Acessar Painel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-purple-500/10 to-emerald-500/10 blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Chatbot Automático para
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {" "}
                Vendas de IPTV
              </span>
            </h2>

            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Atenda seus clientes 24/7 com mensagens automáticas personalizadas.
              Configure, customize e envie campanhas de forma simples e eficiente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-medium text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
              >
                Ir para Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-8 py-3 font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Conhecer Recursos
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur-sm">
                <p className="text-2xl md:text-3xl font-bold text-green-400">245</p>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Contatos Cadastrados
                </p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur-sm">
                <p className="text-2xl md:text-3xl font-bold text-blue-400">38</p>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Chats Ativos
                </p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur-sm">
                <p className="text-2xl md:text-3xl font-bold text-purple-400">
                  145
                </p>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Clientes Convertidos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative py-20 md:py-32 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Recursos Poderosos
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seus clientes e enviar
              mensagens automáticas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "WhatsApp Business",
                description:
                  "Conecte sua conta WhatsApp Business em poucos cliques",
              },
              {
                icon: MessageSquare,
                title: "Editar Mensagens",
                description:
                  "Customize todas as mensagens enviadas aos seus clientes",
              },
              {
                icon: Smartphone,
                title: "Enviar Campanhas",
                description: "Crie e envie campanhas para seus contatos",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                description: "Acompanhe métricas de envio e engajamento",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-600/50 transition-all"
              >
                <feature.icon className="h-8 w-8 text-green-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h3>

          <p className="text-lg text-slate-400 mb-8">
            Acesse seu painel de controle e configure o WhatsApp Business agora mesmo
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-lg font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
          >
            Acessar Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-400">
          <p>&copy; 2024 IPTV Chatbot. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
