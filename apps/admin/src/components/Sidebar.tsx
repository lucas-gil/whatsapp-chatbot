"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Zap,
  Package,
  Bot,
} from "lucide-react";

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/product", label: "Configurar Produto", icon: Package },
    { href: "/settings", label: "Configurações", icon: Settings },
    { href: "/whatsapp", label: "WhatsApp Business", icon: Zap },
    { href: "/messages", label: "Mensagens", icon: MessageSquare },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 md:hidden"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-gradient-to-b from-slate-950 to-slate-900 transition-transform duration-300 ease-in-out border-r border-slate-700/50 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-slate-700/50 px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  IPTV Bot
                </h1>
                <p className="text-xs text-slate-400">v1.0.0</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                  isActive(href)
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-l-2 border-green-400"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-700/50 p-4 space-y-2">
            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-800/50 hover:text-white">
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
            <div className="px-4 py-3 text-xs text-slate-500">
              © 2024 IPTV Chatbot
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
