'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import { AlertCircle, Save, MessageSquare, Loader } from 'lucide-react';

export default function ProductConfig() {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    warranty: '',
    shippingTime: '',
    stockStatus: ''
  });

  const [testMessage, setTestMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = 'http://localhost:3000/api';

  // Carregar dados do produto ao montar
  useEffect(() => {
    loadProductData();
  }, []);

  const loadProductData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/product/data`);
      if (res.data.success) {
        setProduct(res.data.product);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    }
  };

  const handleSaveProduct = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/product/data`, product);
      if (res.data.success) {
        setMessage('✅ Produto salvo com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Erro ao salvar produto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) {
      setMessage('⚠️ Digite uma mensagem para testar');
      return;
    }

    setTestLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/generate-response`, {
        message: testMessage
      });
      if (res.data.success) {
        setAiResponse(res.data.response);
        setMessage('✅ Resposta gerada com sucesso!');
      }
    } catch (error) {
      setMessage('❌ Erro ao gerar resposta');
      console.error(error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚙️ Configurar Produto</h1>
          <p className="text-gray-600">Configure seu produto e teste o vendedor virtual com IA</p>
        </div>

        {/* Mensagens */}
        {message && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-blue-600" size={20} />
            <span className="text-blue-800">{message}</span>
          </div>
        )}

        {/* Seção 1: Dados do Produto */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📦 Dados do Produto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Nome do Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja/Produto</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleInputChange}
                placeholder="Ex: Infinity One IPTV"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
              <input
                type="text"
                name="price"
                value={product.price}
                onChange={handleInputChange}
                placeholder="Ex: R$ 29,90/mês"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Prazo de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prazo de Entrega/Ativação</label>
              <input
                type="text"
                name="shippingTime"
                value={product.shippingTime}
                onChange={handleInputChange}
                placeholder="Ex: Imediato / 24 horas"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Garantia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Garantia</label>
              <input
                type="text"
                name="warranty"
                value={product.warranty}
                onChange={handleInputChange}
                placeholder="Ex: 7 dias de garantia"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status de Estoque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status do Estoque</label>
              <select
                name="stockStatus"
                value={product.stockStatus}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Em estoque">Em estoque</option>
                <option value="Poucas unidades">Poucas unidades</option>
                <option value="Sob demanda">Sob demanda</option>
              </select>
            </div>
          </div>

          {/* Descrição do Produto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Detalhada do Produto</label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleInputChange}
              placeholder="Descreva os benefícios, características principais e diferenciais do seu produto..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">💡 Dica: Quanto mais detalhado, melhor será a resposta da IA</p>
          </div>

          {/* Botão Salvar */}
          <button
            onClick={handleSaveProduct}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        {/* Seção 2: Testar IA */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare size={24} /> 🤖 Testar Vendedor Virtual (IA)
          </h2>

          <p className="text-gray-600 mb-4">Digite uma mensagem como cliente para ver como o vendedor virtual responderá:</p>

          <div className="mb-6">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Ex: Qual é o preço? / Como funciona? / Tem garantia?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleTestAI()}
            />
          </div>

          <button
            onClick={handleTestAI}
            disabled={testLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition mb-6"
          >
            {testLoading ? <Loader className="animate-spin" size={20} /> : <MessageSquare size={20} />}
            {testLoading ? 'Gerando resposta...' : 'Testar Resposta'}
          </button>

          {/* Resposta da IA */}
          {aiResponse && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">💬 Resposta do Vendedor Virtual:</h3>
              <div className="bg-white p-4 rounded border border-blue-200 whitespace-pre-wrap text-gray-800 font-mono text-sm">
                {aiResponse}
              </div>
              <p className="text-blue-700 text-sm mt-3">✨ Esta é a resposta que será enviada ao cliente no WhatsApp</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
