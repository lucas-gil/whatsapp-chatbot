'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Zap } from 'lucide-react';

export default function AIConfig() {
  const [prompt, setPrompt] = useState('Você é um vendedor persuasivo de IPTV...');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/ai/configure-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Prompt salvo com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const testPrompt = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/ai/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage: 'Qual é o melhor plano?',
          customPrompt: prompt
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Resposta IA:\n\n${data.response}`);
      }
    } catch (error) {
      alert('Erro ao testar IA');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Configurar IA Gemini</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Personalizar Comportamento da IA</h2>
            </div>
            <p className="text-gray-600">
              Descreva como você quer que a IA se comporte ao vender seus serviços. Quanto mais detalhado, melhor será a IA em vendas persuasivas.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Prompt de Comportamento da IA
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={12}
                placeholder="Descreva como a IA deve se comportar..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Exemplo: "Você é um vendedor especializado em IPTV. Sempre apresente os benefícios dos planos, seja persuasivo mas profissional, e ofereça descontos para clientes hesitantes."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testPrompt}
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
              >
                🧪 Testar IA
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </div>
          </div>

          {/* Exemplos */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Exemplos de Prompts</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Para Vendas Agressivas:</strong> "Você é um vendedor agressivo e persuasivo de IPTV. Use urgência, mencione promoções limitadas, sempre tente vender o plano mais caro, e faça perguntas para identificar o orçamento do cliente."
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Para Vendas Consultivas:</strong> "Você é um consultor IPTV. Primeiro entenda as necessidades do cliente, recomende o plano ideal, explique os benefícios, e só então ofereça a solução melhor para ele."
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Para Suporte Amigável:</strong> "Você é um atendente IPTV amigável e prestativo. Responda dúvidas com paciência, ofereça soluções, e sempre mantenha um tom simpático e profissional."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
