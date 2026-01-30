'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Zap, 
  Users,
  Send,
  Settings,
  BarChart3,
  ArrowRight,
  Smartphone,
  Smartphone,
  Cpu,
  ToggleRight,
  ArrowUpRight,
  Menu,
  X
} from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    totalContacts: 245,
    activeConversations: 38,
    totalMessages: 1250,
    totalCampaigns: 42
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-purple-900/30 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ChatBot AI</h1>
              <p className="text-xs text-purple-400">WhatsApp Automático</p>
            </div>
          </div>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 hover:bg-purple-900/30 rounded-lg transition-colors"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className={`${menuOpen ? 'block' : 'hidden'} md:flex items-center gap-4 absolute md:static top-full left-0 right-0 md:top-auto md:left-auto md:right-auto bg-black/90 md:bg-transparent p-4 md:p-0 border-b md:border-b-0 border-purple-900/30`}>
            <Link href="/dashboard" className="px-4 py-2 hover:bg-purple-900/30 rounded-lg transition-colors text-sm">
              Dashboard
            </Link>
            <Link href="/whatsapp-connect" className="px-4 py-2 text-white rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-sm">
              Conectar WhatsApp
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <div className="text-6xl md:text-8xl mb-4">🤖</div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            ChatBot IA para WhatsApp
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Automação inteligente com IA Gemini. Vendas 24/7, mensagens personalizadas e muito mais.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/whatsapp-connect"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg"
            >
              <Smartphone className="w-5 h-5" />
              Conectar WhatsApp
            </Link>
            <Link 
              href="/ai-config"
              className="inline-flex items-center justify-center gap-2 border-2 border-purple-500 text-purple-400 px-8 py-4 rounded-lg hover:bg-purple-900/20 transition-all font-semibold text-lg"
            >
              <Zap className="w-5 h-5" />
              Configurar IA
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            { label: 'Contatos', value: stats.totalContacts, icon: Users, color: 'from-blue-600 to-blue-400' },
            { label: 'Conversas Ativas', value: stats.activeConversations, icon: MessageSquare, color: 'from-purple-600 to-purple-400' },
            { label: 'Total Mensagens', value: stats.totalMessages, icon: Send, color: 'from-green-600 to-green-400' },
            { label: 'Campanhas', value: stats.totalCampaigns, icon: BarChart3, color: 'from-orange-600 to-orange-400' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="group p-6 rounded-xl border border-purple-900/30 bg-gradient-to-br from-purple-900/10 to-blue-900/10 hover:border-purple-600/50 hover:from-purple-900/20 hover:to-blue-900/20 transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                <p className="text-4xl font-bold mb-3">{stat.value}</p>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  +12% vs mês anterior
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Recursos Poderosos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: 'QR Code WhatsApp',
                description: 'Conecte sua conta em segundos via QR Code',
                href: '/whatsapp-connect',
                color: 'from-blue-600 to-blue-400'
              },
              {
                icon: Zap,
                title: 'IA Gemini Persuasiva',
                description: 'Configure comportamento da IA para vendas automáticas',
                href: '/ai-config',
                color: 'from-purple-600 to-purple-400'
              },
              {
                icon: Send,
                title: 'Envio em Massa',
                description: 'Mensagens, imagens, áudios e arquivos para múltiplos contatos',
                href: '/broadcast',
                color: 'from-green-600 to-green-400'
              },
              {
                icon: Users,
                title: 'Gerenciar Contatos',
                description: 'Organize e categorize seus clientes de forma inteligente',
                href: '/contacts',
                color: 'from-orange-600 to-orange-400'
              },
              {
                icon: BarChart3,
                title: 'Analytics Detalhados',
                description: 'Acompanhe conversões, ROI e desempenho em tempo real',
                href: '/analytics',
                color: 'from-pink-600 to-pink-400'
              },
              {
                icon: ToggleRight,
                title: 'Automação Avançada',
                description: 'Configure fluxos automáticos de mensagens e campanhas',
                href: '/automation',
                color: 'from-cyan-600 to-cyan-400'
              }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Link key={i} href={feature.href}>
                  <div className="group p-8 rounded-xl border border-purple-900/30 bg-gradient-to-br from-purple-900/10 to-blue-900/10 hover:border-purple-600/50 hover:from-purple-900/20 hover:to-blue-900/20 transition-all h-full">
                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Acessar
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative rounded-2xl border border-purple-900/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5"></div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para automatizar seus atendimentos?</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Configure tudo em minutos e comece a vender automaticamente no WhatsApp
            </p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg"
            >
              Ir para Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

