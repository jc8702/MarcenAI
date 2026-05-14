// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "D'Luxury - Gesto Comercial",
  description: "Sistema de Gesto de Estoque e Oramentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
