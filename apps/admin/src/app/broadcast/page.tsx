'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Upload } from 'lucide-react';

export default function Broadcast() {
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [file, setFile] = useState<File | null>(null);
  const [delay, setDelay] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSendBroadcast = async () => {
    if (!message || !contacts) {
      alert('Mensagem e contatos são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const contactList = contacts.split('\n').filter(c => c.trim());
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(`${apiUrl}/api/messages/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          contacts: contactList,
          delay,
          type: mediaType,
          mediaUrl: file ? 'file://' + file.name : ''
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult(`✅ ${data.message}`);
        setMessage('');
        setContacts('');
        setFile(null);
        setTimeout(() => setResult(''), 5000);
      }
    } catch (error) {
      setResult('❌ Erro ao enviar broadcast');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Envio em Massa</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Envie para Múltiplos Contatos</h2>
              <p className="text-gray-600">Mensagens, imagens, áudios ou arquivos</p>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg mb-6 ${result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result}
            </div>
          )}

          <div className="space-y-6">
            {/* Tipo de Mídia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tipo de Conteúdo
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: 'text', label: '📝 Texto' },
                  { value: 'image', label: '🖼️ Imagem' },
                  { value: 'audio', label: '🎵 Áudio' },
                  { value: 'document', label: '📄 Arquivo' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setMediaType(option.value)}
                    className={`p-4 rounded-lg transition-all text-sm font-semibold ${
                      mediaType === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Digite sua mensagem aqui..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {message.length} caracteres
              </p>
            </div>

            {/* Upload de Mídia */}
            {mediaType !== 'text' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Selecionar Arquivo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <label className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      {file ? file.name : 'Clique para selecionar arquivo'}
                    </p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Contatos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Contatos (um por linha)
              </label>
              <textarea
                value={contacts}
                onChange={(e) => setContacts(e.target.value)}
                rows={6}
                placeholder="5511987654321&#10;5511987654322&#10;5511987654323"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                {contacts.split('\n').filter(c => c.trim()).length} contatos
              </p>
            </div>

            {/* Delay */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Intervalo entre Envios (ms)
              </label>
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value))}
                min={100}
                step={100}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Tempo de espera entre cada envio (padrão: 1000ms = 1 segundo)
              </p>
            </div>

            {/* Botão Enviar */}
            <button
              onClick={handleSendBroadcast}
              disabled={loading}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {loading ? 'Enviando...' : `Enviar para ${contacts.split('\n').filter(c => c.trim()).length} contatos`}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Dicas</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Use formato internacional: 55 + DDD + número</li>
              <li>• O intervalo evita bloqueio automático do WhatsApp</li>
              <li>• Máximo 1000 contatos por envio</li>
              <li>• Combine texto + mídia para maior impacto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
