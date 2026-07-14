import { Reveal } from "@/components/ui/Reveal";
import { Batimento } from "@/components/ui/Batimento";

/**
 * SEÇÃO 5 — A RECEITA. As propostas como prescrição médica.
 * Fundo amarelo contínuo (vem do amanhecer da seção 4). Seis folhas de
 * receituário brancas com carimbo "Dr. Lourival Lobo • Pediatra".
 * No celular deslizam na horizontal; no desktop, grade.
 */

// Ícones dos 6 cards (🖼️🔍 versões finais virão da identidade —
// estes são traçados provisórios já na linha da marca)
const icones = {
  hospital: <path d="M3 21V8l9-5 9 5v13M9 21v-6h6v6M12 9v4M10 11h4" />,
  estetoscopio: (
    <path d="M5 3v6a5 5 0 0 0 10 0V3M8 3v2M12 3v2M17.5 14a2.5 2.5 0 1 0 0 .01M17.5 16.5V17a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5v-2" />
  ),
  incubadora: (
    <path d="M4 14h16M6 14a6 6 0 0 1 12 0M12 5v3M4 18h16M7 21v-3M17 21v-3" />
  ),
  onibus: (
    <path d="M4 6h16v10H4zM4 11h16M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01M8 6V4h8v2" />
  ),
  maeBebe: (
    <path d="M9 5a2.5 2.5 0 1 0 0-.01M15.5 9.5a2 2 0 1 0 0-.01M6 21v-6a4 4 0 0 1 4-4h1M18 21v-4a3 3 0 0 0-3-3h-1" />
  ),
  quebraCabeca: (
    <path d="M10 4h4v3a2 2 0 1 0 4 0h3v4h-3a2 2 0 1 0 0 4h3v4h-4v-3a2 2 0 1 0-4 0v3H9v-3a2 2 0 1 1 0-4H6v-4h3a2 2 0 1 1 1-4z" />
  ),
};

const propostas: Array<{
  icone: keyof typeof icones;
  titulo: string;
  texto: string;
}> = [
  {
    icone: "hospital",
    titulo: "Saúde forte no interior",
    texto:
      "Chega de concentrar tudo nos grandes centros. Cada região de Goiás com estrutura de verdade para cuidar do seu povo.",
  },
  {
    icone: "estetoscopio",
    titulo: "Especialista na UPA",
    texto:
      "Pai que chega com filho doente vai encontrar pediatra e especialista de plantão. Urgência é lugar de resolver, não de encaminhar.",
  },
  {
    icone: "incubadora",
    titulo: "UTI para recém-nascidos",
    texto:
      "Bebê que nasce com complicação vai ser cuidado perto da família. Nenhuma mãe do interior refém de uma transferência.",
  },
  {
    icone: "onibus",
    titulo: "Transporte para chegar no médico",
    texto:
      "Gestante do interior com jeito de fazer o pré-natal e o pós-parto. Consulta marcada é consulta alcançada.",
  },
  {
    icone: "maeBebe",
    titulo: "Licença maternidade de 6 meses",
    texto:
      "A ciência manda 6 meses. A lei dá 4. Essa conta quem paga é o bebê, e nós vamos brigar para mudar isso.",
  },
  {
    icone: "quebraCabeca",
    titulo: "Casa do Autista",
    texto:
      "Terapia de graça e equipe especializada para as crianças atípicas, começando por onde hoje não existe nada.",
  },
];

function CardReceita({
  proposta,
  delay,
  girado,
}: {
  proposta: (typeof propostas)[number];
  delay: number;
  girado: boolean;
}) {
  return (
    <Reveal
      delay={delay}
      className="w-72 shrink-0 snap-center md:w-auto md:shrink"
    >
      {/* Folha de receituário */}
      <article
        className={`h-full flex flex-col rounded-xl bg-white shadow-lg shadow-azul/10 overflow-hidden ${
          girado ? "md:rotate-1" : "md:-rotate-1"
        }`}
      >
        {/* Cabeçalho da folha */}
        <div className="border-b-2 border-dashed border-azul/20 px-5 pt-5 pb-3 flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-laranja/12 flex items-center justify-center text-laranja">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {icones[proposta.icone]}
            </svg>
          </span>
          <span className="titulo-impacto text-azul/50 text-xs tracking-widest">
            RECEITUÁRIO
          </span>
        </div>

        <div className="px-5 py-4 flex-1">
          <h3 className="titulo-impacto text-azul text-xl leading-snug">
            {proposta.titulo}
          </h3>
          <p className="mt-2 text-sm text-tinta/80 leading-relaxed">
            {proposta.texto}
          </p>
        </div>

        {/* Carimbo no rodapé da folha */}
        <div className="px-5 pb-4">
          <span className="inline-block -rotate-2 border-2 border-azul/40 text-azul/60 text-[10px] font-extrabold tracking-widest uppercase rounded-md px-2 py-1">
            Dr. Lourival Lobo • Pediatra
          </span>
        </div>
      </article>
    </Reveal>
  );
}

export function Secao5Receita() {
  return (
    <section className="bg-amarelo py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <h2 className="titulo-impacto text-3xl sm:text-4xl md:text-5xl text-azul">
            Vou trazer a <span className="placa text-[0.9em]">Cidade Saúde</span>{" "}
            de volta.
          </h2>
          <p className="mt-5 text-azul/80 font-bold text-lg sm:text-xl">
            E saúde de verdade para o interior de Goiás. A receita está pronta.
          </p>
        </Reveal>

        {/* Celular: carrossel horizontal. Desktop: grade 3x2 */}
        <div className="mt-12 flex gap-5 overflow-x-auto sem-scrollbar snap-x snap-mandatory pb-4 -mx-5 px-5 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:mx-0 md:px-0 md:pb-0">
          {propostas.map((p, i) => (
            <CardReceita
              key={p.titulo}
              proposta={p}
              delay={i * 80}
              girado={i % 2 === 0}
            />
          ))}
        </div>

        <Reveal className="mt-16 text-center">
          <p className="titulo-impacto text-2xl sm:text-3xl text-azul">
            E Mineiros volta a ser o que sempre foi.
            <br />
            <span className="placa mt-2 text-[0.85em]">
              A prova de que o interior consegue.
            </span>
          </p>
          <Batimento
            className="mt-10 mx-auto w-full max-w-md h-10"
            cor="var(--azul)"
          />
        </Reveal>
      </div>
    </section>
  );
}
