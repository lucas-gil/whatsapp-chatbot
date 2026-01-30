'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MessageSquare, Save, X, Plus, Edit2, Trash2, Upload, Check, AlertCircle, Send, ArrowUp, ArrowDown } from 'lucide-react';

interface Message {
  id: string;
  title: string;
  content: string;
  image: string;
  buttons: { id: string; label: string; response: string; nextMessage?: string }[];
  edited: boolean;
}

const defaultMessages: Message[] = [
  {
    id: 'msg-1',
    title: 'Boas Vindas',
    content: '👋 Olá! Bem-vindo ao nosso serviço de IPTV. Como posso ajudá-lo?',
    image: '',
    buttons: [
      { id: 'btn-1', label: 'Ver Planos', response: 'Mostrando os planos disponíveis...', nextMessage: 'Qual plano te interessa?' },
      { id: 'btn-2', label: 'Suporte', response: 'Conectando com suporte...', nextMessage: 'Suporte Técnico' },
      { id: 'btn-3', label: 'Promoções', response: 'Confira nossas promoções especiais!', nextMessage: 'Qual plano te interessa?' },
    ],
    edited: false,
  },
  {
    id: 'msg-2',
    title: 'Qual plano te interessa?',
    content: 'Escolha um dos nossos incríveis planos de IPTV:',
    image: '',
    buttons: [
      { id: 'btn-4', label: 'Plano Basic - R$ 49,90', response: 'Você escolheu o Plano Basic' },
      { id: 'btn-5', label: 'Plano Plus - R$ 79,90', response: 'Você escolheu o Plano Plus' },
      { id: 'btn-6', label: 'Plano Premium - R$ 129,90', response: 'Você escolheu o Plano Premium' },
    ],
    edited: false,
  },
  {
    id: 'msg-3',
    title: 'Forma de Pagamento',
    content: 'Como você prefere pagar?',
    image: '',
    buttons: [
      { id: 'btn-7', label: 'Débito', response: 'Pagamento por débito selecionado' },
      { id: 'btn-8', label: 'Crédito', response: 'Pagamento por crédito selecionado' },
      { id: 'btn-9', label: 'PIX', response: 'Pagamento por PIX selecionado' },
    ],
    edited: false,
  },
  {
    id: 'msg-4',
    title: 'FAQ - Perguntas Frequentes',
    content: 'Selecione uma pergunta para obter mais informações:',
    image: '',
    buttons: [
      { id: 'btn-10', label: 'Como ativar?', response: 'Você será redirecionado para o passo a passo de ativação' },
      { id: 'btn-11', label: 'Compatibilidade', response: 'Funcionamos em Smart TV, celular, tablet e computador' },
      { id: 'btn-12', label: 'Cancelamento', response: 'Para cancelar, entre em contato com nosso suporte' },
    ],
    edited: false,
  },
  {
    id: 'msg-5',
    title: 'Suporte Técnico',
    content: '🆘 Está com algum problema? Estamos aqui para ajudar!',
    image: '',
    buttons: [
      { id: 'btn-13', label: 'Problema de Acesso', response: 'Vou ajudar você a recuperar o acesso' },
      { id: 'btn-14', label: 'Qualidade de Imagem', response: 'Dicas para melhorar a qualidade' },
      { id: 'btn-15', label: 'Outro Problema', response: 'Descreva seu problema para nos ajudar' },
    ],
    edited: false,
  },
  {
    id: 'msg-6',
    title: 'Promoção Especial',
    content: '🎉 Aproveite nossas promoções especiais este mês!',
    image: '',
    buttons: [
      { id: 'btn-16', label: 'Desconto Anual', response: 'Desconto de 20% em planos anuais!' },
      { id: 'btn-17', label: 'Teste Grátis', response: 'Teste 7 dias gratuitamente' },
      { id: 'btn-18', label: 'Indicação', response: 'Indique um amigo e ganhe créditos' },
    ],
    edited: false,
  },
  {
    id: 'msg-7',
    title: 'Informações do Plano',
    content: 'Confira os detalhes dos nossos planos:',
    image: '',
    buttons: [
      { id: 'btn-19', label: 'Canais Disponíveis', response: 'Plano Basic: 100 canais / Plus: 300 canais / Premium: 800 canais' },
      { id: 'btn-20', label: 'Qualidade de Vídeo', response: 'Todos os planos suportam Full HD e algumas streams em 4K' },
      { id: 'btn-21', label: 'Compatibilidade', response: 'Compatível com todos os dispositivos modernos' },
    ],
    edited: false,
  },
  {
    id: 'msg-8',
    title: 'Confirmação de Pedido',
    content: '✅ Seu pedido foi confirmado! Obrigado por escolher nosso serviço.',
    image: '',
    buttons: [
      { id: 'btn-22', label: 'Baixar App', response: 'Enviando link para download' },
      { id: 'btn-23', label: 'Tutorial', response: 'Acessando tutorial de instalação' },
      { id: 'btn-24', label: 'Voltar ao Menu', response: 'Retornando ao menu principal' },
    ],
    edited: false,
  },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(defaultMessages[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Message | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clickedButtonId, setClickedButtonId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const cleanSessionId = (id?: string) => {
    if (!id) return '';
    return id;
  };

  const buildMessageText = (msg: Message) => {
    const base = `${msg.title}\n${msg.content}`.trim();
    if (!msg.buttons?.length) return base;
    const buttons = msg.buttons.map((btn, idx) => `${idx + 1}. ${btn.label}`).join('\n');
    return `${base}\n\nOpções:\n${buttons}`;
  };

  const syncMessages = async (nextMessages: Message[]) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/bot/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar mensagens no servidor');
      }
    } catch (error) {
      setMessage({ type: 'error', text: `✗ Erro ao aplicar no bot: ${error instanceof Error ? error.message : 'Desconhecido'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const loadRemoteMessages = async () => {
      try {
        const response = await fetch('/api/bot/messages');
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length) {
          setMessages(data.messages);
          setSelectedMsg(data.messages[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens do bot:', error);
      }
    };

    loadRemoteMessages();
  }, []);

  const handleEdit = (msg: Message) => {
    setSelectedMsg(msg);
    setEditData({ ...msg });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editData) {
      const nextMessages = messages.map(m => (m.id === editData.id ? editData : m));
      setMessages(nextMessages);
      setSelectedMsg(editData);
      setIsEditing(false);
      setMessage({ type: 'success', text: '✓ Mensagem salva com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
      syncMessages(nextMessages);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (editData) {
          setEditData({ ...editData, image: evt.target?.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddButton = () => {
    if (editData && editData.buttons.length < 10) {
      setEditData({
        ...editData,
        buttons: [...editData.buttons, { id: `btn-${Date.now()}`, label: 'Novo Botão', response: '' }],
      });
    }
  };

  const handleUpdateButton = (btnId: string, updates: any) => {
    if (editData) {
      setEditData({
        ...editData,
        buttons: editData.buttons.map(b => (b.id === btnId ? { ...b, ...updates } : b)),
      });
    }
  };

  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
      const newMessages = [...messages];
      if (direction === 'up' && index > 0) {
          [newMessages[index], newMessages[index - 1]] = [newMessages[index - 1], newMessages[index]];
      } else if (direction === 'down' && index < newMessages.length - 1) {
          [newMessages[index], newMessages[index + 1]] = [newMessages[index + 1], newMessages[index]];
      }
      setMessages(newMessages);
      syncMessages(newMessages);
  };

  const handleDeleteButton = (btnId: string) => {
    if (editData && editData.buttons.length > 1) {
      setEditData({
        ...editData,
        buttons: editData.buttons.filter(b => b.id !== btnId),
      });
    }
  };

  const handleAddMessage = () => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      title: 'Nova Mensagem',
      content: 'Descrição da mensagem',
      image: '',
      buttons: [{ id: `btn-${Date.now()}`, label: 'Opção 1', response: '' }],
      edited: false,
    };
    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setSelectedMsg(newMsg);
    setIsEditing(true);
    setEditData(newMsg);
    setMessage({ type: 'success', text: '✓ Nova mensagem criada! Edite os detalhes.' });
    setTimeout(() => setMessage(null), 3000);
    syncMessages(nextMessages);
  };

  const handleDeleteMessage = (id: string) => {
    const filtered = messages.filter(m => m.id !== id);
    setMessages(filtered);
    setSelectedMsg(filtered[0] || null);
    syncMessages(filtered);
  };

  const handleSendToClient = async () => {
    if (!selectedMsg) {
      setMessage({ type: 'error', text: '✗ Selecione uma mensagem para enviar.' });
      return;
    }

    if (!targetPhone.trim()) {
      setMessage({ type: 'error', text: '✗ Informe o número do cliente.' });
      return;
    }

    const rawSession = localStorage.getItem('whatsappSession');
    if (!rawSession) {
      setMessage({ type: 'error', text: '✗ WhatsApp não conectado.' });
      return;
    }

    let sessionId = '';
    try {
      const parsed = JSON.parse(rawSession);
      sessionId = cleanSessionId(parsed?.sessionId);
    } catch (error) {
      sessionId = '';
    }

    if (!sessionId) {
      setMessage({ type: 'error', text: '✗ Sessão inválida. Conecte o WhatsApp novamente.' });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          phone: targetPhone.trim(),
          message: buildMessageText(selectedMsg),
          image: selectedMsg.image
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: `✗ ${data.error || 'Erro ao enviar mensagem'}` });
        return;
      }

      setMessage({ type: 'success', text: '✓ Mensagem enviada com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `✗ Erro ao enviar: ${error instanceof Error ? error.message : 'Desconhecido'}` });
    } finally {
      setIsSending(false);
    }
  };

  const handleBroadcast = async () => {
    if (!selectedMsg) {
      setMessage({ type: 'error', text: '✗ Selecione uma mensagem para enviar.' });
      return;
    }

    const rawSession = localStorage.getItem('whatsappSession');
    if (!rawSession) {
      setMessage({ type: 'error', text: '✗ WhatsApp não conectado.' });
      return;
    }

    let sessionId = '';
    try {
      const parsed = JSON.parse(rawSession);
      sessionId = cleanSessionId(parsed?.sessionId);
    } catch (error) {
      sessionId = '';
    }

    if (!sessionId) {
      setMessage({ type: 'error', text: '✗ Sessão inválida. Conecte o WhatsApp novamente.' });
      return;
    }

    setIsBroadcasting(true);
    try {
      const response = await fetch('/api/whatsapp/broadcast-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: buildMessageText(selectedMsg),
          image: selectedMsg.image
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: `✗ ${data.error || 'Erro ao enviar mensagem'}` });
        return;
      }

      setMessage({ type: 'success', text: `✓ Enviado para ${data.sent} clientes (falhas: ${data.failed})` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: `✗ Erro ao enviar: ${error instanceof Error ? error.message : 'Desconhecido'}` });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="w-full h-full p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <MessageSquare size={28} className="text-emerald-500" />
                Editor de Mensagens
              </h1>
              <p className="text-slate-400 text-sm">Crie mensagens com botões que aparecem no WhatsApp</p>
              {isSyncing && <p className="text-emerald-400 text-xs mt-2">Aplicando alterações no bot...</p>}
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-900/20 border border-red-500/30 text-red-400'
                }`}
              >
                {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-12 gap-6 min-h-[500px]">
              {/* Sidebar - Lista de Mensagens */}
              <div className="col-span-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[700px] overflow-y-auto">
                  <h2 className="text-lg font-bold text-white mb-4 sticky top-0 bg-slate-900 pb-3">📋 Minhas Mensagens</h2>
                  <div className="space-y-2">
                    {messages.map((msg, idx) => (
                      <div key={msg.id} className="flex gap-1 items-center">
                          <div className="flex flex-col gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMoveMessage(idx, 'up'); }}
                                disabled={idx === 0}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                  <ArrowUp size={12} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMoveMessage(idx, 'down'); }}
                                disabled={idx === messages.length - 1}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                  <ArrowDown size={12} />
                              </button>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMsg(msg);
                              setIsEditing(false);
                            }}
                            className={`flex-1 p-3 rounded-lg text-left transition-all duration-200 text-sm ${
                              selectedMsg?.id === msg.id
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <p className="font-semibold">{idx + 1}. {msg.title}</p>
                            <p className="text-xs opacity-75 mt-1">🔘 {msg.buttons.length} botões</p>
                          </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddMessage}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus size={18} />
                    + Nova Mensagem
                  </button>
                </div>
              </div>

              {/* Coluna Central - Editor */}
              <div className="col-span-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-h-[700px] overflow-y-auto">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <h3 className="text-lg font-bold text-white">
                      {isEditing ? '✏️ Editando' : '📝 Detalhes'}
                    </h3>
                    {!isEditing && selectedMsg && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(selectedMsg)}
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(selectedMsg.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 block">Título</label>
                        <p className="text-white font-semibold">{selectedMsg?.title}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 block">Descrição</label>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{selectedMsg?.content}</p>
                      </div>
                      {selectedMsg?.image && (
                        <div>
                          <label className="text-xs font-medium text-slate-400 mb-2 block">Imagem</label>
                          <img src={selectedMsg.image} alt="preview" className="w-full rounded-lg border border-slate-700 max-h-32 object-cover" />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-2 block">Botões ({selectedMsg?.buttons.length}/10)</label>
                        <div className="space-y-2">
                          {selectedMsg?.buttons.map((btn, idx) => (
                            <div key={btn.id} className="px-3 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded text-xs text-emerald-300">
                              <p className="font-medium">{idx + 1}. {btn.label}</p>
                              <p className="text-slate-400 mt-1">↳ {btn.response}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-300 mb-1 block">Título</label>
                        <input
                          type="text"
                          value={editData?.title || ''}
                          onChange={e => setEditData({ ...editData!, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 mb-1 block">Descrição</label>
                        <textarea
                          value={editData?.content || ''}
                          onChange={e => setEditData({ ...editData!, content: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 mb-1 block">Imagem</label>
                        <label className="flex items-center justify-center gap-2 px-3 py-3 bg-slate-800 border-2 border-dashed border-slate-700 rounded cursor-pointer hover:border-emerald-500 transition-colors">
                          <Upload size={16} className="text-slate-400" />
                          <span className="text-xs text-slate-400">Clique para enviar</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        {editData?.image && (
                          <button
                            onClick={() => setEditData({ ...editData, image: '' })}
                            className="mt-2 text-xs text-red-400 hover:text-red-300"
                          >
                            Remover imagem
                          </button>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-slate-300">Botões ({editData?.buttons.length}/10)</label>
                          <button
                            onClick={handleAddButton}
                            disabled={!editData || editData.buttons.length >= 10}
                            className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded transition-colors"
                          >
                            <Plus size={12} className="inline mr-1" /> Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {editData?.buttons.map((btn, idx) => (
                            <div key={btn.id} className="space-y-1.5 p-2 bg-slate-800 rounded border border-slate-700">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={btn.label}
                                  onChange={e => handleUpdateButton(btn.id, { label: e.target.value })}
                                  placeholder={`Botão ${idx + 1}`}
                                  className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:border-emerald-500 outline-none"
                                />
                                <button
                                  onClick={() => handleDeleteButton(btn.id)}
                                  disabled={editData.buttons.length <= 1}
                                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 disabled:bg-slate-600 text-red-400 rounded text-xs"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <textarea
                                value={btn.response}
                                onChange={e => handleUpdateButton(btn.id, { response: e.target.value })}
                                placeholder="Resposta do cliente"
                                rows={2}
                                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:border-emerald-500 outline-none resize-none"
                              />
                              
                              <div className="pt-1 border-t border-slate-700/50">
                                <label className="text-[10px] text-slate-400 mb-1 block">Ao clicar, ir para:</label>
                                <select
                                  value={btn.nextMessage || ''}
                                  onChange={e => handleUpdateButton(btn.id, { nextMessage: e.target.value })}
                                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:border-emerald-500 outline-none"
                                >
                                  <option value="">(Encerrar conversa)</option>
                                  {messages
                                    .filter(m => m.id !== editData.id) // Evitar loop direto para si mesmo (opcional, mas bom UX)
                                    .map(m => (
                                    <option key={m.id} value={m.title}>
                                      ➜ {m.title}
                                    </option>
                                  ))}
                                </select>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-700">
                        <button
                          onClick={handleSave}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium"
                        >
                          <Save size={14} />
                          Salvar
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita - Preview */}
              {!isEditing && (
                <div className="col-span-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
                    <h3 className="text-lg font-bold text-white mb-3">📤 Enviar para cliente</h3>
                    <label className="text-xs text-slate-400">Número do cliente</label>
                    <input
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      placeholder="Ex: 5511999999999"
                      className="w-full mt-1 mb-3 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleSendToClient}
                      disabled={isSending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      {isSending ? 'Enviando...' : 'Enviar mensagem'}
                    </button>
                    <p className="text-xs text-slate-500 mt-2">O envio usa a sessão WhatsApp conectada.</p>
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <button
                        onClick={handleBroadcast}
                        disabled={isBroadcasting}
                        className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Send size={16} />
                        {isBroadcasting ? 'Enviando para todos...' : 'Enviar para todos que já falaram'}
                      </button>
                      <p className="text-xs text-slate-500 mt-2">Envia para todos os clientes que já enviaram mensagem.</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-h-[700px] overflow-y-auto flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4">📱 Preview WhatsApp</h3>
                    <div className="flex justify-center flex-1">
                      <div 
                        className="bg-gradient-to-b from-slate-800 to-slate-900 p-2 rounded-3xl border-8 border-slate-700 shadow-2xl"
                        style={{ width: '280px', height: 'fit-content' }}
                      >
                        {/* Barra Superior */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-2xl px-3 py-2 text-center">
                          <p className="text-xs font-semibold text-slate-400">WhatsApp Business</p>
                        </div>

                        {/* Conteúdo */}
                        <div className="bg-slate-900/50 p-3 space-y-2">
                          {/* Mensagem */}
                          <div className="bg-emerald-900/40 rounded-2xl p-3 border border-emerald-500/30">
                            {selectedMsg?.image && (
                              <img
                                src={selectedMsg.image}
                                alt="msg"
                                className="w-full rounded-lg mb-2 max-h-20 object-cover"
                              />
                            )}
                            <p className="text-xs font-bold text-white">{selectedMsg?.title}</p>
                            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{selectedMsg?.content}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {/* Botões */}
                          <div className="pt-1 space-y-2">
                            {selectedMsg?.buttons.map(btn => (
                              <button
                                key={btn.id}
                                onClick={() => setClickedButtonId(clickedButtonId === btn.id ? null : btn.id)}
                                className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold rounded-lg transition-all"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>

                          {/* Resposta do Botão */}
                          {clickedButtonId && selectedMsg?.buttons.find(btn => btn.id === clickedButtonId) && (
                            <div className="mt-2 p-3 bg-slate-800/50 rounded-2xl border border-slate-700">
                              <p className="text-xs text-slate-400 mb-2 font-medium">Sua resposta:</p>
                              <div className="bg-emerald-900/40 rounded-2xl p-3 border border-emerald-500/30">
                                <p className="text-xs text-emerald-100">{selectedMsg.buttons.find(btn => btn.id === clickedButtonId)?.response}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
