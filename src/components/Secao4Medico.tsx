import { site, hrefGrupo } from "@/config/site";
import { Reveal } from "@/components/ui/Reveal";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { IconeWhatsApp } from "@/components/ui/IconeWhatsApp";

/**
 * SEÇÃO 4 — ENTRA O MÉDICO. Momento visual mais importante do site.
 * A virada: o branco frio do diagnóstico esquenta para o amarelo da marca,
 * como sol nascendo. Primeira foto colorida da página: o Dr. de jaleco.
 */
export function Secao4Medico() {
  return (
    <section
      style={{
        // O amanhecer da marca: branco → creme → amarelo
        background:
          "linear-gradient(180deg, #ffffff 0%, #f7f2dc 30%, #ffe9a8 65%, #ffc61b 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl px-5 py-20 md:py-28 grid gap-12 md:grid-cols-2 md:items-center">
        {/* A foto mais importante do site — 🖼️🔍 colorida, de jaleco */}
        <Reveal>
          <div className="mx-auto max-w-sm -rotate-2 rounded-2xl bg-white p-3 pb-8 shadow-2xl shadow-laranja/20">
            <ImagePlaceholder
              legenda="Foto do Dr. de jaleco no consultório, olhando para a câmera, luz natural, COLORIDA — a foto mais importante do site"
              className="aspect-[4/5] w-full rounded-lg text-tinta/60 bg-neutral-200"
            />
            <p className="mt-3 text-center text-sm text-tinta/60 italic">
              Dr. Lourival Lobo, pediatra em Mineiros
            </p>
          </div>
        </Reveal>

        <div className="space-y-6 leading-relaxed text-base sm:text-lg">
          <Reveal>
            <h2 className="titulo-impacto text-3xl sm:text-4xl md:text-[2.7rem] text-azul">
              Eu não li sobre essa dor.{" "}
              <span className="placa text-[0.88em]">
                Eu atendo ela todos os dias.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p>
              Sou o Dr. Lourival, médico pediatra em Mineiros há mais de 20
              anos. Toda semana entra no meu consultório uma mãe carregando
              junto do filho tudo aquilo que você acabou de ler. O plantão sem
              especialista. A viagem atrás de socorro. A conta da terapia que
              não fecha.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p>
              E teve um dia em que eu decidi sentir na pele. Saí do bairro mais
              afastado da cidade e fui a pé até o hospital, do jeito que muita
              gestante do interior vai porque não tem outro jeito. Cheguei do
              outro lado entendendo uma coisa que nenhum gabinete ensina.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="titulo-impacto text-xl sm:text-2xl text-azul">
              Médico examina o paciente antes de receitar.
              <br />
              Foi isso que eu fiz com a nossa terra.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <a
              href={hrefGrupo()}
              className="inline-flex items-center gap-2.5 rounded-full bg-laranja hover:bg-laranja-escuro text-creme titulo-impacto text-lg px-8 py-4 transition-colors shadow-lg shadow-laranja/40"
            >
              <IconeWhatsApp className="w-5 h-5" />
              {site.ctaGrupo}
            </a>
          </Reveal>
        </div>
      </div>

      {/* Galeria horizontal — 🖼️✅ fotos da caminhada (Instagram do Dr.) */}
      <div className="mx-auto max-w-5xl px-5 pb-20 md:pb-24">
        <Reveal>
          <p className="titulo-impacto text-azul text-lg mb-4">
            A caminhada até o hospital:
          </p>
          <div className="flex gap-4 overflow-x-auto sem-scrollbar pb-2 -mx-5 px-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`shrink-0 rounded-xl bg-white p-2 pb-5 shadow-lg shadow-azul/10 ${
                  i % 2 ? "rotate-1" : "-rotate-1"
                }`}
              >
                <ImagePlaceholder
                  legenda={`Caminhada até o hospital — foto ${i} (originais com a campanha)`}
                  className="aspect-square w-40 sm:w-48 rounded-lg text-tinta/60 bg-neutral-200"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
