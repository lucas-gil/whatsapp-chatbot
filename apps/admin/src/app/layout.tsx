import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin - IPTV Chatbot",
  description: "Painel de controle do chatbot WhatsApp para IPTV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-slate-950 text-white">{children}</body>
    </html>
  );
}
