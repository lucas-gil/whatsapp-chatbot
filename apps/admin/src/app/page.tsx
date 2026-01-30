'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <div className="flex justify-center mb-6">
          <div className="text-7xl">🤖</div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-3">WhatsApp Chatbot</h1>
        <p className="text-xl text-blue-100">Painel de Controle em Tempo Real</p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Contatos Totais */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600">👥 Contatos Totais</h3>
              </div>
            </div>
            <p className="text-5xl font-bold text-blue-600 mb-4">--</p>
            <p className="text-gray-600 text-sm mb-6">Usuários cadastrados no sistema</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Atualizar
            </button>
          </div>

          {/* Card 2: Conversas Ativas */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-600">💬 Conversas Ativas</h3>
              </div>
            </div>
            <p className="text-5xl font-bold text-blue-600 mb-4">20</p>
            <p className="text-gray-600 text-sm mb-6">Chats em andamento</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Atualizar
            </button>
          </div>

          {/* Card 3: Tickets Abertos */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-pink-600">🎫 Tickets Abertos</h3>
              </div>
            </div>
            <p className="text-5xl font-bold text-pink-600 mb-4">--</p>
            <p className="text-gray-600 text-sm mb-6">Suporte pendente</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Atualizar
            </button>
          </div>

          {/* Card 4: Receita */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-orange-600">🍊 Receita (Mês)</h3>
              </div>
            </div>
            <p className="text-4xl font-bold text-orange-600 mb-4">R$ --</p>
            <p className="text-gray-600 text-sm mb-6">Pagamentos processados</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Atualizar
            </button>
          </div>

          {/* Card 5: Planos Ativos */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-green-600">✅ Planos Ativos</h3>
              </div>
            </div>
            <p className="text-5xl font-bold text-green-600 mb-4">30</p>
            <p className="text-gray-600 text-sm mb-6">Assinaturas em vigor</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Atualizar
            </button>
          </div>

          {/* Card 6: Status API */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-red-600">🚀 Status API</h3>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <p className="text-lg font-semibold text-red-600">API Offline</p>
            </div>
            <p className="text-gray-600 text-sm mb-6">Status do servidor</p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Verificar
            </button>
          </div>
        </div>

        {/* Botão para Dashboard */}
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Ir para Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
