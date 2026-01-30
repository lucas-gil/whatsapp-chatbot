"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-slate-300 mb-8">Página não encontrada</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-lg text-white font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
