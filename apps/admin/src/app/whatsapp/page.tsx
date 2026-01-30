'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MessageSquare, Check, AlertCircle, Smartphone, RefreshCw, LogOut, Copy, Zap, Send } from 'lucide-react';

interface WhatsAppSession {
  sessionId: string;
  qrCode: string;
  isConnected: boolean;
  phoneNumber: string;
  connectedAt: string;
  state: string;
}

interface IncomingMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  isFromMe: boolean;
  type: string;
}

export default function WhatsAppPage() {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [incomingMessages, setIncomingMessages] = useState<IncomingMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [messagesInterval, setMessagesInterval] = useState<NodeJS.Timeout | null>(null);

  const cleanSessionId = (id: string | undefined) => {
    if (typeof id !== 'string') return '';
    return id;
  };

  useEffect(() => {
    // Carregar sessão salva
    const saved = localStorage.getItem('whatsappSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Validar se a sessão ainda é válida (não pode ter mais de 24 horas)
        if (parsed.connectedAt) {
          const connectedTime = new Date(parsed.connectedAt).getTime();
          const now = Date.now();
          const ageMs = now - connectedTime;
          const maxAge = 24 * 60 * 60 * 1000; // 24 horas
          
          if (ageMs > maxAge) {
            // Sessão expirada, limpar
            localStorage.removeItem('whatsappSession');
            setSession(null);
            return;
          }
        }
        
        setSession(parsed);
        // Se estava conectado, verificar status
        if (parsed.isConnected) {
          verifyConnection(parsed.sessionId);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        localStorage.removeItem('whatsappSession');
      }
    }
  }, []);

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    setMessage(null);
    try {
      const response = await fetch('/api/whatsapp/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        const newSession: WhatsAppSession = {
          sessionId: data.sessionId,
          qrCode: data.qrCode,
          isConnected: false,
          phoneNumber: '',
          connectedAt: '',
          state: 'waiting_scan'
        };
        setSession(newSession);
        localStorage.setItem('whatsappSession', JSON.stringify(newSession));
        setMessage({ type: 'info', text: '✓ QR Code REAL gerado! Escaneie com seu WhatsApp' });

        // Verificar conexão a cada 3 segundos (Baileys pode ser lento)
        if (checkInterval) clearInterval(checkInterval);
        const interval = setInterval(() => {
          verifyConnection(data.sessionId);
        }, 3000);
        setCheckInterval(interval);

        // Cancelar verificação após 5 minutos
        setTimeout(() => {
          if (interval) clearInterval(interval);
          setMessage({ type: 'error', text: '✗ Timeout: QR Code expirou. Tente novamente.' });
        }, 300000);
      } else {
        setMessage({ type: 'error', text: `✗ ${data.error || 'Erro ao gerar QR code'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `✗ Erro: ${error instanceof Error ? error.message : 'Desconhecido'}` });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const verifyConnection = async (sessionId: string) => {
    const cleanId = cleanSessionId(sessionId);
    if (!cleanId) return;

    try {
      const response = await fetch(`/api/whatsapp/status/${cleanId}`);

      const data = await response.json();

      // Verificar se a sessão expirou
      if (data.state === 'expired' || data.error?.includes('expirada')) {
        setSession(null);
        localStorage.removeItem('whatsappSession');
        setIncomingMessages([]);
        setReplyTo('');
        setMessage({ type: 'error', text: '✗ Sessão expirada. Gere um novo QR Code.' });
        if (checkInterval) clearInterval(checkInterval);
        if (messagesInterval) clearInterval(messagesInterval);
        return;
      }

      // Mostrar erro se houver
      if (data.error && data.state === 'error') {
        setMessage({ type: 'error', text: `✗ ${data.error}` });
        setSession((prev) =>
          prev
            ? {
                ...prev,
                state: 'error'
              }
            : null
        );
        if (checkInterval) clearInterval(checkInterval);
        return;
      }

      if (data.isConnected) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                isConnected: true,
                state: 'connected',
                phoneNumber: data.phoneNumber || 'WhatsApp Conectado'
              }
            : null
        );
        setMessage({ type: 'success', text: '✓ WhatsApp conectado com sucesso!' });
        
        // Salvar sessão
        const updatedSession: WhatsAppSession = {
          sessionId: cleanId,
          qrCode: session?.qrCode || '',
          isConnected: true,
          phoneNumber: data.phoneNumber || 'WhatsApp Conectado',
          connectedAt: new Date().toISOString(),
          state: 'connected'
        };
        localStorage.setItem('whatsappSession', JSON.stringify(updatedSession));
        
        // Parar verificação
        if (checkInterval) clearInterval(checkInterval);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const disconnect = async () => {
    const cleanId = cleanSessionId(session?.sessionId);
    if (!cleanId) return;

    try {
      const response = await fetch(`/api/whatsapp/disconnect/${cleanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setSession(null);
          localStorage.removeItem('whatsappSession');
          setIncomingMessages([]);
          setReplyTo('');
          setMessage({ type: 'info', text: 'Sessão já estava encerrada.' });
          if (checkInterval) clearInterval(checkInterval);
          if (messagesInterval) clearInterval(messagesInterval);
          return;
        }

        setMessage({ type: 'error', text: '✗ Erro ao desconectar.' });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSession(null);
        localStorage.removeItem('whatsappSession');
        setIncomingMessages([]);
        setReplyTo('');
        setMessage({ type: 'success', text: '✓ Desconectado com sucesso' });
        if (checkInterval) clearInterval(checkInterval);
        if (messagesInterval) clearInterval(messagesInterval);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: `✗ Erro ao desconectar: ${error instanceof Error ? error.message : 'Desconhecido'}` });
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const cleanId = cleanSessionId(sessionId);
    if (!cleanId) return;

    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/whatsapp/messages/${cleanId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setIncomingMessages([]);
          setReplyTo('');
        }
        return;
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        setIncomingMessages(data.messages);
        const lastInbound = [...data.messages].reverse().find((msg: IncomingMessage) => !msg.isFromMe);
        if (lastInbound && !replyTo) {
          setReplyTo(lastInbound.from);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendReply = async () => {
    const cleanId = cleanSessionId(session?.sessionId);
    if (!cleanId || !replyTo || !replyText.trim()) return;

    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: cleanId, phone: replyTo, message: replyText.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setReplyText('');
        setMessage({ type: 'success', text: '✓ Mensagem enviada com sucesso' });
        setTimeout(() => setMessage(null), 2000);
        fetchMessages(cleanId);
      } else {
        setMessage({ type: 'error', text: `✗ ${data.error || 'Erro ao enviar mensagem'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `✗ Erro ao enviar mensagem: ${error instanceof Error ? error.message : 'Desconhecido'}` });
    }
  };

  const copySessionId = () => {
    if (session?.sessionId) {
      navigator.clipboard.writeText(session.sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!session?.isConnected || !session.sessionId) {
      if (messagesInterval) clearInterval(messagesInterval);
      return;
    }

    fetchMessages(session.sessionId);
    const interval = setInterval(() => {
      fetchMessages(session.sessionId);
    }, 3000);
    setMessagesInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [session?.isConnected, session?.sessionId]);

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <MessageSquare size={32} className="text-emerald-500" />
                  <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">WhatsApp Business</h1>
                  <p className="text-emerald-400 text-sm flex items-center gap-1">
                    <Zap size={14} />
                    QR Code REAL (Baileys)
                  </p>
                </div>
              </div>
              <p className="text-slate-400">Integração real com WhatsApp Web</p>
            </div>

            {/* Status Indicator */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  session?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className={`text-lg font-semibold ${session?.isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                {session?.isConnected ? '✓ Conectado' : session?.state === 'waiting_scan' ? '⏳ Aguardando Scan' : '○ Desconectado'}
              </span>
              {session?.phoneNumber && session.isConnected && (
                <span className="text-slate-400 ml-4">
                  Número: <span className="text-white">{session.phoneNumber}</span>
                </span>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500'
                    : message.type === 'error'
                      ? 'bg-red-500/20 text-red-300 border border-red-500'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500'
                }`}
              >
                {message.type === 'success' ? (
                  <Check size={20} />
                ) : message.type === 'error' ? (
                  <AlertCircle size={20} />
                ) : (
                  <RefreshCw size={20} className="animate-spin" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* QR Code Section */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-8 border border-emerald-500/30">
                  <h2 className="text-xl font-semibold text-white mb-6">Escanear QR Code</h2>

                  {session?.qrCode && !session.isConnected ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-6 rounded-lg mb-6 shadow-lg">
                        <img src={session.qrCode} alt="QR Code WhatsApp REAL" className="w-72 h-72" />
                      </div>
                      <p className="text-slate-300 text-center mb-4 font-semibold">
                        ✓ Este é um QR Code REAL gerado pelo Baileys
                      </p>
                      <p className="text-slate-400 text-center mb-4">
                        Abra o WhatsApp e vá para Configurações → Dispositivos Conectados → Conectar um Dispositivo
                      </p>
                      <div className="bg-slate-800/50 p-3 rounded text-slate-400 text-sm">
                        Sessão: <span className="text-emerald-400 font-mono text-xs">{session.sessionId}</span>
                      </div>
                    </div>
                  ) : session?.isConnected ? (
                    <div className="flex flex-col items-center justify-center h-80 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg border border-emerald-500/30">
                      <Check size={48} className="text-emerald-400 mb-4" />
                      <p className="text-emerald-300 text-lg font-semibold">WhatsApp Conectado!</p>
                      <p className="text-emerald-200 text-sm mt-2">{session.phoneNumber}</p>
                      <p className="text-emerald-200/70 text-xs mt-4">Conexão ativa e pronta para usar</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-80 bg-slate-800/50 rounded-lg border border-slate-700">
                      <Smartphone size={48} className="text-slate-400 mb-4" />
                      <p className="text-slate-300 font-semibold">Clique em "Gerar QR Code REAL"</p>
                      <p className="text-slate-400 text-sm mt-2">para conectar seu WhatsApp</p>
                    </div>
                  )}

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={generateQRCode}
                      disabled={isGeneratingQR || session?.isConnected}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {isGeneratingQR ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Gerando QR Code...
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          Gerar QR Code REAL
                        </>
                      )}
                    </button>
                    {session?.isConnected && (
                      <button
                        onClick={disconnect}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <LogOut size={18} />
                        Desconectar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div>
                <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Check size={18} className="text-emerald-400" />
                    Como Conectar
                  </h3>
                  <ol className="space-y-4 text-slate-300 text-sm">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Clique em <strong>"Gerar QR Code REAL"</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Abra o <strong>WhatsApp</strong> no seu telefone</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Vá para <strong>Configurações → Dispositivos Conectados</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>Escolha <strong>"Conectar um Dispositivo"</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                      <span>Escaneie o QR Code com a câmera</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg p-4 border border-emerald-500/30">
                  <p className="text-emerald-400 text-sm font-semibold mb-2">✓ Integração REAL</p>
                  <p className="text-emerald-200 text-xs">
                    Este QR Code é gerado em tempo real por Baileys. Você conectará seu WhatsApp verdadeiro.
                  </p>
                </div>

                {session?.sessionId && (
                  <div className="mt-4 bg-slate-900 rounded-lg p-6 border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-3">Session ID</h3>
                    <div className="bg-slate-800 p-3 rounded text-slate-300 text-xs break-all mb-3 font-mono">{session.sessionId}</div>
                    <button
                      onClick={copySessionId}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded transition"
                    >
                      <Copy size={16} />
                      {copied ? 'Copiado!' : 'Copiar ID'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Mensagens Recebidas</h3>
                    {isLoadingMessages && <span className="text-slate-400 text-xs">Atualizando...</span>}
                  </div>

                  {!session?.isConnected ? (
                    <p className="text-slate-400 text-sm">Conecte o WhatsApp para visualizar mensagens.</p>
                  ) : incomingMessages.length === 0 ? (
                    <p className="text-slate-400 text-sm">Nenhuma mensagem recebida ainda.</p>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                      {incomingMessages.map((msg, idx) => (
                        <button
                          key={`${msg.id}-${msg.timestamp}-${idx}`}
                          onClick={() => setReplyTo(msg.from)}
                          className={`w-full text-left p-3 rounded-lg border transition ${
                            replyTo === msg.from ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span>{msg.isFromMe ? 'Você' : msg.from}</span>
                            <span>{new Date(msg.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="text-slate-200 text-sm">{msg.body || '(sem texto)'}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Responder</h3>
                  <label className="text-xs text-slate-400">Para (número ou id)</label>
                  <input
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="ex: 5511999999999@c.us"
                    className="w-full mt-1 mb-3 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={!session?.isConnected}
                  />
                  <label className="text-xs text-slate-400">Mensagem</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="Digite sua resposta..."
                    className="w-full mt-1 mb-4 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={!session?.isConnected}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!session?.isConnected || !replyTo || !replyText.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Enviar resposta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
