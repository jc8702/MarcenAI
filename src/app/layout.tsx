// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D'Luxury - Gestão Comercial",
  description: "Sistema de Gestão de Estoque e Orçamentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-dark">
        {children}
      </body>
    </html>
  );
}
