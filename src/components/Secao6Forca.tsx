import { site, hrefGrupo } from "@/config/site";
import { Reveal } from "@/components/ui/Reveal";
import { Batimento } from "@/components/ui/Batimento";

/**
 * SEÇÃO 6 — A FORÇA. Os aliados.
 * Faixa azul royal (cor de estrutura da marca). Arte dos três pontos
 * (Mineiros, Goiânia, Brasília) conectados pela linha de batimento,
 * que se desenha na rolagem.
 * 🖼️🔍 Se surgir foto do Dr. com o Gláustin, ela substitui a arte.
 */

const pontos = [
  { nome: "Mineiros", papel: "Onde a luta nasce" },
  { nome: "Goiânia", papel: "Assembleia Legislativa" },
  { nome: "Brasília", papel: "Congresso Nacional" },
];

export function Secao6Forca() {
  return (
    <section className="bg-azul text-creme py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <Reveal>
          <h2 className="titulo-impacto text-3xl sm:text-4xl md:text-5xl text-center">
            Briga grande se ganha com{" "}
            <span className="placa text-[0.9em]">aliado forte.</span>
          </h2>
        </Reveal>

        {/* Arte dos três pontos conectados pelo batimento */}
        <Reveal delay={100}>
          <div className="mt-14 relative">
            <Batimento
              className="absolute top-[7px] left-[16%] right-[16%] w-[68%] h-8 opacity-80"
              cor="var(--amarelo)"
            />
            <div className="relative grid grid-cols-3 gap-2 text-center">
              {pontos.map((p) => (
                <div key={p.nome}>
                  <span className="mx-auto block w-5 h-5 rounded-full bg-amarelo border-4 border-azul-escuro shadow" />
                  <p className="mt-3 titulo-impacto text-lg sm:text-xl">
                    {p.nome}
                  </p>
                  <p className="text-xs sm:text-sm text-creme/70 font-semibold">
                    {p.papel}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-12 space-y-6 leading-relaxed text-base sm:text-lg text-creme/90 max-w-2xl mx-auto">
          <Reveal>
            <p>
              Tem coisa que se resolve na Assembleia, em Goiânia. Tem coisa que
              só se resolve em Brasília. Por isso já caminhamos junto com o
              deputado federal Gláustin da Fokus, que lidera no Congresso a
              causa das crianças autistas e a luta pela licença de 6 meses.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="titulo-impacto text-xl sm:text-2xl text-amarelo text-center">
              O interior com voz na Assembleia e amigos no Congresso.
              <br />É assim que promessa vira entrega.
            </p>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div className="mt-12 text-center">
            <a
              href={hrefGrupo()}
              className="inline-block rounded-full bg-laranja hover:bg-laranja-escuro text-creme titulo-impacto text-lg sm:text-xl px-9 py-4 transition-colors shadow-lg shadow-black/20"
            >
              {site.ctaJunto}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
