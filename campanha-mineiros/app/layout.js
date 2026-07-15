import "./globals.css";
import "leaflet/dist/leaflet.css";
import AppFrame from "./AppFrame";
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
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
