'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff, Loader, RefreshCw, Key } from 'lucide-react';
import axios from 'axios';

interface Settings {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  webhookUrl: string;
  apiBaseUrl: string;
  maxRetries: number;
  retryInterval: number;
  autoReply: boolean;
  autoReplyMessage: string;
  messageTimeout: number;
  enableNotifications: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    businessName: 'IPTV ChatBot',
    businessPhone: '55 11 98765-4321',
    businessEmail: 'admin@iptvchatbot.com',
    webhookUrl: 'https://webhook.site/seu-webhook',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '',
    maxRetries: 3,
    retryInterval: 5000,
    autoReply: true,
    autoReplyMessage: 'Obrigado pela mensagem! Responderemos em breve.',
    messageTimeout: 30000,
    enableNotifications: true,
  });

  const [geminiKey, setGeminiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const API_BASE = 'http://localhost:3000/api';

  useEffect(() => {
    // Carregar configurações do localStorage
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simular salvamento
      localStorage.setItem('appSettings', JSON.stringify(settings));
      setSavedMessage('✓ Configurações salvas com sucesso!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSavedMessage('✗ Erro ao salvar configurações');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Configurações</h1>
              <p className="text-slate-400">Gerencie as configurações gerais do sistema</p>
            </div>

            {/* Mensagem de Sucesso/Erro */}
            {savedMessage && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                savedMessage.includes('sucesso') 
                  ? 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-900/20 border border-red-500/30 text-red-400'
              }`}>
                {savedMessage.includes('sucesso') ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                {savedMessage}
              </div>
            )}

            <div className="space-y-8">
              {/* Seção: Gemini API Key */}
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Key className="text-yellow-500" size={24} />
                  Token Gemini API
                </h2>

                <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    <strong>💡 Obtenha seu token em:</strong>{' '}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-yellow-200"
                    >
                      https://aistudio.google.com/ → "Get API Key"
                    </a>
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Cola seu Token Gemini
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy... (sua chave do Google AI Studio)"
                      className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-4 top-3 text-slate-400 hover:text-slate-300"
                    >
                      {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Sua chave é privada e segura</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={async () => {
                      if (!geminiKey.trim()) {
                        setSavedMessage('⚠️ Digite um token antes de salvar');
                        return;
                      }
                      setIsSaving(true);
                      try {
                        const res = await axios.post(`${API_BASE}/settings/gemini-key`, { key: geminiKey });
                        if (res.data.success) {
                          setSavedMessage('✅ Token Gemini salvo com sucesso!');
                          setTimeout(() => setSavedMessage(''), 3000);
                        }
                      } catch (error) {
                        setSavedMessage('❌ Erro ao salvar token');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Save size={18} />
                    {isSaving ? 'Salvando...' : 'Salvar Token'}
                  </button>

                  <button
                    onClick={async () => {
                      if (!geminiKey.trim()) {
                        setSavedMessage('⚠️ Configure o token primeiro');
                        return;
                      }
                      setTestLoading(true);
                      try {
                        const res = await axios.post(`${API_BASE}/settings/test-gemini`, {
                          key: geminiKey,
                          message: 'Teste'
                        });
                        if (res.data.success) {
                          setTestResult({ success: true, response: res.data.response });
                          setSavedMessage('✅ Token Gemini funcionando!');
                          setStatusMessage('🟢 API Gemini OK');
                        }
                      } catch (error: any) {
                        setTestResult({ success: false, error: error.response?.data?.error || error.message });
                        setSavedMessage('❌ Erro ao testar token');
                        setStatusMessage('🔴 API Gemini com erro');
                      } finally {
                        setTestLoading(false);
                      }
                    }}
                    disabled={testLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {testLoading ? <Loader className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    {testLoading ? 'Testando...' : 'Testar Token'}
                  </button>

                  <button
                    onClick={async () => {
                      setTestLoading(true);
                      const results = [];
                      try {
                        // Test Health
                        try {
                          const health = await axios.get('http://localhost:3000/health');
                          results.push({ name: '/health', status: '✅ OK' });
                        } catch (e) {
                          results.push({ name: '/health', status: '❌ Erro' });
                        }
                        // Test Product API
                        try {
                          await axios.get(`${API_BASE}/product/data`);
                          results.push({ name: '/api/product/data', status: '✅ OK' });
                        } catch (e) {
                          results.push({ name: '/api/product/data', status: '❌ Erro' });
                        }
                        // Test AI API
                        try {
                          await axios.post(`${API_BASE}/ai/generate-response`, { message: 'Teste' });
                          results.push({ name: '/api/ai/generate-response', status: '✅ OK' });
                        } catch (e) {
                          results.push({ name: '/api/ai/generate-response', status: '❌ Erro' });
                        }
                        setTestResult({ endpoints: results });
                        setSavedMessage('✅ Endpoints testados!');
                      } catch (error) {
                        setSavedMessage('❌ Erro ao testar endpoints');
                      } finally {
                        setTestLoading(false);
                      }
                    }}
                    disabled={testLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    <CheckCircle size={18} />
                    {testLoading ? 'Testando...' : 'Testar Endpoints'}
                  </button>
                </div>

                {/* Resultado do Teste */}
                {testResult && (
                  <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    {testResult.response && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Resposta Gemini:</h4>
                        <div className="bg-slate-900 p-3 rounded font-mono text-xs text-slate-300 max-h-32 overflow-auto">
                          {testResult.response.substring(0, 300)}...
                        </div>
                      </div>
                    )}
                    {testResult.error && (
                      <div>
                        <h4 className="font-semibold text-red-400 mb-2">Erro:</h4>
                        <div className="bg-red-900/20 p-3 rounded font-mono text-xs text-red-300">
                          {testResult.error}
                        </div>
                      </div>
                    )}
                    {testResult.endpoints && (
                      <div>
                        <h4 className="font-semibold text-white mb-3">Endpoints:</h4>
                        <div className="space-y-2">
                          {testResult.endpoints.map((ep: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-slate-900 rounded">
                              <span className="font-mono text-sm text-slate-300">{ep.name}</span>
                              <span className={`font-bold ${ep.status.includes('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {ep.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Seção: Informações do Negócio */}
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded"></div>
                  Informações do Negócio
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nome do Negócio
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={settings.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Telefone Principal
                    </label>
                    <input
                      type="tel"
                      name="businessPhone"
                      value={settings.businessPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email de Contato
                    </label>
                    <input
                      type="email"
                      name="businessEmail"
                      value={settings.businessEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Seção: Configurações de API */}
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded"></div>
                  Configurações de API
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      URL Base da API
                    </label>
                    <input
                      type="url"
                      name="apiBaseUrl"
                      value={settings.apiBaseUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Máximo de Tentativas
                    </label>
                    <input
                      type="number"
                      name="maxRetries"
                      value={settings.maxRetries}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Intervalo de Retry (ms)
                    </label>
                    <input
                      type="number"
                      name="retryInterval"
                      value={settings.retryInterval}
                      onChange={handleInputChange}
                      min="1000"
                      step="1000"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Timeout de Mensagem (ms)
                    </label>
                    <input
                      type="number"
                      name="messageTimeout"
                      value={settings.messageTimeout}
                      onChange={handleInputChange}
                      min="5000"
                      step="5000"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      URL do Webhook
                    </label>
                    <input
                      type="url"
                      name="webhookUrl"
                      value={settings.webhookUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Seção: Resposta Automática */}
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded"></div>
                  Resposta Automática
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="autoReply"
                      checked={settings.autoReply}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-slate-300 cursor-pointer">
                      Ativar Resposta Automática
                    </label>
                  </div>

                  {settings.autoReply && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Mensagem de Resposta Automática
                      </label>
                      <textarea
                        name="autoReplyMessage"
                        value={settings.autoReplyMessage}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Seção: Notificações */}
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded"></div>
                  Notificações
                </h2>

                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    name="enableNotifications"
                    checked={settings.enableNotifications}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500 cursor-pointer"
                  />
                  <label className="text-sm font-medium text-slate-300 cursor-pointer">
                    Ativar Notificações do Sistema
                  </label>
                </div>
              </section>

              {/* Botão Salvar */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <Save size={20} />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
