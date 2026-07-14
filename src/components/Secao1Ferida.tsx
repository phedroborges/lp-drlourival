import { site, hrefGrupo } from "@/config/site";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

/**
 * SEÇÃO 1 — A FERIDA. Primeira tela, o soco.
 * Fundo amarelo do adesivo (tema claro), título entra palavra por palavra
 * em azul, "Cidade Saúde." na placa laranja. O Dr. NÃO aparece.
 * A foto P&B do Samaritano entra como retrato inclinado, estilo lembrança.
 */

const linha1 = "Tiraram de Mineiros o nome que era nosso.".split(" ");

function Palavras({
  palavras,
  inicio,
}: {
  palavras: string[];
  inicio: number;
}) {
  return (
    <>
      {palavras.map((p, i) => (
        <span
          key={i}
          className="palavra"
          style={{ animationDelay: `${(inicio + i) * 0.15}s` }}
        >
          {p}
          {i < palavras.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export function Secao1Ferida() {
  const delayPlaca = (1 + linha1.length + 1) * 0.15;

  return (
    <section
      id="topo"
      className="relative min-h-svh flex flex-col justify-center overflow-hidden bg-amarelo"
    >
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 pb-20 grid gap-10 md:grid-cols-2 md:items-center">
        {/* Texto */}
        <div className="text-center md:text-left">
          <h1 className="titulo-impacto text-[2.6rem] leading-[1.06] sm:text-5xl md:text-6xl text-azul">
            <Palavras palavras={linha1} inicio={1} />
            <span
              className="palavra mt-3 block"
              style={{ animationDelay: `${delayPlaca}s` }}
            >
              <span className="placa text-[0.95em]">Cidade Saúde.</span>
            </span>
          </h1>

          <p
            className="palavra mt-7 text-lg sm:text-xl text-azul/80 font-semibold max-w-md mx-auto md:mx-0 leading-relaxed"
            style={{ animationDelay: `${delayPlaca + 0.5}s` }}
          >
            E pelo interior de Goiás, tem cidade que nunca chegou nem a saber o
            que isso significa.
          </p>

          <div
            className="palavra mt-9"
            style={{ animationDelay: `${delayPlaca + 0.8}s` }}
          >
            <a
              href={hrefGrupo()}
              className="inline-block rounded-full bg-laranja hover:bg-laranja-escuro text-creme titulo-impacto text-lg sm:text-xl px-9 py-4 transition-colors shadow-lg shadow-laranja/40"
            >
              {site.ctaJunto}
            </a>
          </div>
        </div>

        {/* Retrato P&B do Samaritano — 🖼️🔍 equipe fotografa em Mineiros */}
        <div
          className="palavra mx-auto w-full max-w-sm"
          style={{ animationDelay: `${delayPlaca + 0.3}s` }}
        >
          <div className="rotate-2 rounded-2xl bg-white p-3 pb-10 shadow-xl shadow-azul/15">
            <ImagePlaceholder
              legenda="Fachada atual do Hospital Samaritano fechado — tratar em preto e branco (equipe fotografa em Mineiros)"
              className="aspect-[4/3] w-full rounded-lg text-tinta/60 bg-neutral-200 grayscale"
            />
            <p className="mt-3 text-center text-sm text-tinta/50 italic">
              O Samaritano, hoje.
            </p>
          </div>
        </div>
      </div>

      {/* Seta discreta de rolagem */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="seta-rolagem text-azul/60"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
