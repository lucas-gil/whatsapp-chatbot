"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  Send,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
} from "lucide-react";
import axios from "axios";

interface Campaign {
  id: string;
  name: string;
  message: string;
  recipients: number;
  status: "pending" | "sending" | "sent" | "failed";
  createdAt: string;
  sentAt?: string;
}

const templates = [
  {
    id: "welcome",
    name: "Boas-vindas",
    message:
      "Olá! 👋 Bem-vindo ao nosso serviço de IPTV!",
  },
  {
    id: "plans",
    name: "Apresentação dos Planos",
    message:
      "Temos 3 planos incríveis:\n📺 Plano Basic - R$ 49,90/mês\n📺 Plano Plus - R$ 79,90/mês\n📺 Plano Premium - R$ 129,90/mês",
  },
  {
    id: "promo",
    name: "Promoção Especial",
    message:
      "🎉 Promoção Especial! 20% de desconto em todos os planos!\nValidade: Apenas esta semana!",
  },
  {
    id: "payment",
    name: "Informações de Pagamento",
    message:
      "Aceitamos:\n💳 Cartão de crédito/débito\n💰 PIX (instantâneo!)\n📄 Boleto bancário",
  },
];

export default function SendPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "c1",
      name: "Boas-vindas Inicial",
      message: "Bem-vindo ao nosso serviço!",
      recipients: 145,
      status: "sent",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: "",
    templateId: "",
    customMessage: "",
    recipientType: "all",
    scheduledFor: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData({ ...formData, customMessage: template.message });
    }
  };

  const handleSend = async () => {
    if (!formData.campaignName || !formData.customMessage) {
      alert("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

      const response = await axios.post(
        `${apiUrl}/api/iptv/send-custom`,
        {
          message: formData.customMessage,
          templateId: selectedTemplate || "custom",
        }
      );

      const newCampaign: Campaign = {
        id: `c${Date.now()}`,
        name: formData.campaignName,
        message: formData.customMessage,
        recipients: formData.recipientType === "all" ? 245 : 50,
        status: formData.scheduledFor ? "pending" : "sending",
        createdAt: new Date().toISOString(),
      };

      setCampaigns([newCampaign, ...campaigns]);
      setShowForm(false);
      setFormData({
        campaignName: "",
        templateId: "",
        customMessage: "",
        recipientType: "all",
        scheduledFor: "",
      });
      setSelectedTemplate("");
    } catch (error) {
      console.error("Erro ao enviar campanha:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (
    status: Campaign["status"]
  ): string => {
    switch (status) {
      case "sent":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "sending":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
    }
  };

  const getStatusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4" />;
      case "sending":
        return <Clock className="h-4 w-4 animate-spin" />;
      case "pending":
        return <Calendar className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Campaign["status"]): string => {
    switch (status) {
      case "sent":
        return "Enviada";
      case "sending":
        return "Enviando";
      case "pending":
        return "Agendada";
      case "failed":
        return "Falha";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <Header />

      <main className="md:ml-64 px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Enviar Mensagens
          </h1>
          <p className="text-slate-400">
            Crie e envie campanhas de mensagens para seus clientes
          </p>
        </div>

        {/* Button to open form */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-medium text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
          >
            <Send className="h-5 w-5" />
            Nova Campanha
          </button>
        )}

        {/* Campaign Form */}
        {showForm && (
          <div className="mb-8 rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                Criar Nova Campanha
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={formData.campaignName}
                  onChange={(e) =>
                    setFormData({ ...formData, campaignName: e.target.value })
                  }
                  placeholder="Ex: Promoção de Verão"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Selecionar Template (Opcional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`rounded-lg border p-3 text-left text-xs font-medium transition-all ${
                        selectedTemplate === template.id
                          ? "border-green-500/50 bg-green-500/10 text-green-400"
                          : "border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conteúdo da Mensagem
                </label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, customMessage: e.target.value })
                  }
                  rows={6}
                  placeholder="Digite sua mensagem aqui..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {formData.customMessage.length} caracteres
                </p>
              </div>

              {/* Recipients */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Destinatários
                  </label>
                  <select
                    value={formData.recipientType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipientType: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                  >
                    <option value="all">Todos os contatos (245)</option>
                    <option value="active">Contatos ativos (145)</option>
                    <option value="inactive">Contatos inativos (100)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Agendar para
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledFor: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 font-medium text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Agora
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex items-center justify-center rounded-lg border border-slate-600 px-4 py-3 font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Histórico de Campanhas
          </h2>

          {campaigns.length === 0 ? (
            <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm text-center">
              <p className="text-slate-400">Nenhuma campanha enviada ainda</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 backdrop-blur-sm hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">
                      {campaign.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(campaign.createdAt).toLocaleDateString("pt-BR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(
                      campaign.status
                    )}`}
                  >
                    {getStatusIcon(campaign.status)}
                    {getStatusLabel(campaign.status)}
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                  {campaign.message}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {campaign.recipients} destinatários
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {campaign.message.length} caracteres
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
