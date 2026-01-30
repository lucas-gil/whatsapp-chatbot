'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MessageSquare, Check, AlertCircle, Smartphone, RefreshCw, LogOut } from 'lucide-react';

interface WhatsAppSession {
  qrCodeData: string;
  isConnected: boolean;
  phoneNumber: string;
  sessionId: string;
  connectedAt: string;
}

export default function WhatsAppPage() {
  const [session, setSession] = useState<WhatsAppSession>({
    qrCodeData: '',
    isConnected: false,
    phoneNumber: '',
    sessionId: '',
    connectedAt: '',
  });

  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout>();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrImage, setQrImage] = useState<string>('');
  const [manualPhoneNumber, setManualPhoneNumber] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    // Carregar sessão salva do localStorage
    const saved = localStorage.getItem('whatsappSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      }
    }
  }, []);

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    setMessage(null);
    try {
      // Chamar o backend para gerar QR code real do WhatsApp
      const response = await fetch('http://localhost:3000/api/whatsapp/qrcode', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao conectar com WhatsApp');
      }

      const data = await response.json();
      
      if (!data.qrCode) {
        setMessage({ type: 'success', text: '⏳ Gerando QR Code real... aguarde...' });
        // Tentar novamente em 2 segundos
        setTimeout(() => generateQRCode(), 2000);
        return;
      }

      const newSession: WhatsAppSession = {
        qrCodeData: data.qrCode,
        isConnected: data.isConnected || false,
        phoneNumber: data.phone || '',
        sessionId: `session_${Date.now()}`,
        connectedAt: '',
      };

      setSession(newSession);
      setQrImage(data.qrCode);
      setIsScanning(true);
      localStorage.setItem('whatsappSession', JSON.stringify(newSession));
      
      setMessage({ type: 'success', text: '✓ QR Code real gerado! Escaneie com WhatsApp > Configurações > Aparelhos Ligados' });

      // Simular timeout de 2 minutos para escanear
      const timeout = setTimeout(() => {
        setIsScanning(false);
        setMessage({ type: 'error', text: '✗ QR Code expirou. Gere um novo.' });
      }, 120000);

      setScanTimeout(timeout);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: `✗ Erro: ${errorMsg}. Verifique se o servidor está rodando.` });
      console.error('Erro:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const simulateConnection = () => {
    // Simular conexão bem-sucedida
    const mockPhoneNumber = '5511987654321';
    const updatedSession: WhatsAppSession = {
      ...session,
      isConnected: true,
      phoneNumber: mockPhoneNumber,
      connectedAt: new Date().toISOString(),
    };

    setSession(updatedSession);
    localStorage.setItem('whatsappSession', JSON.stringify(updatedSession));
    
    if (scanTimeout) clearTimeout(scanTimeout);
    setIsScanning(false);
    setMessage({ type: 'success', text: `✓ Conectado com sucesso em ${mockPhoneNumber}!` });
    setTimeout(() => setMessage(null), 3000);
  };

  const connectManually = async () => {
    // Validar número de telefone
    const phoneRegex = /^\d{10,15}$/;
    const cleanPhone = manualPhoneNumber.replace(/\D/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      setMessage({ 
        type: 'error', 
        text: '✗ Número inválido. Use apenas dígitos (10-15 números)' 
      });
      return;
    }

    try {
      // Se tem QR code gerado, confirmar através do endpoint
      if (session.sessionId) {
        const response = await fetch('http://localhost:3000/api/whatsapp/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            phoneNumber: cleanPhone
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao confirmar');
        }

        const data = await response.json();
        
        // Atualizar sessão
        const updatedSession: WhatsAppSession = {
          ...session,
          isConnected: true,
          phoneNumber: cleanPhone,
          connectedAt: new Date().toISOString(),
        };

        setSession(updatedSession);
        localStorage.setItem('whatsappSession', JSON.stringify(updatedSession));
        setShowManualInput(false);
        setManualPhoneNumber('');
        setMessage({ type: 'success', text: `✓ Conectado com sucesso em ${cleanPhone}!` });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: `✗ Erro: ${errorMsg}` });
    }
  };

  const disconnect = () => {
    setSession({
      qrCodeData: '',
      isConnected: false,
      phoneNumber: '',
      sessionId: '',
      connectedAt: '',
    });
    localStorage.removeItem('whatsappSession');
    setMessage({ type: 'success', text: '✓ Desconectado com sucesso' });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatPhoneNumber = (phone: string) => {
    // Formatar número: 5511987654321 -> +55 11 98765-4321
    if (!phone) return '';
    const match = phone.match(/(\d{2})(\d{2})(\d{5})(\d{4})/);
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]}-${match[4]}`;
    }
    return phone;
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare size={32} className="text-emerald-500" />
                <h1 className="text-4xl font-bold text-white">WhatsApp Business</h1>
              </div>
              <p className="text-slate-400">Conecte seu WhatsApp por QR Code</p>
            </div>

            {/* Status da Conexão */}
            <div className="mb-6 p-6 rounded-xl border-2 bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full ${session.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <div>
                    <span className="text-white font-semibold text-lg">
                      {session.isConnected ? '✓ Conectado' : '○ Desconectado'}
                    </span>
                    {session.isConnected && (
                      <p className="text-sm text-slate-400">
                        {formatPhoneNumber(session.phoneNumber)}
                      </p>
                    )}
                  </div>
                </div>
                {session.isConnected && (
                  <button
                    onClick={disconnect}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    Desconectar
                  </button>
                )}
              </div>
            </div>

            {/* Mensagem de Resultado */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-900/20 border border-red-500/30 text-red-400'
              }`}>
                {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
            )}

            {/* Conteúdo Principal */}
            {!session.isConnected ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Smartphone size={28} className="text-emerald-500" />
                    Conectar Seu WhatsApp
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Digite seu número de WhatsApp para conectar o chatbot
                  </p>
                </div>

                <div className="max-w-md mx-auto p-8 bg-emerald-900/10 border border-emerald-500/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-6">Seu Número de WhatsApp</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-3 font-semibold">
                        Número com código do país
                      </label>
                      <input
                        type="text"
                        value={manualPhoneNumber}
                        onChange={(e) => setManualPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="5511987654321"
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-lg font-semibold"
                        inputMode="numeric"
                      />
                      <p className="text-xs text-slate-400 mt-3">
                        <strong>Formato:</strong> 55 (Brasil) + 11 (DDD) + 987654321 (número)
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        <strong>Exemplo:</strong> 5511987654321
                      </p>
                    </div>

                    <button
                      onClick={connectManually}
                      className="w-full px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-lg mt-6"
                    >
                      ✓ Conectar
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                      💡 <strong>Dica:</strong> Use o número exato de seu WhatsApp pessoal ou comercial.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Estado Conectado */
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <div className="text-center">
                  <div className="mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Smartphone size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Conectado com Sucesso!
                    </h3>
                    <p className="text-slate-400">
                      Seu WhatsApp está pronto para usar
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Número Conectado</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {formatPhoneNumber(session.phoneNumber)}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Session ID</p>
                      <p className="text-sm font-mono text-slate-300">
                        {session.sessionId}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={disconnect}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
