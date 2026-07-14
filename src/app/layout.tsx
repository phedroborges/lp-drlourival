import type { Metadata } from "next";
import { Nunito, Baloo_2 } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";

// Texto corrido: fonte limpa e arredondada, combina com a marca
const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Títulos: gorda e arredondada como as letras do adesivo (inclinação via CSS)
const baloo = Baloo_2({
  variable: "--font-display",
  weight: ["700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.nome} — Tô Junto | Saúde de verdade para o interior de Goiás`,
  description: site.descricao,
  openGraph: {
    title: `Tô Junto com ${site.nome}`,
    description: site.descricao,
    url: site.url,
    siteName: site.nome,
    locale: "pt_BR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${nunito.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
