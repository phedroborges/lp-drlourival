import "./globals.css";
import Nav from "./Nav";
import { Kanit } from "next/font/google";

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-kanit",
});

export const metadata = {
  title: "Campanha Mineiros — Lideranças e Cabos",
  description: "Gestão de lideranças e cabos eleitorais por bairro em Mineiros/GO",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={kanit.variable}>
      <body>
        <div className="app">
          <Nav />
          <div className="main">{children}</div>
        </div>
      </body>
    </html>
  );
}
