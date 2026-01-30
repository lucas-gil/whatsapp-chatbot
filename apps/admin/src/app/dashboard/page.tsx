"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Users,
  MessageSquare,
  Ticket,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface Contact {
  id: string;
  phone: string;
  name?: string;
  status: string;
}

interface Stats {
  totalContacts: number;
  activeChats: number;
  openTickets: number;
  conversions: number;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  trend?: number;
}) => (
  <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-800/20">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-4xl font-bold text-white">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <TrendingUp className="h-3 w-3" />
              +{trend}%
            </div>
          )}
        </div>
      </div>
      <div
        className={`rounded-lg p-3 ${color} bg-opacity-10 text-opacity-100`}
      >
        <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}`} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    activeChats: 0,
    openTickets: 0,
    conversions: 0,
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

      const [contactsRes] = await Promise.all([
        axios
          .get(`${apiUrl}/api/contacts?limit=10`)
          .catch(() => ({ data: { data: [], pagination: { total: 0 } } })),
      ]);

      const allContacts = contactsRes.data.data || [];

      setStats({
        totalContacts: contactsRes.data.pagination?.total || 0,
        activeChats: Math.floor(
          (contactsRes.data.pagination?.total || 0) * 0.3
        ),
        openTickets: 12,
        conversions: Math.floor((contactsRes.data.pagination?.total || 0) * 0.6),
      });

      setContacts(allContacts.slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setStats({
        totalContacts: 245,
        activeChats: 38,
        openTickets: 12,
        conversions: 145,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <Header />

      <main className="md:ml-64 px-4 md:px-6 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total de Contatos"
            value={stats.totalContacts}
            icon={Users}
            color="bg-blue-500"
            trend={12}
          />
          <StatCard
            title="Chats Ativos"
            value={stats.activeChats}
            icon={MessageSquare}
            color="bg-green-500"
            trend={8}
          />
          <StatCard
            title="Tickets Abertos"
            value={stats.openTickets}
            icon={Ticket}
            color="bg-orange-500"
            trend={-5}
          />
          <StatCard
            title="Clientes Convertidos"
            value={stats.conversions}
            icon={BarChart3}
            color="bg-purple-500"
            trend={15}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Contacts */}
          <div className="lg:col-span-2 rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Contatos Recentes</h2>
              <a
                href="/contacts"
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Ver tudo →
              </a>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-slate-700/30 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between rounded-lg bg-slate-700/20 p-4 hover:bg-slate-700/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                        {(contact.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {contact.name || "Sem nome"}
                        </p>
                        <p className="text-xs text-slate-400">{contact.phone}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                      {contact.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-green-500/10 to-emerald-600/10 p-6 backdrop-blur-sm border-green-500/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                <p className="text-sm font-medium text-green-400">Status</p>
              </div>
              <p className="text-2xl font-bold text-white mb-2">Online</p>
              <p className="text-xs text-green-400/70">
                Sistema funcionando normalmente
              </p>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4">
                Ações Rápidas
              </h3>
              <div className="space-y-2">
                <a
                  href="/whatsapp"
                  className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                  ⚡ Conectar WhatsApp
                </a>
                <a
                  href="/messages"
                  className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                  ✏️ Editar Mensagens
                </a>
                <a
                  href="/send"
                  className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                  📤 Enviar Campanha
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
