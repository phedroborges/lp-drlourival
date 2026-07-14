import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";

// Texto corrido: fonte limpa e arredondada, combina com a marca
const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// Títulos: gorda e arredondada como as letras do adesivo (inclinação via CSS)
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
      className={`${kanit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
