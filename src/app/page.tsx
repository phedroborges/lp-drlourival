import { Header } from "@/components/Header";
import { Secao1Ferida } from "@/components/Secao1Ferida";
import { Secao2Memoria } from "@/components/Secao2Memoria";
import { Secao3Diagnostico } from "@/components/Secao3Diagnostico";
import { Secao4Medico } from "@/components/Secao4Medico";
import { Secao5Receita } from "@/components/Secao5Receita";
import { Secao6Forca } from "@/components/Secao6Forca";
import { Secao7Homem } from "@/components/Secao7Homem";
import { Secao8Movimento } from "@/components/Secao8Movimento";
import { Footer } from "@/components/Footer";

/**
 * Landing page de rolagem única — a página é uma consulta médica:
 * a dor (1-3), o médico (4), a receita (5), a força e o lastro (6-7),
 * o tratamento começa (8).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Secao1Ferida />
        <Secao2Memoria />
        <Secao3Diagnostico />
        <Secao4Medico />
        <Secao5Receita />
        <Secao6Forca />
        <Secao7Homem />
        <Secao8Movimento />
      </main>
      <Footer />
    </>
  );
}
