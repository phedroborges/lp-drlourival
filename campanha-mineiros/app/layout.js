import "./globals.css";
import "leaflet/dist/leaflet.css";
import AppFrame from "./AppFrame";
import { getUsuario } from "@/lib/supabaseServer";
import { Kanit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

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

export default async function RootLayout({ children }) {
  const usuario = await getUsuario();
  return (
    <html lang="pt-BR" className={kanit.variable}>
      <body suppressHydrationWarning>
        <TooltipProvider delayDuration={200}>
          <AppFrame email={usuario?.email ?? null} admin={usuario?.admin === true}>{children}</AppFrame>
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
