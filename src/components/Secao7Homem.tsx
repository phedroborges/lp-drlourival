import { Reveal } from "@/components/ui/Reveal";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

/**
 * SEÇÃO 7 — O HOMEM. Biografia resumida, sóbria de propósito.
 * Fundo creme limpo. Desktop: fotos à esquerda, texto à direita.
 * Celular: foto primeiro.
 */

const lastro = [
  "Mais de 20 anos de medicina em Mineiros",
  "Milhares de crianças atendidas no consultório e na urgência",
  "Professor de Medicina, formando os médicos que vão cuidar de Goiás",
  "Casado, pai de família, ficha limpa",
  "Nascido em Goiânia, criado nos valores de Santa Helena, coração em Mineiros",
];

export function Secao7Homem() {
  return (
    <section className="bg-creme py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5 grid gap-12 md:grid-cols-2 md:items-center">
        {/* Fotos — 🖼️🔍 atendendo criança + com a família */}
        <Reveal>
          <div className="space-y-6">
            <div className="-rotate-1 rounded-2xl bg-white p-3 pb-8 shadow-xl shadow-azul/10">
              <ImagePlaceholder
                legenda="Foto quente do Dr. de jaleco atendendo uma criança (autorização dos pais se identificável)"
                className="aspect-[4/3] w-full rounded-lg text-tinta/60 bg-neutral-200"
              />
            </div>
            <div className="rotate-1 rounded-2xl bg-white p-3 pb-8 shadow-xl shadow-azul/10 md:ml-10">
              <ImagePlaceholder
                legenda="Foto do Dr. com a esposa e o filho"
                className="aspect-video w-full rounded-lg text-tinta/60 bg-neutral-200"
              />
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <h2 className="titulo-impacto text-3xl sm:text-4xl text-azul">
              Antes de pedir a sua confiança,{" "}
              <span className="text-laranja">
                eu já cuidei da sua família.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <ul className="mt-8 space-y-3.5">
              {lastro.map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--laranja)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 shrink-0"
                    aria-hidden
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span className="font-semibold leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={150}>
            <p className="mt-8 text-tinta/80 leading-relaxed">
              Muita gente dessa cidade já sentou na frente do Dr. Lourival com
              um filho no colo e saiu do consultório mais leve do que entrou.
              Ele nunca precisou de política para ter o respeito do povo. Agora
              quer usar esse respeito para brigar pelo que é nosso.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
