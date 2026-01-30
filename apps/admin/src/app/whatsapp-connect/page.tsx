'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Smartphone, Copy, Check } from 'lucide-react';

export default function WhatsAppConnect() {
  const [sessionId, setSessionId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState('disconnected');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/whatsapp/generate-qr`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setQrCode(data.qrCode);
        setStatus('pending');
        checkStatus(data.sessionId);
      }
    } catch (error) {
      alert('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (sid: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/whatsapp/status/${sid}`);
      const data = await res.json();
      if (data.connected) {
        setStatus('connected');
        setPhone(data.phone);
      } else if (status === 'pending') {
        setTimeout(() => checkStatus(sid), 3000);
      }
    } catch (error) {
      console.error('Erro ao verificar status');
    }
  };

  useEffect(() => {
    if (sessionId && status === 'pending') {
      const timer = setTimeout(() => checkStatus(sessionId), 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, status]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <h1 className="text-2xl font-bold text-gray-900">Conectar WhatsApp</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">QR Code WhatsApp</h2>
              <p className="text-gray-600">Escaneie o código abaixo com seu WhatsApp para conectar</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm font-semibold text-gray-900">
                {status === 'connected' ? '✅ Conectado' : status === 'pending' ? '⏳ Aguardando scan...' : '❌ Desconectado'}
              </span>
              {status === 'connected' && phone && (
                <span className="text-sm text-gray-600">({phone})</span>
              )}
            </div>
          </div>

          {/* QR Code Area */}
          <div className="flex flex-col items-center justify-center gap-8 mb-12">
            {qrCode ? (
              <div className="p-6 bg-white border-4 border-blue-600 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">QR Code aparecerá aqui</p>
                </div>
              </div>
            )}

            <button
              onClick={generateQR}
              disabled={loading || status === 'pending'}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando QR Code...' : status === 'pending' ? 'Aguardando conexão...' : 'Gerar QR Code'}
            </button>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="p-4 bg-gray-50 rounded-lg mb-8">
              <p className="text-sm text-gray-600 mb-2">ID da Sessão:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-900 break-all">
                  {sessionId}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Copiar"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📱 Como Conectar:</h3>
            <ol className="space-y-4 text-gray-700">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                <span>Clique em "Gerar QR Code" acima</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                <span>Abra WhatsApp no seu celular</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                <span>Vá para Configurações &gt; Computador &gt; Escanear QR Code</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">4</span>
                <span>Aponte a câmera para o QR Code gerado</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">5</span>
                <span>Aguarde a conexão ser estabelecida (pode levar alguns segundos)</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
