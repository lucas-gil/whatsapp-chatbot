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
  Smartphone
} from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeConversations: 0,
    totalMessages: 0,
    totalCampaigns: 0
  });

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Chatbot</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchStats}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              🔄 Atualizar
            </button>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Acessar Painel
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-6xl md:text-7xl mb-6">🤖</div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            WhatsApp Chatbot
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Sistema completo de automação WhatsApp com IA Gemini. Mensagens personalizadas, vendas automáticas e muito mais.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Ir para Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/whatsapp-connect"
              className="inline-flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              <Smartphone className="w-5 h-5" />
              Conectar WhatsApp
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-gray-600 text-sm">Contatos Totais</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalContacts}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-gray-600 text-sm">Conversas Ativas</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeConversations}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl mb-2">📨</div>
            <p className="text-gray-600 text-sm">Total de Mensagens</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-gray-600 text-sm">Campanhas</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Smartphone,
              title: 'Conectar WhatsApp',
              description: 'Gere QR Code e conecte sua conta WhatsApp em segundos',
              href: '/whatsapp-connect'
            },
            {
              icon: MessageSquare,
              title: 'Mensagens Automáticas',
              description: 'Configure mensagens personalizadas que o bot responde automaticamente',
              href: '/messages'
            },
            {
              icon: Zap,
              title: 'IA Gemini Persuasiva',
              description: 'Use IA para vendas automáticas. Configure o prompt como preferir',
              href: '/ai-config'
            },
            {
              icon: Send,
              title: 'Envio em Massa',
              description: 'Envie mensagens, imagens, áudios e arquivos para múltiplos contatos',
              href: '/broadcast'
            },
            {
              icon: Users,
              title: 'Gerenciar Contatos',
              description: 'Adicione, edite e organize seus contatos com facilidade',
              href: '/contacts'
            },
            {
              icon: BarChart3,
              title: 'Análises',
              description: 'Acompanhe estatísticas de mensagens e campanhas em tempo real',
              href: '/analytics'
            },
          ].map((feature, i) => (
            <Link key={i} href={feature.href}>
              <div className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-8 cursor-pointer h-full">
                <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Acesse seu painel de controle completo e comece a automatizar seus atendimentos agora
          </p>
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Acessar Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

