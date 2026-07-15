import "./globals.css";
import "leaflet/dist/leaflet.css";
import Nav from "./Nav";
import { Kanit } from "next/font/google";

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-kanit",
});

export const metadata = {
  title: "Dados da Campanha — Dr. Lourival",
  description: "Coordenação territorial, lideranças, cabos e rotas da campanha em Goiás",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={kanit.variable}>
      <body>
        <div className="app">
          <Nav />
          <div className="workspace-shell">
            <header className="app-topbar">
              <div><span className="topbar-dot" /><strong>Central de dados</strong></div>
              <div className="topbar-actions"><span>Atualização em tempo real</span><span className="topbar-avatar">DL</span></div>
            </header>
            <div className="main">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
