"use client";

import { Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-700/50 bg-slate-950/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4 md:ml-64">
        <div className="text-slate-400 text-sm">
          Bem-vindo ao seu painel de controle
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-green-400 rounded-full"></span>
          </button>

          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
